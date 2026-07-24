"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Download, Key, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function GraciasContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const sessionId = searchParams.get('session_id') || '';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1A1A1A] font-sans relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D92B75]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-2xl bg-white rounded-[32px] p-8 md:p-12 border-[4px] border-black shadow-[12px_12px_0px_#000] relative z-10 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 border-[3px] border-black shadow-[4px_4px_0px_#000]"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">¡Pago Exitoso!</h1>
        <p className="text-lg text-gray-600 font-medium mb-10">
          Tu licencia ha sido generada correctamente. Bienvenido a la familia <span className="font-bold text-black">CraftPOS</span>.
        </p>

        <div className="bg-gray-50 border-[2px] border-black rounded-2xl p-6 text-left mb-10 shadow-[4px_4px_0px_#D92B75]">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
            <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">?</span>
            ¿Qué sigue ahora?
          </h3>
          
          <ul className="space-y-6">
            <motion.li 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 shrink-0 bg-[#D92B75]/10 rounded-xl flex items-center justify-center border border-[#D92B75]/20">
                <Mail className="w-5 h-5 text-[#D92B75]" />
              </div>
              <div>
                <strong className="block text-black mb-1">Revisa tu correo electrónico</strong>
                <p className="text-sm text-gray-500 font-medium">Te enviamos tu nueva <span className="font-bold text-black">Clave de Licencia</span>. Si no lo ves, revisa la carpeta de Spam.</p>
              </div>
            </motion.li>

            <motion.li 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 shrink-0 bg-[#D92B75]/10 rounded-xl flex items-center justify-center border border-[#D92B75]/20">
                <Download className="w-5 h-5 text-[#D92B75]" />
              </div>
              <div>
                <strong className="block text-black mb-1">Descarga el Software</strong>
                <p className="text-sm text-gray-500 font-medium">Instala CraftPOS en la computadora donde vas a administrar tus ventas.</p>
              </div>
            </motion.li>

            <motion.li 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 shrink-0 bg-[#D92B75]/10 rounded-xl flex items-center justify-center border border-[#D92B75]/20">
                <Key className="w-5 h-5 text-[#D92B75]" />
              </div>
              <div>
                <strong className="block text-black mb-1">Activa tu Licencia</strong>
                <p className="text-sm text-gray-500 font-medium">Abre el programa, ve a Configuración &gt; Seguridad y pega tu clave.</p>
              </div>
            </motion.li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/promo"
            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-4 px-6 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            <Home className="w-5 h-5" />
            Volver al Inicio
          </Link>
          <a 
            href="https://wa.me/1234567890?text=Hola,%20acabo%20de%20comprar%20CraftPOS%20y%20necesito%20ayuda."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#D92B75] text-white font-bold py-4 px-6 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#000] transition-all"
          >
            Contactar Soporte
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
        
        {sessionId && (
          <p className="mt-8 text-xs text-gray-400 font-medium">
            ID de Transacción: {sessionId}
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default function GraciasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center font-bold text-black">Cargando...</div>}>
      <GraciasContent />
    </Suspense>
  );
}
