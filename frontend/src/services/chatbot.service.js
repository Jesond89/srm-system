import api from './api.js'

export const chatbotService = {
  sendMessage: (message, history) =>
    api.post('/chatbot/message', { message, history }).then(r => r.data),
}
