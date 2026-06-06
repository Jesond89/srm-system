/**
 * Servicio de generación de reportes PDF
 * Usa jsPDF + jspdf-autotable para generar reportes descargables
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND_COLOR = [99, 102, 241]   // indigo-500 (primary)
const GRAY        = [107, 114, 128]
const LIGHT_GRAY  = [243, 244, 246]

// ── Encabezado estándar ───────────────────────────────────────────────────────
const addHeader = (doc, titulo, subtitulo = '') => {
  // Banda superior
  doc.setFillColor(...BRAND_COLOR)
  doc.rect(0, 0, 210, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SRM System', 14, 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión de Relaciones con Proveedores', 14, 16)

  // Título del reporte
  doc.setTextColor(...BRAND_COLOR)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(titulo, 14, 34)

  if (subtitulo) {
    doc.setTextColor(...GRAY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitulo, 14, 40)
  }

  // Fecha de generación (derecha)
  doc.setTextColor(...GRAY)
  doc.setFontSize(8)
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    196, 34, { align: 'right' }
  )

  return subtitulo ? 48 : 42
}

// ── Pie de página ─────────────────────────────────────────────────────────────
const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...LIGHT_GRAY)
    doc.line(14, 283, 196, 283)
    doc.setTextColor(...GRAY)
    doc.setFontSize(8)
    doc.text('SRM System — Confidencial', 14, 288)
    doc.text(`Página ${i} de ${pageCount}`, 196, 288, { align: 'right' })
  }
}

// ── Reporte: Ranking de proveedores ──────────────────────────────────────────
export const generarReporteProveedores = (proveedores) => {
  const doc = new jsPDF()
  const startY = addHeader(doc, 'Ranking de Proveedores', `Total: ${proveedores.length} proveedores`)

  // Resumen rápido
  const activos   = proveedores.filter(p => p.activo).length
  const conScore  = proveedores.filter(p => p.score_actual).length
  const promedio  = conScore
    ? (proveedores.filter(p => p.score_actual).reduce((a, p) => a + p.score_actual, 0) / conScore).toFixed(1)
    : '—'

  doc.setFillColor(...LIGHT_GRAY)
  doc.roundedRect(14, startY, 55, 18, 2, 2, 'F')
  doc.roundedRect(73, startY, 55, 18, 2, 2, 'F')
  doc.roundedRect(132, startY, 55, 18, 2, 2, 'F')

  const kpiY = startY + 7
  const numStyle = { align: 'center' }

  doc.setTextColor(...BRAND_COLOR)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(String(activos), 41, kpiY, numStyle)
  doc.text(String(conScore), 100, kpiY, numStyle)
  doc.text(String(promedio), 159, kpiY, numStyle)

  doc.setTextColor(...GRAY)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Activos', 41, kpiY + 6, numStyle)
  doc.text('Con evaluación', 100, kpiY + 6, numStyle)
  doc.text('Score promedio', 159, kpiY + 6, numStyle)

  // Tabla
  autoTable(doc, {
    startY: startY + 24,
    head: [['#', 'Proveedor', 'RFC', 'Categoría', 'Estado', 'Score']],
    body: proveedores.map((p, i) => [
      i + 1,
      p.nombre,
      p.rfc || '—',
      p.categoria || '—',
      p.activo ? 'Activo' : 'Inactivo',
      p.score_actual ? `${p.score_actual.toFixed(1)} pts` : 'Sin evaluar',
    ]),
    headStyles: { fillColor: BRAND_COLOR, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center' },
      5: { halign: 'center', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      // Colorear score según valor
      if (data.column.index === 5 && data.section === 'body') {
        const val = parseFloat(data.cell.raw)
        if (!isNaN(val)) {
          data.cell.styles.textColor = val >= 80 ? [22, 163, 74] : val >= 60 ? [202, 138, 4] : [220, 38, 38]
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`reporte-proveedores-${Date.now()}.pdf`)
}

// ── Reporte: Evaluaciones ─────────────────────────────────────────────────────
export const generarReporteEvaluaciones = (evaluaciones) => {
  const doc = new jsPDF()
  const startY = addHeader(doc, 'Reporte de Evaluaciones', `${evaluaciones.length} evaluaciones registradas`)

  autoTable(doc, {
    startY,
    head: [['Fecha', 'Proveedor', 'Score', 'Criterios evaluados']],
    body: evaluaciones.map(e => {
      const nombre = Array.isArray(e.proveedores) ? e.proveedores[0]?.nombre : e.proveedores?.nombre
      const criteriosCount = e.detalle_criterios ? Object.keys(e.detalle_criterios).length : '—'
      return [
        new Date(e.created_at).toLocaleDateString('es-MX'),
        nombre || '—',
        e.score ? `${e.score.toFixed(1)} pts` : '—',
        criteriosCount,
      ]
    }),
    headStyles: { fillColor: BRAND_COLOR, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      2: { halign: 'center', fontStyle: 'bold' },
      3: { halign: 'center' },
    },
    didDrawCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        const val = parseFloat(data.cell.raw)
        if (!isNaN(val)) {
          data.cell.styles.textColor = val >= 80 ? [22, 163, 74] : val >= 60 ? [202, 138, 4] : [220, 38, 38]
        }
      }
    },
  })

  addFooter(doc)
  doc.save(`reporte-evaluaciones-${Date.now()}.pdf`)
}

// ── Reporte: Órdenes de compra ────────────────────────────────────────────────
export const generarReporteOrdenes = (ordenes) => {
  const doc = new jsPDF()
  const startY = addHeader(doc, 'Reporte de Órdenes de Compra', `${ordenes.length} órdenes`)

  const estadoLabel = {
    pendiente:  'Pendiente',
    aprobada:   'Aprobada',
    en_proceso: 'En proceso',
    entregada:  'Entregada',
    cancelada:  'Cancelada',
  }

  autoTable(doc, {
    startY,
    head: [['Folio', 'Proveedor', 'Estado', 'Total (MXN)', 'Fecha']],
    body: ordenes.map(o => {
      const proveedor = Array.isArray(o.proveedores) ? o.proveedores[0]?.nombre : o.proveedores?.nombre
      const total = o.total != null
        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(o.total)
        : '—'
      return [
        o.folio,
        proveedor || '—',
        estadoLabel[o.estado] || o.estado,
        total,
        new Date(o.created_at).toLocaleDateString('es-MX'),
      ]
    }),
    headStyles: { fillColor: BRAND_COLOR, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30 },
      2: { halign: 'center' },
      3: { halign: 'right' },
    },
  })

  addFooter(doc)
  doc.save(`reporte-ordenes-${Date.now()}.pdf`)
}
