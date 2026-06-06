/**
 * seed.js — Datos de demostración para SRM System
 *
 * Uso:
 *   node --env-file=.env src/config/seed.js
 */
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const log  = (msg) => console.log(`  ✓ ${msg}`)
const warn = (msg) => console.warn(`  ⚠ ${msg}`)

// ── Datos ─────────────────────────────────────────────────────────────────────

const USUARIOS = [
  { nombre: 'Administrador General', email: 'admin@srm.com',     rol: 'admin',     password: 'Admin1234!' },
  { nombre: 'María González',        email: 'gerente@srm.com',   rol: 'gerente',   password: 'Gerente123!' },
  { nombre: 'Carlos Herrera',        email: 'comprador@srm.com', rol: 'comprador', password: 'Comprador1!' },
  { nombre: 'Sofía Ramírez',         email: 'analista@srm.com',  rol: 'analista',  password: 'Analista12!' },
]

const PROVEEDORES = [
  { nombre: 'Aceros del Norte S.A. de C.V.',          rfc: 'ANO980615AB1', email: 'ventas@acerosnorte.com.mx',       telefono: '8181234567', direccion: 'Av. Industrial 450, Monterrey, NL',    activo: true  },
  { nombre: 'Suministros Tecnológicos del Bajío',      rfc: 'STB010322BC2', email: 'contacto@sumtecbajio.mx',         telefono: '4772345678', direccion: 'Blvd. Tecnológico 120, León, Gto.',    activo: true  },
  { nombre: 'Transportes Logísticos del Pacífico',     rfc: 'TLP950708CD3', email: 'ops@translogpacifico.com',        telefono: '3223456789', direccion: 'Carr. al Puerto km 12, Manzanillo',    activo: true  },
  { nombre: 'Empaques y Soluciones Industriales',      rfc: 'ESI870314DE4', email: 'info@empaquesysol.com.mx',        telefono: '5554567890', direccion: 'Parque Industrial Vallejo, CDMX',       activo: true  },
  { nombre: 'Ferretería Industrial del Norte',         rfc: 'FIN920501EF5', email: 'pedidos@ferreinorte.mx',          telefono: '8185678901', direccion: 'Av. Constitución 890, Monterrey, NL',   activo: true  },
  { nombre: 'Equipos de Cómputo y Tecnología',         rfc: 'ECT031128FG6', email: 'ventas@equiptech.com.mx',         telefono: '5556789012', direccion: 'Insurgentes Sur 1234, CDMX',            activo: true  },
  { nombre: 'Servicios de Limpieza y Mantenimiento',   rfc: 'SLM110205GH7', email: 'servicio@limpymant.mx',           telefono: '3337890123', direccion: 'Av. Vallarta 567, Guadalajara, Jal.',   activo: true  },
  { nombre: 'Impresos y Publicidad Digital S.A.',      rfc: 'IPD060817HI8', email: 'contacto@impresospublicidad.mx',  telefono: '5558901234', direccion: 'Polanco 345, CDMX',                    activo: true  },
  { nombre: 'Alimentos y Bebidas del Centro',          rfc: 'ABC991230IJ9', email: 'distribucion@alimentoscentro.mx', telefono: '4429012345', direccion: 'Blvd. Las Torres 200, Querétaro',       activo: true  },
  { nombre: 'Materiales de Construcción Sólidos',      rfc: 'MCS040409JK0', email: 'ventas@matconstruccion.com.mx',   telefono: '8110123456', direccion: 'Carretera Nacional 780, Monterrey, NL', activo: true  },
  { nombre: 'Consultoría en Seguridad Industrial',     rfc: 'CSI150620KL1', email: 'info@consulsegind.com',           telefono: '5551234567', direccion: 'Santa Fe 890, CDMX',                   activo: true  },
  { nombre: 'Pinturas y Recubrimientos Especiales',    rfc: 'PRE881104LM2', email: 'ventas@pintrecub.mx',             telefono: '3338765432', direccion: 'Periférico Norte 1100, Guadalajara',    activo: false },
]

const CRITERIOS = [
  { nombre: 'Calidad del producto/servicio', descripcion: 'Cumplimiento con especificaciones técnicas y estándares de calidad acordados', peso: 30, activo: true },
  { nombre: 'Cumplimiento de entrega',       descripcion: 'Porcentaje de entregas a tiempo y en la cantidad solicitada',                  peso: 25, activo: true },
  { nombre: 'Precio competitivo',            descripcion: 'Relación calidad-precio comparada con el mercado y competidores',              peso: 20, activo: true },
  { nombre: 'Servicio al cliente',           descripcion: 'Respuesta a incidencias, atención posventa y comunicación efectiva',           peso: 15, activo: true },
  { nombre: 'Documentación y cumplimiento',  descripcion: 'Entrega de facturas, certificados y documentos fiscales en tiempo',            peso: 10, activo: true },
]

