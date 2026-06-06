import { chat } from './chatbot.service.js'

export const sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje requerido' })
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'Mensaje demasiado largo (máx 500 caracteres)' })
    }

    const result = await chat(message.trim(), history)
    res.json(result)
  } catch (e) {
    next(e)
  }
}
