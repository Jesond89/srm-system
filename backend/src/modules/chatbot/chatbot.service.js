import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin }       from '../../config/supabase.js'
import { env }                 from '../../config/env.js'

const genAI = new GoogleGenerativeAI(env.geminiApiKey)

// ── Configuración del modelo ──────────────────────────────────────────────────
const MODEL_CONFIG = {
  model: 'gemini-1.5-flash', // más barato que pro
  generationConfig: {
    maxOutputTokens: 400,    // limita respuestas largas
    temperature:     0.3,    // más determinista = menos tokens por divagación
    topP:            0.8,
  },
}

// ── Cache simple en memoria (TTL 5 min) ──────────────────────────────────────
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null }
  return entry.value
}
function setCache(key, value) {
  // Limitar tamaño del cache a 100 entradas
  if (cache.size >= 100) cache.delete(cache.keys().next().value)
  cache.set(key, { value, ts: Date.now() })
}

// ── System prompt comprimido (< 120 tokens) ───────────────────────────────────
const SYSTEM_PROMPT = `Eres el asistente del sistema SRM (Gestión de Proveedores).
Responde en español, de forma concisa. Solo responde sobre: proveedores, órdenes de compra, evaluaciones y alertas del sistema.
Si no tienes datos suficientes, dilo brevemente. No inventes información.`

// ── Intent detection — sin llamar a la IA ────────────────────────────────────
const INTENTS = [
  { name: 'proveedor',   keywords: ['proveedor','proveedores','empresa','rfc','score','categoría','categoria','activo'] },
  { name: 'orden',       keywords: ['orden','órdenes','ordenes','compra','oc','folio','entrega','estado','pedido'] },
  { name: 'evaluacion',  keywords: ['evaluaci','score','calificaci','desempeño','criterio','puntaje'] },
  { name: 'alerta',      keywords: ['alerta','notificaci','regla','umbral','aviso'] },
]

function detectIntent(message) {
  const lower = message.toLowerCase()
  for (const intent of INTENTS) {
    if (intent.keywords.some(k => lower.includes(k))) return intent.name
  }
  return 'general'
}

// ── Fetch de contexto mínimo según intent ─────────────────────────────────────
async function fetchContext(intent, message) {
  const lower = message.toLowerCase()

  if (intent === 'proveedor') {
    // Buscar por nombre si el usuario menciona uno
    let query = supabaseAdmin
      .from('proveedores')
      .select('nombre,rfc,categoria,score_actual,activo')
      .limit(8)

    // Intentar filtrar por nombre mencionado (heurística: palabras > 3 chars)
    const words = message.match(/\b[a-záéíóúñ]{4,}\b/gi) || []
    const stopwords = ['cuál','como','tiene','están','todas','todos','dame','lista','muestra','score']
    const searchWord = words.find(w => !stopwords.includes(w.toLowerCase()))
    if (searchWord) query = query.ilike('nombre', `%${searchWord}%`)

    const { data } = await query.order('score_actual', { ascending: false })
    return data?.length
      ? `Proveedores encontrados:\n${data.map(p =>
          `• ${p.nombre} (RFC:${p.rfc}) | Cat:${p.categoria||'—'} | Score:${p.score_actual?.toFixed(1)||'—'} | ${p.activo?'Activo':'Inactivo'}`
        ).join('\n')}`
      : 'No se encontraron proveedores.'
  }

  if (intent === 'orden') {
    const { data } = await supabaseAdmin
      .from('ordenes_compra')
      .select('folio,estado,fecha_entrega_esperada,proveedores(nombre)')
      .order('created_at', { ascending: false })
      .limit(8)
    return data?.length
      ? `Últimas órdenes:\n${data.map(o =>
          `• ${o.folio} | ${o.proveedores?.nombre||'—'} | Estado:${o.estado} | Entrega:${o.fecha_entrega_esperada||'—'}`
        ).join('\n')}`
      : 'No hay órdenes registradas.'
  }

  if (intent === 'evaluacion') {
    const { data } = await supabaseAdmin
      .from('evaluaciones')
      .select('periodo,score,categoria,proveedores(nombre)')
      .order('created_at', { ascending: false })
      .limit(8)
    return data?.length
      ? `Evaluaciones recientes:\n${data.map(e =>
          `• ${e.proveedores?.nombre||'—'} | Período:${e.periodo} | Score:${e.score?.toFixed(1)} | Cat:${e.categoria}`
        ).join('\n')}`
      : 'No hay evaluaciones registradas.'
  }

  if (intent === 'alerta') {
    const { data } = await supabaseAdmin
      .from('alertas')
      .select('tipo,severidad,mensaje,leida,proveedores(nombre)')
      .eq('leida', false)
      .order('created_at', { ascending: false })
      .limit(8)
    return data?.length
      ? `Alertas activas:\n${data.map(a =>
          `• [${a.severidad}] ${a.proveedores?.nombre||'Sistema'}: ${a.mensaje}`
        ).join('\n')}`
      : 'No hay alertas activas.'
  }

  return '' // intent general — no inyectar datos
}

// ── Función principal ─────────────────────────────────────────────────────────
// history: array de { role: 'user'|'model', parts: [{text}] }
// Máximo 6 mensajes (sliding window)
export const chat = async (message, history = []) => {
  // 1. Cache check
  const cacheKey = message.trim().toLowerCase()
  const cached = getCached(cacheKey)
  if (cached) return { reply: cached, cached: true }

  // 2. Intent + contexto
  const intent  = detectIntent(message)
  const context = await fetchContext(intent, message)

  // 3. Sliding window — máximo últimos 6 mensajes
  const trimmedHistory = history.slice(-6)

  // 4. Construir el prompt con contexto inyectado solo si aplica
  const userMessage = context
    ? `[Datos del sistema]\n${context}\n\n[Pregunta del usuario]\n${message}`
    : message

  // 5. Llamar a Gemini
  const model = genAI.getGenerativeModel(MODEL_CONFIG)
  const chatSession = model.startChat({
    history: [
      { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Entendido. Estoy listo para ayudarte con el sistema SRM.' }] },
      ...trimmedHistory,
    ],
  })

  const result = await chatSession.sendMessage(userMessage)
  const reply  = result.response.text().trim()

  // 6. Cachear solo respuestas sin datos dinámicos (intents generales)
  if (intent === 'general') setCache(cacheKey, reply)

  return { reply, cached: false }
}