const CATALOGO = [
  { nombre: 'Perfil de acero 2x2"',        descripcion: 'Perfil cuadrado de acero calibre 14',           unidad: 'pieza',    precio_referencia: 485.00,   activo: true },
  { nombre: 'Laptop Dell Latitude 5540',    descripcion: 'Laptop empresarial Intel Core i5, 16GB RAM',    unidad: 'pieza',    precio_referencia: 18500.00, activo: true },
  { nombre: 'Resma de papel bond carta',    descripcion: 'Papel bond blanco 75g, 500 hojas',              unidad: 'pieza',    precio_referencia: 120.00,   activo: true },
  { nombre: 'Tornillo hexagonal 3/8"',      descripcion: 'Tornillo galvanizado con tuerca',               unidad: 'caja',     precio_referencia: 350.00,   activo: true },
  { nombre: 'Servicio de limpieza mensual', descripcion: 'Limpieza profunda de instalaciones por mes',    unidad: 'servicio', precio_referencia: 4500.00,  activo: true },
  { nombre: 'Caja de cartón 40x30x20cm',   descripcion: 'Caja corrugada doble pared',                    unidad: 'pieza',    precio_referencia: 28.00,    activo: true },
  { nombre: 'Pintura epóxica gris',         descripcion: 'Pintura anticorrosiva para pisos industriales', unidad: 'litro',    precio_referencia: 185.00,   activo: true },
  { nombre: 'Router WiFi empresarial',      descripcion: 'Router TP-Link doble banda AC1900',             unidad: 'pieza',    precio_referencia: 3200.00,  activo: true },
  { nombre: 'Agua embotellada 20L',         descripcion: 'Garrafón de agua purificada',                   unidad: 'pieza',    precio_referencia: 55.00,    activo: true },
  { nombre: 'Extintor CO2 5kg',             descripcion: 'Extintor de dióxido de carbono con soporte',    unidad: 'pieza',    precio_referencia: 980.00,   activo: true },
]

