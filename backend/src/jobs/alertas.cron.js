import cron from 'node-cron'
import { ejecutarMotorReglas } from '../modules/alerts/alerts.service.js'

// Ejecuta el motor de reglas cada hora
export const iniciarCronAlertas = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Ejecutando motor de reglas de alerta...')
    try {
      const result = await ejecutarMotorReglas()
      console.log(`[CRON] Motor ejecutado: ${result.alertasCreadas} alerta(s) generada(s)`)
    } catch (err) {
      console.error('[CRON] Error en motor de alertas:', err.message)
    }
  })
  console.log('✅ Cron de alertas iniciado (cada hora)')
}
