'use client';
import React, { useState } from 'react';
import { usePOSStore } from '../store/store';
import { StoreType } from '../types/types';
import { motion } from 'framer-motion';
import { Power, User, Shield, Award, X } from 'lucide-react';

interface HubViewProps {
  setActiveTab: (tab: string) => void;
}

// ─── Module data with faceless mascot images ──────────────────────────
const modulesLeft = [
  {
    id: 'restaurant' as StoreType,
    label: 'Restaurante',
    sub: 'Mesas y Comidas',
    bg: '#FFEEDB',
    hover: '#ffd9b8',
    mascot: '/icon_restaurante_new.png',
  },
  {
    id: 'pharmacy' as StoreType,
    label: 'Farmacia',
    sub: 'Droguería y Recetas',
    bg: '#F0EBFF',
    hover: '#ded1ff',
    mascot: '/icon_farmacia_new.png',
  },
  {
    id: 'bakery' as StoreType,
    label: 'Panadería',
    sub: 'Café y Pastelería',
    bg: '#FFFCEB',
    hover: '#fff5cc',
    mascot: '/icon_panaderia_new.png',
  },
];

const modulesRight = [
  {
    id: 'fruit' as StoreType,
    label: 'Heladería',
    sub: 'Pesaje y Orgánicos',
    bg: '#EEFFE6',
    hover: '#d5ffd1',
    mascot: '/icon_fruteria_new.png',
  },
  {
    id: 'business' as StoreType,
    label: 'Negocio Gral',
    sub: 'Almacén y Retail',
    bg: '#EBF7FF',
    hover: '#d1eaff',
    mascot: '/icon_negocio_new.png',
  },
];

// ─── Button component ─────────────────────────────────────────
function ModuleButton({
  label, sub, bg, hover, mascot, onClick,
}: {
  label: string; sub: string; bg: string; hover: string;
  mascot: string; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 3, y: 3, boxShadow: '1px 1px 0px #1A1A1A', backgroundColor: hover }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={onClick}
      className="w-full border-[2.5px] border-black rounded-2xl shadow-[4px_4px_0px_#1A1A1A] flex items-center cursor-pointer text-left overflow-hidden"
      style={{ backgroundColor: bg }}
    >
      {/* Faceless Mascot image — flush with button, same background, no box */}
      <div
        className="flex-shrink-0 w-[84px] h-[84px] relative overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        <img
          src={mascot}
          alt={label}
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.15]"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      {/* Subtle separator */}
      <div className="w-px self-stretch bg-black/10" />

      {/* Label */}
      <div className="flex-1 px-4">
        <h3 className="font-black text-black text-sm uppercase tracking-wide leading-tight">{label}</h3>
        <p className="text-[11px] text-gray-500 font-bold mt-0.5">{sub}</p>
      </div>
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function HubView({ setActiveTab }: HubViewProps) {
  const { setModule, operatorName, userRole, logout } = usePOSStore();
  const [showAbout, setShowAbout] = useState(false);
  const goTo = (id: StoreType) => { setModule(id); setActiveTab('ventas'); };

  return (
    <div className="w-full flex flex-col h-[82vh] max-w-[1400px] mx-auto border-[3px] border-black rounded-[2rem] bg-[#FAF6EE] shadow-[8px_8px_0px_#000] overflow-hidden font-sans">

      {/* ── HEADER ── */}
      <div className="w-full bg-[#FFFCEB] border-b-[3px] border-black px-6 py-4 flex justify-between items-center">
        <div className="w-10" />
        <h1 className="text-2xl md:text-3xl font-black text-black tracking-wider text-center flex-1 uppercase">
          Punto de Venta
        </h1>
        <button
          onClick={() => logout()}
          className="p-2.5 rounded-2xl bg-white hover:bg-rose-50 border-[2.5px] border-black text-rose-600 shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <Power className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* ── 3-COLUMN GRID ── */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-5 p-5">

        {/* LEFT */}
        <div className="lg:col-span-1 flex flex-col gap-4 justify-center">
          {modulesLeft.map(m => (
            <ModuleButton key={m.id} {...m} onClick={() => goTo(m.id)} />
          ))}
        </div>

        {/* CENTER — Logo */}
        <div className="lg:col-span-2 bg-[#FFFCEB] border-[3px] border-black rounded-3xl flex flex-col justify-center items-center px-6 py-4 text-center shadow-[5px_5px_0px_#000]">
          <div className="select-none flex flex-col items-center justify-center w-full">
            <img
              src="/craftpos_c_only.png"
              alt="CraftPOS Logo"
              className="w-auto h-auto object-contain drop-shadow-md"
              style={{ maxHeight: '180px', mixBlendMode: 'multiply' }}
            />
            <h2 className="text-4xl font-black text-black tracking-tighter mt-2 uppercase" style={{ fontFamily: 'system-ui, sans-serif' }}>CraftPOS</h2>
          </div>
          <div className="flex flex-col gap-1 text-black text-xs font-bold leading-relaxed mt-2">
            <strong className="text-base font-black tracking-wide uppercase text-[#D92B75]">Sistema Punto de Venta</strong>
            <span>Bogotá D.C. Colombia</span>
            <span>Tel: 3232313781</span>
            <div className="flex justify-center mt-3">
              <span className="text-[#D92B75] font-black text-xs bg-white border-[2.5px] border-black px-5 py-2 rounded-full shadow-[3px_3px_0px_#000] uppercase tracking-wide">
                Creado por Nelson Páez @ 2026
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1 flex flex-col gap-4 justify-center">
          {modulesRight.map(m => (
            <ModuleButton key={m.id} {...m} onClick={() => goTo(m.id)} />
          ))}

          {/* Acerca De */}
          <motion.button
            whileHover={{ x: 3, y: 3, boxShadow: '1px 1px 0px #1A1A1A', backgroundColor: '#f9f9f9' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setShowAbout(true)}
            className="w-full bg-white border-[2.5px] border-black rounded-2xl shadow-[4px_4px_0px_#1A1A1A] flex items-center cursor-pointer text-left overflow-hidden"
          >
            <div className="flex-shrink-0 w-[84px] h-[84px] relative overflow-hidden bg-white">
              <img
                src="/icon_acerca_new.png"
                alt="Acerca de"
                className="absolute inset-0 w-full h-full object-cover object-center scale-[1.15]"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
            <div className="w-px self-stretch bg-black/10" />
            <div className="flex-1 px-4">
              <h3 className="font-black text-black text-sm uppercase tracking-wide leading-tight">Acerca de</h3>
              <p className="text-[11px] text-gray-500 font-bold mt-0.5">Desarrollador y Soporte</p>
            </div>
          </motion.button>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div className="w-full bg-[#FFFCEB] border-t-[3px] border-black px-6 py-3.5 flex justify-between items-center text-xs text-black font-black uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 stroke-[2.5]" />
          <span>Bienvenido: <strong className="text-[#D92B75]">{operatorName}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 stroke-[2.5]" />
          <span>Rol: <strong>{userRole === 'Admin' ? 'Administrador' : userRole === 'Cajero' ? 'Vendedor' : 'Mozo'}</strong></span>
        </div>
        <span>Versión 3.1.0</span>
      </div>

      {/* ── ABOUT MODAL ── */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[400px] bg-white border-[3px] border-black rounded-3xl p-6 shadow-[8px_8px_0px_#000] text-black relative text-center"
          >
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 border-[2px] border-black p-1 rounded-xl bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Mascot in modal */}
            <div className="w-28 h-28 mx-auto mb-2 relative overflow-hidden">
              <img
                src="/icon_acerca_new.png"
                alt="CraftPOS"
                className="w-full h-full object-cover scale-[1.2]"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>

            <h3 className="text-lg font-black tracking-wide uppercase">CraftPOS Pro</h3>
            <p className="text-xs text-gray-500 font-extrabold mt-1">Desarrollado con Excelencia</p>

            <div className="flex flex-col gap-2 mt-5 text-xs text-black font-bold text-left bg-[#FFFCEB] p-4 border-[2px] border-black rounded-2xl shadow-[4px_4px_0px_#000]">
              <div>👨‍💻 Desarrollador: <strong className="text-[#D92B75]">Nelson Páez</strong></div>
              <div>📅 Año de Lanzamiento: <strong>2026</strong></div>
              <div>📞 Teléfono Soporte: <strong>3232313781</strong></div>
              <div className="mt-3 pt-3 border-t-[2px] border-dashed border-black/20 text-[10px] text-gray-500 font-mono text-center">
                Licencia de Uso Indefinido Activa
              </div>
            </div>

            <button
              onClick={() => setShowAbout(false)}
              className="w-full bg-[#D92B75] hover:bg-[#c22466] text-white font-black border-[2.5px] border-black rounded-xl py-2.5 mt-5 shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
