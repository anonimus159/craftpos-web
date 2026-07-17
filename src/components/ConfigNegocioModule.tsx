'use client';
import { useState, useRef, useEffect } from 'react';
import { usePOSStore } from '@/store/store';
import { AppConfig } from '@/types/types';
import {
  Settings, Building2, DollarSign, Printer, Database,
  Upload, Save, RotateCcw, Download, AlertTriangle,
  Check, Trash2, RefreshCw
} from 'lucide-react';

const TABS = [
  { id: 'empresa', label: 'Mi Empresa', icon: Building2 },
  { id: 'moneda', label: 'Moneda e Impuestos', icon: DollarSign },
  { id: 'ticket', label: 'Ticket / Impresión', icon: Printer },
  { id: 'base', label: 'Base de Datos', icon: Database },
];

const CURRENCIES = [
  { code: 'BOB', symbol: 'Bs.', label: 'Bolivianos (Bolivia)' },
  { code: 'USD', symbol: '$', label: 'Dólares (EE.UU.)' },
  { code: 'PEN', symbol: 'S/', label: 'Soles (Perú)' },
  { code: 'COP', symbol: '$', label: 'Pesos (Colombia)' },
  { code: 'MXN', symbol: '$', label: 'Pesos (México)' },
  { code: 'ARS', symbol: '$', label: 'Pesos (Argentina)' },
  { code: 'CLP', symbol: '$', label: 'Pesos (Chile)' },
];

