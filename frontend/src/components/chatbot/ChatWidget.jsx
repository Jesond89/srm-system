import { useState, useRef, useEffect } from 'react'
import { chatbotService } from '../../services/chatbot.service.js'
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

const MAX_HISTORY = 6   // sliding window — máximo 6 mensajes al backend
const MAX_INPUT   = 500 // límite de caracteres

const SUGGESTIONS = [
  '¿Cuáles son los proveedores activos?',
  '¿Hay alertas activas?',
  '¿Cuáles son las últimas órdenes?',
  '¿Qué proveedor tiene el score más alto?',
]

const ChatWidget = () => {
  const [open,    setOpen]    = useState(false)
  const [input,   setInput]   = useState('')
  const [messages,setMessages]= useState([
    { role: 'model', text: '¡Hola! Soy el asistente SRM. Puedo consultarte sobre proveedores, órdenes, evaluaciones y alertas.' }
  ])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Construir historial en formato Gemini — solo últimos MAX_HISTORY mensajes
  const buildHistory = () =>
    messages
      .slice(-MAX_HISTORY)
      .filter(m => m.role !== 'error')
      .map(m => ({
        role:  m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }))

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const history = buildHistory()
      const { reply } = await chatbotService.sendMessage(msg, history)
      setMessages(prev => [...prev, { role: 'model', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'error', text: 'Error al conectar con el asistente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all"
        title="Asistente SRM"
      >
        {open
          ? <XMarkIcon className="w-6 h-6" />
          : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
      </button>

      {/* Ventana del chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-dark text-white px-4 py-3 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Asistente SRM</p>
              <p className="text-xs text-gray-400">Powered by Gemini</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : m.role === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-200 rounded-bl-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-2xl rounded-bl-sm text-sm">
                  <span className="animate-pulse">Consultando...</span>
                </div>
              </div>
            )}

            {/* Sugerencias — solo al inicio */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1 pt-1">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 px-3 py-2 flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_INPUT))}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Escribe tu pregunta..."
                rows={1}
                className="w-full resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ maxHeight: '80px' }}
              />
              <p className="text-xs text-gray-300 text-right">{input.length}/{MAX_INPUT}</p>
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="bg-primary text-white rounded-lg p-2 mb-5 hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget
