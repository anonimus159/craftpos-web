import React, { useState } from 'react';
import DemoLockModal from './DemoLockModal';
import { usePOSStore } from '../store/store';
import { StoreType } from '../types/types';
import { 
  Utensils, Pill, Croissant, Apple, ShoppingCart, ShoppingBag, 
  LayoutDashboard, ShieldCheck, FileText, Users, LogOut,
  Settings, Package, BarChart3, CreditCard, UserCog, Building2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { 
    currentModule, setModule, 
    appConfig, activeSession, logout,
    isDemoMode, exitDemoMode
  } = usePOSStore(s => ({
    currentModule: s.currentModule,
    setModule: s.setModule,
    appConfig: s.appConfig,
    activeSession: s.activeSession,
    logout: s.logout,
    isDemoMode: s.isDemoMode,
    exitDemoMode: s.exitDemoMode,
  }));

  const [showDemoModal, setShowDemoModal] = useState(false);

  const handleTabClick = (tabId: string) => {
    if (isDemoMode && (tabId === 'configuracion' || tabId === 'usuarios')) {
      setShowDemoModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const getThemeColor = () => {
    switch (currentModule) {
      case 'restaurant': return 'from-rose-50 via-white to-rose-50 border-rose-200/80 text-rose-950 shadow-sm';
      case 'pharmacy': return 'from-cyan-50 via-white to-cyan-50 border-cyan-200/80 text-cyan-950 shadow-sm';
      case 'bakery': return 'from-amber-50 via-white to-amber-50 border-amber-200/80 text-amber-950 shadow-sm';
      case 'fruit': return 'from-emerald-50 via-white to-emerald-50 border-emerald-200/80 text-emerald-950 shadow-sm';
      case 'business': return 'from-indigo-50 via-white to-indigo-50 border-indigo-200/80 text-indigo-950 shadow-sm';
      default: return 'from-slate-50/80 via-white to-slate-50/80 border-slate-200 text-slate-800 shadow-sm';
    }
  };

  const getActiveColor = () => {
    switch (currentModule) {
      case 'restaurant': return 'bg-rose-500 border-rose-400 text-white shadow-md shadow-rose-500/20';
      case 'pharmacy': return 'bg-cyan-500 border-cyan-400 text-white shadow-md shadow-cyan-500/20';
      case 'bakery': return 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20';
      case 'fruit': return 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20';
      case 'business': return 'bg-indigo-500 border-indigo-400 text-white shadow-md shadow-indigo-500/20';
      default: return 'bg-slate-800 border-slate-700 text-white';
    }
  };

  const getActiveTabClass = (tabId: string) => {
    const base = "px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 border whitespace-nowrap ";
    if (activeTab === tabId) return base + getActiveColor();
    return base + "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  };

  const isAdmin = activeSession?.role === 'Admin';
  const perms = activeSession?.permissions;

  const tabs = [
    { id: 'ventas', label: 'Ventas', icon: <CreditCard size={13} />, show: true, shortcut: 'F1' },
    { id: 'inventario', label: 'Inventario', icon: <Package size={13} />, show: perms?.inventario?.access ?? isAdmin, shortcut: 'F2' },
    { id: 'caja', label: 'Caja/Corte', icon: <BarChart3 size={13} />, show: perms?.caja?.access ?? isAdmin, shortcut: 'F3' },
    { id: 'reportes', label: 'Reportes', icon: <BarChart3 size={13} />, show: perms?.reporteVentas?.access ?? isAdmin, shortcut: 'F4' },
    { id: 'compras', label: 'Compras', icon: <ShoppingBag size={13} />, show: perms?.compras?.access ?? isAdmin },
    { id: 'kardex', label: 'Kardex', icon: <BarChart3 size={13} />, show: perms?.kardex?.access ?? isAdmin },
    { id: 'clientes', label: 'Clientes', icon: <Users size={13} />, show: true },
    { id: 'cotizaciones', label: 'Cotizaciones', icon: <FileText size={13} />, show: perms?.ventas?.cotizaciones ?? isAdmin },
    { id: 'usuarios', label: 'Usuarios', icon: <UserCog size={13} />, show: perms?.usuarios?.access ?? isAdmin },
    { id: 'configuracion', label: 'Configuración', icon: <Settings size={13} />, show: isAdmin },
  ].filter(t => t.show);

  const moduleLabel = {
    restaurant: 'Restaurante',
    pharmacy: 'Farmacia',
    bakery: 'Panadería',
    fruit: 'Heladería',
    business: 'Negocio',
    hub: 'Hub',
  }[currentModule] || 'Sistema';

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md bg-gradient-to-r ${getThemeColor()} transition-colors duration-500`}>
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {/* LOGO & BRANDING */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {appConfig.logoBase64 ? (
            <img
              src={appConfig.logoBase64}
              alt="Logo"
              className="w-9 h-9 object-contain rounded-xl border border-slate-200 cursor-pointer"
              onClick={() => setModule('hub')}
            />
          ) : (
            <img
              src="/logo_sin_nombre.png"
              alt="CraftPOS Logo"
              className="w-9 h-9 object-contain rounded-xl cursor-pointer"
              onClick={() => setModule('hub')}
            />
          )}
          <div className="cursor-pointer" onClick={() => setModule('hub')}>
            <p className="font-extrabold text-sm tracking-wide text-slate-900 leading-none">
              {appConfig.companyName || 'POS Sistema'}
            </p>
            {currentModule !== 'hub' && (
              <p className="text-[10px] text-slate-400 font-medium">{moduleLabel} · {appConfig.cashierName || 'Caja'}</p>
            )}
          </div>

          {/* Active indicator */}
          {currentModule !== 'hub' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] text-slate-600 font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {moduleLabel}
            </span>
          )}
        </div>

        {/* PRIMARY TABS */}
        {currentModule !== 'hub' && (
          <nav className="flex flex-wrap gap-1.5 justify-center">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={getActiveTabClass(tab.id)}>
                {tab.icon}
                {tab.label}
                {tab.shortcut && <span className="text-[9px] opacity-60">[{tab.shortcut}]</span>}
              </button>
            ))}
          </nav>
        )}

        {/* RIGHT: User info + Logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {activeSession && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {activeSession.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-bold text-slate-800 leading-none">{activeSession.fullName}</span>
                <span className="text-[9px] text-slate-400 font-medium">{activeSession.role}</span>
              </div>
            </div>
          )}

          {currentModule !== 'hub' && (
            <button
              onClick={() => setModule('hub')}
              className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <LayoutDashboard size={13} />
              Hub
            </button>
          )}

          <button
            onClick={() => isDemoMode ? exitDemoMode() : logout()}
            className="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            title={isDemoMode ? "Salir de Demo" : "Cerrar sesión"}
          >
            <LogOut size={13} />
            {isDemoMode ? "Salir de Demo" : "Salir"}
          </button>
        </div>

      </div>
      
      {showDemoModal && (
        <DemoLockModal onClose={() => setShowDemoModal(false)} />
      )}
    </header>
  );
}