export default function ConfigNegocioModule() {
  const { appConfig, updateAppConfig, backupData, restoreData } = usePOSStore(s => ({
    appConfig: s.appConfig,
    updateAppConfig: s.updateAppConfig,
    backupData: s.backupData,
    restoreData: s.restoreData,
  }));

  const [tab, setTab] = useState('empresa');
  const [form, setForm] = useState<AppConfig>({ ...appConfig });
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState<'products' | 'all' | null>(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState('');
  const [printers, setPrinters] = useState<{name: string, isDefault: boolean, description: string}[]>([]);
  const logoRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.getPrinters().then((list: any[]) => {
        setPrinters(list);
      }).catch(console.error);
    }
  }, []);

  const handleSave = () => {
    updateAppConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setField = (key: keyof AppConfig, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setField('logoBase64', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleBackup = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const res = await (window as any).electronAPI.backupDatabase();
        if (res.success) {
          setRestoreSuccess('Respaldo guardado exitosamente en: ' + res.path);
          setTimeout(() => setRestoreSuccess(''), 5000);
        } else if (!res.canceled) {
          setRestoreError('Error al guardar el respaldo: ' + res.error);
        }
      } catch (e: any) {
        setRestoreError('Error al guardar el respaldo: ' + e.message);
      }
    }
  };

  const handleRestore = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const res = await (window as any).electronAPI.restoreDatabase();
        if (res.success) {
          setRestoreError('');
          setRestoreSuccess('Base de datos restaurada. El sistema se reiniciará en 2 segundos...');
          // app.relaunch() handles the actual restart in main.js
        } else if (!res.canceled) {
          setRestoreError('Error al restaurar: ' + res.error);
        }
      } catch (e: any) {
        setRestoreError('Error al restaurar: ' + e.message);
      }
    }
  };

  const handleReset = (type: 'products' | 'all') => {
    if (type === 'all') {
      localStorage.removeItem('pos_app_config');
      localStorage.removeItem('pos_app_users');
      window.location.reload();
    }
    setResetConfirm(null);
  };

  const inputClass = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm";
  const labelClass = "block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5";

  return (
    <div className="bg-[#0d1117] min-h-screen p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Configuración del Negocio</h1>
            <p className="text-white/40 text-xs">Edita los datos de tu empresa y sistema</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
          }`}
        >
          {saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> Guardar Cambios</>}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all ${
                  tab === t.id
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="flex-1 bg-[#151b27] border border-white/10 rounded-3xl p-6">

          {/* TAB: EMPRESA */}
          {tab === 'empresa' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white mb-4">Datos de la Empresa</h2>

              {/* Logo */}
              <div className="flex items-center gap-5">
                <div
                  onClick={() => logoRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white/5 flex-shrink-0"
                >
                  {form.logoBase64 ? (
                    <img src={form.logoBase64} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <Upload size={20} className="text-white/30 mb-1" />
                      <span className="text-[10px] text-white/30 text-center">Subir Logo</span>
                    </>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex-1 space-y-3">
                  <div>
                    <label className={labelClass}>Nombre del Negocio</label>
                    <input value={form.companyName} onChange={e => setField('companyName', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Slogan / Tag Line</label>
                    <input value={form.tagLine} onChange={e => setField('tagLine', e.target.value)} className={inputClass} placeholder="La mejor calidad..." />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo Identificador</label>
                  <select value={form.taxIdType} onChange={e => setField('taxIdType', e.target.value)} className={inputClass}>
                    {['NIT', 'RUC', 'CI', 'RIF', 'RFC', 'CUIT'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Número de Identificación</label>
                  <input value={form.taxId} onChange={e => setField('taxId', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input value={form.phone} onChange={e => setField('phone', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Correo Electrónico</label>
                  <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Dirección</label>
                <input value={form.address} onChange={e => setField('address', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nombre de la Caja</label>
                <input value={form.cashierName} onChange={e => setField('cashierName', e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {/* TAB: MONEDA */}
          {tab === 'moneda' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white mb-4">Moneda e Impuestos</h2>
              <div>
                <label className={labelClass}>País</label>
                <input value={form.country} onChange={e => setField('country', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Moneda</label>
                <select value={form.currency} onChange={e => {
                  const curr = CURRENCIES.find(c => c.code === e.target.value);
                  setField('currency', e.target.value);
                  if (curr) setField('currencySymbol', curr.symbol);
                }} className={inputClass}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-medium text-sm">¿Trabajas con impuestos?</p>
                    <p className="text-white/40 text-xs mt-0.5">El impuesto se aplicará en cada venta automáticamente.</p>
                  </div>
                  <button
                    onClick={() => setField('taxEnabled', !form.taxEnabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${form.taxEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.taxEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {form.taxEnabled && (
                  <div>
                    <label className={labelClass}>Tasa de Impuesto (%)</label>
                    <input type="number" value={form.taxRate} onChange={e => setField('taxRate', Number(e.target.value))} className={inputClass} min={0} max={100} step={0.5} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TICKET */}
          {tab === 'ticket' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white mb-4">Formato de Ticket e Impresión</h2>
              
              <div>
                <label className={labelClass}>Impresora Predeterminada</label>
                {printers.length > 0 ? (
                  <select 
                    value={form.ticketPrinter || ''}
                    onChange={(e) => setField('ticketPrinter', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">(No imprimir automáticamente)</option>
                    {printers.map(p => (
                      <option key={p.name} value={p.name}>{p.name} {p.isDefault ? '(Predeterminada del PC)' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white/50 text-sm italic bg-white/5 p-3 rounded-xl border border-white/10">No se detectó el motor de impresión o no hay impresoras instaladas en esta PC.</p>
                )}
                <p className="text-white/40 text-xs mt-2">Selecciona la impresora térmica conectada para imprimir recibos al instante sin ventanas emergentes.</p>
              </div>

              <div>
                <label className={labelClass}>Formato de Papel</label>
                <div className="grid grid-cols-3 gap-3">
                  {['80mm', '58mm', 'A4'].map(fmt => (
                    <button key={fmt} onClick={() => setField('printFormat', fmt as any)}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        form.printFormat === fmt
                          ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                      }`}>
                      <Printer size={20} className="mx-auto mb-2 opacity-70" />
                      <p className="text-sm font-medium">{fmt}</p>
                      <p className="text-[10px] opacity-50 mt-0.5">
                        {fmt === '80mm' ? 'Ticketera estándar' : fmt === '58mm' ? 'Ticketera mini' : 'Papel carta A4'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">Mostrar Logo en el Ticket</p>
                    <p className="text-white/40 text-xs">Imprime tu logo en la parte superior</p>
                  </div>
                  <button onClick={() => setField('ticketShowLogo', !form.ticketShowLogo)}
                    className={`w-10 h-5 rounded-full relative transition-all ${form.ticketShowLogo ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.ticketShowLogo ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">Mostrar Datos del Negocio</p>
                    <p className="text-white/40 text-xs">Nombre, teléfono y dirección</p>
                  </div>
                  <button onClick={() => setField('ticketShowBusinessData', !form.ticketShowBusinessData)}
                    className={`w-10 h-5 rounded-full relative transition-all ${form.ticketShowBusinessData ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${form.ticketShowBusinessData ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Texto al Pie del Ticket</label>
                <textarea
                  value={form.ticketCustomText}
                  onChange={e => setField('ticketCustomText', e.target.value)}
                  className={inputClass + ' resize-none h-20'}
                  placeholder="Ej. ¡Gracias por su preferencia! Volveré pronto."
                />
              </div>
            </div>
          )}

          {/* TAB: BASE DE DATOS */}
          {tab === 'base' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white mb-4">Gestión de Base de Datos</h2>

              {/* Backup */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Hacer Copia de Seguridad</p>
                    <p className="text-white/40 text-xs mt-0.5 mb-3">Exporta todos tus datos (productos, ventas, clientes) en un archivo JSON que puedes guardar en tu equipo.</p>
                    <button onClick={handleBackup}
                      className="flex items-center gap-2 bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25 px-4 py-2 rounded-xl text-sm transition-all">
                      <Download size={14} /> Descargar Respaldo (.json)
                    </button>
                  </div>
                </div>
              </div>

              {/* Restore */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RefreshCw size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Restaurar desde Copia de Seguridad</p>
                    <p className="text-white/40 text-xs mt-0.5 mb-3">Importa un archivo .db previamente guardado para recuperar tus datos.</p>
                    {restoreError && (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3">
                        <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-xs">{restoreError}</p>
                      </div>
                    )}
                    {restoreSuccess && (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3 py-2 mb-3">
                        <Check size={13} className="text-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-400 text-xs font-semibold">{restoreSuccess}</p>
                      </div>
                    )}
                    <button onClick={handleRestore}
                      className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/20 text-amber-400 hover:bg-amber-500/25 px-4 py-2 rounded-xl text-sm transition-all">
                      <Upload size={14} /> Cargar Archivo de Respaldo
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/15 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trash2 size={18} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Resetear el Sistema</p>
                    <p className="text-white/40 text-xs mt-0.5 mb-3">Elimina permanentemente la configuración y los datos del sistema. Esta acción no se puede deshacer.</p>
                    <div className="flex flex-wrap gap-2">
                      {resetConfirm === 'all' ? (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 w-full">
                          <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                          <p className="text-red-300 text-xs flex-1">¿Confirmas? Se borrará la configuración y todos los usuarios. Tendrás que volver a configurar el sistema.</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleReset('all')} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold">Confirmar</button>
                            <button onClick={() => setResetConfirm(null)} className="text-xs bg-white/10 text-white/60 px-3 py-1.5 rounded-lg">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setResetConfirm('all')}
                          className="flex items-center gap-2 bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 px-4 py-2 rounded-xl text-sm transition-all">
                          <Trash2 size={14} /> Resetear Sistema Completo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
