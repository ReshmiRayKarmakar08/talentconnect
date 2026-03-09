import { useState, useRef, useEffect } from 'react'
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react'
import { aiAPI } from '../utils/api'

const SUGGESTIONS = [
  'Explain recursion in detail',
  'Difference between stack and queue in short',
  'How do I learn DSA from scratch?',
  'What skills should I learn for web development?',
  'Explain DBMS normalization in detail',
  'How does the skill verification work?',
  'How do I find a mentor on TalentConnect?',
  'Create a short roadmap for machine learning',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
        ${isUser ? 'bg-brand-600' : 'bg-surface-hover border border-surface-border'}`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-brand-400" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-brand-600 text-white rounded-tr-sm'
          : 'bg-surface-card border border-surface-border text-gray-200 rounded-tl-sm'
        }`}
        dangerouslySetInnerHTML={{
          __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
        }}
      />
    </div>
  )
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm your TalentConnect AI assistant.\n\nYou can ask me platform questions **or general study questions**.\n\nIf you want a specific style, just say:\n- **in short**\n- **in detail**\n- **step by step**\n\nExamples:\n- **Explain recursion in detail**\n- **Difference between DBMS and RDBMS in short**\n- **Give me a web development roadmap**\n\nWhat would you like to learn?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const userMsg = text || input.trim()
    if (!userMsg) return

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data } = await aiAPI.chat({ messages: newMessages })
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col p-8 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="page-header">AI Learning Assistant</h1>
            <p className="text-gray-500 text-sm">Powered by TalentConnect AI · General learning and platform help</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-surface-hover border border-surface-border flex items-center justify-center">
              <Bot size={14} className="text-brand-400" />
            </div>
            <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
            <Sparkles size={11} /> Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-hover border border-surface-border
                           text-gray-400 hover:text-brand-400 hover:border-brand-500/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask me anything. Add 'in short' or 'in detail' if you want a specific answer style."
          className="input flex-1"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
