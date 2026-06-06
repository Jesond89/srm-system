import {
  getReglas, createRegla, updateRegla,
  getAlertas, marcarLeida, marcarAtendida, contarNoLeidas, createAlerta, ejecutarMotorReglas
} from './alerts.service.js'

export const listarReglas  = async (req, res, next) => { try { res.json(await getReglas()) } catch(e){next(e)} }
export const crearRegla    = async (req, res, next) => { try { res.status(201).json(await createRegla(req.body)) } catch(e){next(e)} }
export const actualizarRegla = async (req, res, next) => {
  try { res.json(await updateRegla(req.params.id, req.body)) } catch(e){next(e)}
}

export const listarAlertas = async (req, res, next) => {
  try {
    const { leida, atendida, severidad, page, limit } = req.query
    res.json(await getAlertas({
      leida:    leida    !== undefined ? leida    === 'true' : undefined,
      atendida: atendida !== undefined ? atendida === 'true' : undefined,
      severidad, page: parseInt(page) || 1, limit: parseInt(limit) || 20
    }))
  } catch(e){next(e)}
}

export const leer     = async (req, res, next) => { try { res.json(await marcarLeida(req.params.id)) } catch(e){next(e)} }
export const atender  = async (req, res, next) => { try { res.json(await marcarAtendida(req.params.id)) } catch(e){next(e)} }
export const badge    = async (req, res, next) => { try { res.json(await contarNoLeidas()) } catch(e){next(e)} }
export const crear    = async (req, res, next) => { try { res.status(201).json(await createAlerta(req.body)) } catch(e){next(e)} }
export const ejecutar = async (req, res, next) => { try { res.json(await ejecutarMotorReglas()) } catch(e){next(e)} }
