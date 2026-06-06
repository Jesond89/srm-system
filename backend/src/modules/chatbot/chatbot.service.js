import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin }       from '../../config/supabase.js'
import { env }                 from '../../config/env.js'

const genAI = new GoogleGenerativeAI(env.geminiApiKey)

// ── Configuración del modelo ──────────────────────────────────────────────────
const MODEL_CONFIG = {
  model: 'gemini-2.5-flash-lite', // stable, más económico en tokens
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
const SYSTEM_PROMPT = `Eres el asistente del sistema SRM (Gestión de Proveedores). Responde siempre en español, de forma concisa y directa.
Cuando el usuario te manda datos del sistema entre corchetes [Datos del sistema], úsalos como fuente de verdad para responder.
Solo responde sobre proveedores, órdenes de compra, evaluaciones y alertas. No inventes datos que no estén en el contexto.`

// ── Intent detection — sin llamar a la IA ────────────────────────────────────
const INTENTS = [
  { name: 'proveedor',   keywords: ['proveedor','proveedores','empresa','empresas','rfc','score','categoría','categoria','activo','inactivo','distribuidor','distribuidora','supplier'] },
  { name: 'orden',       keywords: ['orden','órdenes','ordenes','compra','oc','folio','entrega','estado','pedido','compras','pedidos'] },
  { name: 'evaluacion',  keywords: ['evaluaci','calificaci','desempeño','criterio','puntaje','rendimiento'] },
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
    const { data } = await supabaseAdmin
      .from('proveedores')
      .select('nombre, rfc, categoria, score_actual, activo')
      .order('score_actual', { ascending: false })
      .limit(10)

    return data?.length
      ? `Proveedores en el sistema:\n${data.map(p =>
          `• ${p.nombre} | RFC:${p.rfc} | Categoría:${p.categoria||'—'} | Score:${p.score_actual?.toFixed(1)||'sin score'} | ${p.activo?'Activo':'Inactivo'}`
        ).join('\n')}`
      : 'No hay proveedores registrados en el sistema.'
  }

  if (intent === 'orden') {
    const { data } = await supabaseAdmin
      .from('ordenes_compra')
      .select('folio, estado, created_at, proveedores(nombre)')
      .order('created_at', { ascending: false })
      .limit(8)
    return data?.length
      ? `Órdenes de compra:\n${data.map(o => {
          const prov = Array.isArray(o.proveedores) ? o.proveedores[0]?.nombre : o.proveedores?.nombre
          return `• Folio:${o.folio} | Proveedor:${prov||'sin proveedor'} | Estado:${o.estado} | Fecha:${o.created_at?.slice(0,10)}`
        }).join('\n')}`
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

  // 3. Sliding window — máximo últimos 6 mensajes, debe empezar con 'user'
  let trimmedHistory = history.slice(-6)
  const firstUser = trimmedHistory.findIndex(m => m.role === 'user')
  if (firstUser > 0) trimmedHistory = trimmedHistory.slice(firstUser)
  else if (firstUser === -1) trimmedHistory = []

  // 4. Construir el prompt con contexto inyectado solo si aplica
  const userMessage = context
    ? `[Datos del sistema]\n${context}\n\n[Pregunta del usuario]\n${message}`
    : message

  // 5. Llamar a Gemini
  const model = genAI.getGenerativeModel({
    ...MODEL_CONFIG,
    systemInstruction: SYSTEM_PROMPT,
  })
  const chatSession = model.startChat({
    history: trimmedHistory,
  })

  const result = await chatSession.sendMessage(userMessage)
  const reply  = result.response.text().trim()

  // 6. Cachear solo respuestas sin datos dinámicos (intents generales)
  if (intent === 'general') setCache(cacheKey, reply)

  return { reply, cached: false }
}
