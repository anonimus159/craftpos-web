import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Download, X } from 'lucide-react';

interface DemoLockModalProps {
  onClose: () => void;
}

export default function DemoLockModal({ onClose }: DemoLockModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white border-[4px] border-black rounded-3xl p-8 shadow-[12px_12px_0px_#000] text-center relative overflow-hidden"
      >
        {/* Decoración de fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#D92B75]/20 rounded-full blur-2xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 border-[2px] border-black p-1.5 rounded-xl bg-white hover:bg-gray-100 transition-all cursor-pointer shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] z-10"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>

        <div className="mx-auto w-20 h-20 bg-[#FAF6EE] border-[3px] border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_#000] mb-6 transform -rotate-3">
          <Lock className="w-10 h-10 text-[#D92B75] stroke-[2.5]" />
        </div>

        <h3 className="text-2xl font-black text-black mb-3 uppercase tracking-tight leading-none">
          Función Protegida
        </h3>
        
        <p className="text-gray-600 font-bold mb-8 text-sm md:text-base px-2">
          Esta función está bloqueada en la demostración web para mantener la integridad del entorno de prueba. 
          <br /><br />
          Descarga <strong className="text-black">CraftPOS</strong> gratis para instalarlo en tu PC y acceder a todas las configuraciones administrativas sin límites.
        </p>

        <div className="flex flex-col gap-3">
          <a
            href="/CraftPOS-Instalador.zip"
            download
            className="w-full bg-black text-white font-black py-4 rounded-xl border-[3px] border-black shadow-[6px_6px_0px_#D92B75] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#D92B75] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            DESCARGAR GRATIS
          </a>
          
          <button
            onClick={onClose}
            className="w-full bg-white text-black font-black py-3 rounded-xl border-[3px] border-black shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000] active:translate-y-[4px] active:shadow-none transition-all mt-2 cursor-pointer"
          >
            ENTENDIDO
          </button>
        </div>
      </motion.div>
    </div>
  );
}