const REGLAS = [
  { nombre: 'Score crítico',       tipo: 'score_critico',      condicion: { campo: 'score_actual', operador: '<', valor: 40    }, severidad: 'critica', activa: true },
  { nombre: 'Score bajo',          tipo: 'score_bajo',         condicion: { campo: 'score_actual', operador: '<', valor: 60    }, severidad: 'alta',    activa: true },
  { nombre: 'OC pendiente 7 días', tipo: 'oc_pendiente',       condicion: { campo: 'dias',         operador: '>', valor: 7     }, severidad: 'media',   activa: true },
  { nombre: 'Proveedor inactivo',  tipo: 'proveedor_inactivo', condicion: { campo: 'activo',       operador: '=', valor: false }, severidad: 'baja',    activa: true },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const periodoRelativo = (offset) => {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const randomBetween = (min, max) => +(Math.random() * (max - min) + min).toFixed(2)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ── Seed functions ────────────────────────────────────────────────────────────

async function seedUsuarios() {
  console.log('\n👤 Usuarios...')
  const hashed = await Promise.all(USUARIOS.map(async (u) => ({
    nombre: u.nombre, email: u.email, rol: u.rol, activo: true,
    password_hash: await bcrypt.hash(u.password, 12),
  })))
  const { data, error } = await supabase
    .from('usuarios')
    .upsert(hashed, { onConflict: 'email' })
    .select('id, email, rol')
  if (error) { warn(`Usuarios: ${error.message}`); return [] }
  data.forEach(u => log(`${u.rol.padEnd(10)} ${u.email}`))
  return data
}

async function seedProveedores(adminId) {
  console.log('\n🏭 Proveedores...')
  const { data, error } = await supabase
    .from('proveedores')
    .upsert(PROVEEDORES.map(p => ({ ...p, created_by: adminId })), { onConflict: 'rfc' })
    .select('id, nombre, activo')
  if (error) { warn(`Proveedores: ${error.message}`); return [] }
  data.forEach(p => log(`${p.activo ? 'activo  ' : 'inactivo'} ${p.nombre}`))
  return data
}

async function seedCriterios() {
  console.log('\n📋 Criterios de evaluación...')
  const { data: existing } = await supabase.from('criterios_evaluacion').select('id').eq('activo', true)
  if (existing?.length >= CRITERIOS.length) {
    log('Ya existen criterios — omitiendo')
    const { data } = await supabase.from('criterios_evaluacion').select('id, nombre, peso').eq('activo', true)
    return data
  }
  const { data, error } = await supabase.from('criterios_evaluacion').insert(CRITERIOS).select('id, nombre, peso')
  if (error) { warn(`Criterios: ${error.message}`); return [] }
  data.forEach(c => log(`${String(c.peso).padStart(3)}%  ${c.nombre}`))
  return data
}

async function seedCatalogo() {
  console.log('\n📦 Catálogo de productos...')
  const { data: existing } = await supabase.from('catalogo_productos').select('id').limit(1)
  if (existing?.length > 0) { log('Ya existe catálogo — omitiendo'); return }
  const { error } = await supabase.from('catalogo_productos').insert(CATALOGO)
  if (error) { warn(`Catálogo: ${error.message}`); return }
  log(`${CATALOGO.length} productos insertados`)
}

async function seedEvaluaciones(proveedores, criterios) {
  console.log('\n📊 Evaluaciones (últimos 6 meses)...')
  if (!criterios.length) { warn('Sin criterios — omitiendo evaluaciones'); return }

  const scoreBase = {
    'Aceros del Norte S.A. de C.V.':        88,
    'Suministros Tecnológicos del Bajío':    76,
    'Transportes Logísticos del Pacífico':   65,
    'Empaques y Soluciones Industriales':    91,
    'Ferretería Industrial del Norte':       58,
    'Equipos de Cómputo y Tecnología':       83,
    'Servicios de Limpieza y Mantenimiento': 72,
    'Impresos y Publicidad Digital S.A.':    44,
    'Alimentos y Bebidas del Centro':        79,
    'Materiales de Construcción Sólidos':    37,
    'Consultoría en Seguridad Industrial':   95,
  }

  let insertados = 0
  const activos = proveedores.filter(p => p.activo)

  for (const proveedor of activos) {
    const base = scoreBase[proveedor.nombre] || 70
    const meses = Math.floor(Math.random() * 4) + 3

    for (let m = -(meses - 1); m <= 0; m++) {
      const periodo = periodoRelativo(m)
      const score = Math.min(100, Math.max(0, randomBetween(base - 8, base + 8)))

      const { data: exists } = await supabase
        .from('evaluaciones').select('id')
        .eq('proveedor_id', proveedor.id).eq('periodo', periodo).maybeSingle()
      if (exists) continue

      const { data: evalData, error: evalErr } = await supabase
        .from('evaluaciones')
        .insert({ proveedor_id: proveedor.id, score, periodo })
        .select('id').single()
      if (evalErr) { warn(`Eval ${proveedor.nombre} ${periodo}: ${evalErr.message}`); continue }

      const detalle = criterios.map(c => ({
        evaluacion_id: evalData.id,
        criterio_id:   c.id,
        score_parcial: Math.min(100, Math.max(0, randomBetween(score - 15, score + 15))),
      }))
      const { error: detErr } = await supabase.from('evaluacion_detalle').insert(detalle)
      if (detErr) warn(`Detalle: ${detErr.message}`)
      insertados++
    }
  }
  log(`${insertados} evaluaciones insertadas`)
}

async function seedOrdenes(proveedores, usuarios) {
  console.log('\n🛒 Órdenes de compra...')
  const { data: catalogo } = await supabase.from('catalogo_productos').select('id, nombre, unidad, precio_referencia').eq('activo', true)
  if (!catalogo?.length) { warn('Sin catálogo — omitiendo órdenes'); return }

  const compradores = usuarios.filter(u => ['comprador','gerente','admin'].includes(u.rol))
  const gerentes    = usuarios.filter(u => ['gerente','admin'].includes(u.rol))
  const activos     = proveedores.filter(p => p.activo)

  const CONFIGS = [
    { estado: 'recibido',    diasAtras: 45 }, { estado: 'recibido',    diasAtras: 38 },
    { estado: 'recibido',    diasAtras: 30 }, { estado: 'en_transito', diasAtras: 12 },
    { estado: 'en_transito', diasAtras: 8  }, { estado: 'confirmado',  diasAtras: 6  },
    { estado: 'confirmado',  diasAtras: 5  }, { estado: 'enviado',     diasAtras: 4  },
    { estado: 'enviado',     diasAtras: 3  }, { estado: 'borrador',   diasAtras: 2  },
    { estado: 'borrador',   diasAtras: 2  }, { estado: 'borrador',   diasAtras: 1  },
    { estado: 'borrador',   diasAtras: 1  }, { estado: 'borrador',    diasAtras: 0  },
    { estado: 'cancelado',   diasAtras: 20 },
  ]

  let insertadas = 0
  for (const cfg of CONFIGS) {
    const proveedor = pick(activos)
    const creador   = pick(compradores)
    const aprobador = ['confirmado','en_transito','recibido'].includes(cfg.estado) ? pick(gerentes) : null
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - cfg.diasAtras)

    const { data: orden, error: ordenErr } = await supabase
      .from('ordenes_compra')
      .insert({
        proveedor_id: proveedor.id, estado: cfg.estado,
        created_by: creador.id, aprobado_by: aprobador?.id || null,
        notas: cfg.estado === 'cancelado' ? 'Proveedor no cumplió con especificaciones' : null,
        created_at: fecha.toISOString(),
      })
      .select('id').single()
    if (ordenErr) { warn(`Orden: ${ordenErr.message}`); continue }

    const numProd = Math.floor(Math.random() * 4) + 1
    const prods   = [...catalogo].sort(() => Math.random() - 0.5).slice(0, numProd)
    const productosOC = prods.map(prod => ({
      orden_id: orden.id, producto_id: prod.id, nombre: prod.nombre,
      unidad: prod.unidad, cantidad: Math.floor(Math.random() * 20) + 1,
      precio_unitario: +(prod.precio_referencia * randomBetween(0.9, 1.1)).toFixed(2),
    }))
    const { error: prodErr } = await supabase.from('productos_oc').insert(productosOC)
    if (prodErr) warn(`Productos OC: ${prodErr.message}`)
    insertadas++
  }
  log(`${insertadas} órdenes de compra insertadas`)
}

async function seedReglas() {
  console.log('\n⚙️  Reglas de alerta...')
  const { data: existing } = await supabase.from('reglas_alerta').select('id').limit(1)
  if (existing?.length > 0) { log('Ya existen reglas — omitiendo'); return [] }
  const { data, error } = await supabase.from('reglas_alerta').insert(REGLAS).select('id, nombre, tipo')
  if (error) { warn(`Reglas: ${error.message}`); return [] }
  data.forEach(r => log(r.nombre))
  return data
}

async function seedAlertas(proveedores, reglas) {
  console.log('\n🔔 Alertas...')
  // Esperar a que el trigger haya actualizado score_actual
  await new Promise(r => setTimeout(r, 1500))

  // Leer scores actualizados de BD
  const { data: provsDB } = await supabase
    .from('proveedores').select('id, nombre, score_actual, activo')

  const reglaScoreBajo    = reglas.find(r => r.tipo === 'score_bajo')
  const reglaScoreCritico = reglas.find(r => r.tipo === 'score_critico')
  const reglaInactivo     = reglas.find(r => r.tipo === 'proveedor_inactivo')

  const alertasData = []

  // Alertas por score bajo/crítico (score < 65 o score = 0 sin evaluar)
  for (const p of (provsDB || [])) {
    if (!p.activo) continue
    const score = p.score_actual ?? 0
    if (score < 65) {
      const esCritico = score < 40
      alertasData.push({
        regla_id: (esCritico ? reglaScoreCritico : reglaScoreBajo)?.id || null,
        proveedor_id: p.id,
        severidad: esCritico ? 'critica' : 'alta',
        mensaje: esCritico
          ? `Score crítico: ${p.nombre} tiene ${score.toFixed(1)} pts — requiere acción inmediata`
          : `Score bajo: ${p.nombre} tiene ${score.toFixed(1)} pts — por debajo del umbral mínimo`,
        leida: false, atendida: false,
      })
    }
  }

  // Alertas por proveedor inactivo
  for (const p of (provsDB || []).filter(p => !p.activo)) {
    alertasData.push({
      regla_id: reglaInactivo?.id || null, proveedor_id: p.id,
      severidad: 'baja', mensaje: `Proveedor inactivo: ${p.nombre} fue desactivado del sistema`,
      leida: true, atendida: false,
    })
  }

  if (!alertasData.length) { log('Sin proveedores con score bajo para generar alertas'); return }
  const { error } = await supabase.from('alertas').insert(alertasData)
  if (error) { warn(`Alertas: ${error.message}`); return }
  log(`${alertasData.length} alertas generadas`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  SRM System — Seed de datos de demo')
  console.log('═══════════════════════════════════════════')

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('\n❌ Faltan variables: SUPABASE_URL y SUPABASE_SERVICE_KEY\n')
    process.exit(1)
  }

  const usuarios    = await seedUsuarios()
  const adminUser   = usuarios.find(u => u.rol === 'admin')
  const proveedores = await seedProveedores(adminUser?.id)
  const criterios   = await seedCriterios()
  await seedCatalogo()
  await seedEvaluaciones(proveedores, criterios)
  await seedOrdenes(proveedores, usuarios)
  const reglas = await seedReglas()
  await seedAlertas(proveedores, reglas)

  console.log('\n═══════════════════════════════════════════')
  console.log('  ✅ Seed completado')
  console.log('═══════════════════════════════════════════')
  console.log('\n  Credenciales:')
  USUARIOS.forEach(u => console.log(`  ${u.rol.padEnd(10)} ${u.email.padEnd(22)} ${u.password}`))
  console.log()
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1) })
