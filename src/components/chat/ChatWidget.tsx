'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role:    'assistant',
    content: '¡Hola! Soy Ita, asistente virtual de D\'Itaros Tours 🌍 ¿En qué puedo ayudarte? Puedo orientarte sobre destinos, precios, excursiones y más.',
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. Contáctanos por WhatsApp al +1 (809) 555-1234.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2.5, type: 'spring' }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full brand-gradient
                   shadow-lg shadow-brand-600/40 flex items-center justify-center hover:opacity-90 transition-all"
        title="Chat con Ita - IA D'Itaros"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"   initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><X className="w-6 h-6 text-white" /></motion.div>
            : <motion.div key="bot" initial={{ rotate:  90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}><MessageCircle className="w-6 h-6 text-white" /></motion.div>
          }
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center shadow">
            IA
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-44 right-6 z-40 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl shadow-navy-950/60 border border-white/10"
          >
            {/* Header */}
            <div className="navy-gradient px-5 py-4 flex items-center gap-3 border-b border-brand-600/30">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/images/logo.png" alt="D'Itaros" fill className="object-contain" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Ita · Asistente D'Itaros</h4>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  En línea · IA 24/7
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-gray-50 dark:bg-navy-950 h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'brand-gradient' : 'bg-navy-800'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot className="w-4 h-4 text-white" />
                      : <User className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'assistant'
                      ? 'bg-white dark:bg-navy-900 text-gray-800 dark:text-white rounded-tl-sm shadow-sm'
                      : 'bg-brand-600 text-white rounded-tr-sm font-medium'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-navy-900 rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/10 p-3 flex gap-2">
              <input
                ref={inputRef} type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Escribe tu consulta..."
                className="flex-1 bg-gray-50 dark:bg-navy-800 rounded-xl px-4 py-2.5 text-sm
                           text-navy-950 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35
                           focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button onClick={send} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center
                           disabled:opacity-40 hover:opacity-90 transition-all shrink-0 shadow">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
