'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Phone } from 'lucide-react';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  options?: { label: string; action: () => void }[];
  isTransfer?: boolean;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const WHATSAPP_NUMBER = '573232313781';
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20necesito%20ayuda%20con%20CraftPOS`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendInitialMessage = () => {
    setMessages([
      {
        id: Date.now().toString(),
        type: 'bot',
        text: '¡Hola! 👋 Soy Crafty, tu asistente virtual. ¿En qué te puedo ayudar hoy?',
        options: [
          { label: '¿Cómo funciona la prueba gratis?', action: () => handleOptionClick('¿Cómo funciona la prueba gratis?', 'Es totalmente gratis y libre de riesgos por 30 días. Al finalizar, puedes activar el sistema comprando una licencia permanente.') },
          { label: '¿Los datos van a la nube?', action: () => handleOptionClick('¿Los datos van a la nube?', 'Tus datos se guardan de forma local en tu computadora para mayor seguridad y rapidez. ¡Puedes facturar sin internet!') },
          { label: '¿Sirve para restaurantes?', action: () => handleOptionClick('¿Sirve para restaurantes?', '¡Sí! Contamos con un módulo especial para restaurantes donde puedes gestionar múltiples mesas, pedidos y cuentas separadas.') },
          { label: 'Necesito hablar con un humano', action: () => handleTransfer() }
        ]
      }
    ]);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(sendInitialMessage, 300);
    }
  }, [isOpen]);

  const handleOptionClick = (userText: string, botResponse: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), type: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    
    setTimeout(() => {
      const newBotMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'bot', 
        text: botResponse,
        options: [
          { label: 'Tengo otra duda', action: () => resetOptions() },
          { label: 'Contactar asesor por WhatsApp', action: () => handleTransfer() }
        ]
      };
      setMessages(prev => [...prev, newBotMsg]);
    }, 600);
  };

  const resetOptions = () => {
    const newBotMsg: Message = { 
      id: Date.now().toString(), 
      type: 'bot', 
      text: '¿Qué más te gustaría saber?',
      options: [
        { label: '¿Cómo funciona la prueba gratis?', action: () => handleOptionClick('¿Cómo funciona la prueba gratis?', 'Es totalmente gratis y libre de riesgos por 30 días. Al finalizar, puedes activar el sistema comprando una licencia permanente.') },
        { label: '¿Los datos van a la nube?', action: () => handleOptionClick('¿Los datos van a la nube?', 'Tus datos se guardan de forma local en tu computadora para mayor seguridad y rapidez. ¡Puedes facturar sin internet!') },
        { label: '¿Sirve para restaurantes?', action: () => handleOptionClick('¿Sirve para restaurantes?', '¡Sí! Contamos con un módulo especial para restaurantes donde puedes gestionar múltiples mesas, pedidos y cuentas separadas.') },
        { label: 'Necesito hablar con un humano', action: () => handleTransfer() }
      ]
    };
    setMessages(prev => [...prev, newBotMsg]);
  };

  const handleTransfer = () => {
    const newUserMsg: Message = { id: Date.now().toString(), type: 'user', text: 'Necesito hablar con un humano' };
    setMessages(prev => [...prev, newUserMsg]);
    
    setTimeout(() => {
      const newBotMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        type: 'bot', 
        text: 'Claro, te transferiré con uno de nuestros asesores a través de WhatsApp. ¡Ellos resolverán todas tus dudas!',
        isTransfer: true
      };
      setMessages(prev => [...prev, newBotMsg]);
    }, 600);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const text = inputValue.trim();
    setInputValue('');
    
    const newUserMsg: Message = { id: Date.now().toString(), type: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    
    // Simple keyword matching for open text
    setTimeout(() => {
      const lower = text.toLowerCase();
      if (lower.includes('precio') || lower.includes('costo') || lower.includes('vale')) {
        handleBotReply('El precio de la licencia permanente depende del módulo. Tenemos opciones de pago único muy accesibles. ¿Te gustaría hablar con un asesor para una cotización?');
      } else if (lower.includes('hola') || lower.includes('buenas')) {
        handleBotReply('¡Hola! ¿En qué te puedo ayudar hoy?');
      } else if (lower.includes('gratis') || lower.includes('prueba') || lower.includes('dias')) {
        handleBotReply('Tienes 30 días de prueba gratuita con acceso a todos los módulos sin necesidad de tarjeta de crédito.');
      } else {
        // Fallback
        handleBotReply('No estoy seguro de tener la respuesta exacta para eso. 🤔 ¿Te gustaría que te comunique con un asesor humano por WhatsApp?');
      }
    }, 800);
  };

  const handleBotReply = (text: string) => {
    const newBotMsg: Message = { 
      id: Date.now().toString(), 
      type: 'bot', 
      text,
      options: [
        { label: 'Contactar asesor por WhatsApp', action: () => handleTransfer() },
        { label: 'Volver a las opciones', action: () => resetOptions() }
      ]
    };
    setMessages(prev => [...prev, newBotMsg]);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-[350px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[70vh] bg-white border-[3px] border-black rounded-2xl shadow-[8px_8px_0px_#000] z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#D92B75] text-white p-4 border-b-[3px] border-black flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  <Bot className="w-6 h-6 text-[#D92B75]" />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Crafty Bot</h3>
                  <p className="text-xs font-bold text-white/80">Respuestas rápidas</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#FAF6EE] p-4 overflow-y-auto flex flex-col gap-4">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.type === 'bot' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-[#D92B75] flex-shrink-0 border-[2px] border-black flex items-center justify-center mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    <div className={`p-3 rounded-2xl border-[2px] border-black shadow-[3px_3px_0px_#000] font-semibold text-sm ${
                      msg.type === 'user' 
                        ? 'bg-[#FCD34D] text-black rounded-tr-none' 
                        : 'bg-white text-black rounded-tl-none'
                    }`}>
                      {msg.text}
                      
                      {msg.isTransfer && (
                        <a 
                          href={WHATSAPP_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 bg-[#25D366] hover:bg-[#1ebe57] text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border-[2px] border-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          <Phone className="w-4 h-4" />
                          Abrir WhatsApp
                        </a>
                      )}
                    </div>

                    {msg.options && (
                      <div className="flex flex-col gap-2 mt-1">
                        {msg.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={opt.action}
                            className="text-left p-2.5 bg-white hover:bg-gray-50 border-[2px] border-black rounded-xl text-xs font-bold shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-[#D92B75]"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t-[3px] border-black flex gap-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe tu duda..."
                className="flex-1 bg-[#FAF6EE] border-[2px] border-black rounded-xl px-4 py-2 text-sm font-bold outline-none focus:bg-white transition-colors"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-[#D92B75] hover:bg-[#c22466] disabled:bg-gray-400 text-white rounded-xl border-[2px] border-black flex items-center justify-center shadow-[2px_2px_0px_#000] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button (Toggles between Bot and pure WhatsApp if needed, but we make it open the Bot) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-[#D92B75] hover:bg-[#c22466] text-white p-4 rounded-full border-[3px] border-black shadow-[5px_5px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all z-50 flex items-center justify-center group"
        title="Hablar con Soporte"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-8 h-8 fill-current" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-8 h-8 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification dot */}
        {!isOpen && messages.length === 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-[#4ADE80] border-[2px] border-black rounded-full animate-pulse"></span>
        )}
      </button>
    </>
  );
}
