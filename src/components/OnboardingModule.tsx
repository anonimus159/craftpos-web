'use client';
import { useState, useRef } from 'react';
import { usePOSStore } from '@/store/store';
import { AppConfig, UserPermissions } from '@/types/types';
import { Building2, User, Lock, Eye, EyeOff, Upload, Check, ChevronRight, Globe, Printer, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const defaultPermissions: UserPermissions = {
  ventas: { access: true, nuevo: true, cobrar: true, descuentos: true, cotizaciones: true },
  inventario: { access: true, entradas: true, salidas: true, ajustes: true, exportar: true },
  caja: { access: true, apertura: true, cierre: true, movimientos: true, reportes: true },
  kardex: { access: true },
  corte: { access: true },
  reporteVentas: { access: true },
  usuarios: { access: true },
  compras: { access: true },
  otros: { access: true },
};

const CURRENCIES = [
  { code: 'BOB', symbol: 'Bs.', label: 'Bolivianos (Bolivia)' },
  { code: 'USD', symbol: '$', label: 'Dólares (EE.UU.)' },
  { code: 'PEN', symbol: 'S/', label: 'Soles (Perú)' },
  { code: 'COP', symbol: '$', label: 'Pesos (Colombia)' },
  { code: 'MXN', symbol: '$', label: 'Pesos (México)' },
  { code: 'ARS', symbol: '$', label: 'Pesos (Argentina)' },
  { code: 'CLP', symbol: '$', label: 'Pesos (Chile)' },
];

const STEPS = [
  { id: 1, label: 'Tu Negocio', icon: Building2 },
  { id: 2, label: 'Configuración', icon: Globe },
  { id: 3, label: 'Administrador', icon: User },
  { id: 4, label: 'Impresión', icon: Printer },
];

export default function OnboardingModule() {
  const completeOnboarding = usePOSStore(s => s.completeOnboarding);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1 - Business Info
  const [companyName, setCompanyName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxIdType, setTaxIdType] = useState('NIT');
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [cashierName, setCashierName] = useState('Caja Principal');

  // Step 2 - Config
  const [currency, setCurrency] = useState('BOB');
  const [currencySymbol, setCurrencySymbol] = useState('Bs.');
  const [country, setCountry] = useState('Bolivia');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(13);

  // Step 3 - Admin User
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Step 4 - Print
  const [printFormat, setPrintFormat] = useState<'80mm' | 'A4' | '58mm'>('80mm');

  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!companyName.trim()) errs.companyName = 'El nombre es obligatorio.';
    }
    if (step === 3) {
      if (!fullName.trim()) errs.fullName = 'El nombre completo es obligatorio.';
      if (!username.trim()) errs.username = 'El usuario es obligatorio.';
      if (password.length < 4) errs.password = 'La contraseña debe tener al menos 4 caracteres.';
      if (password !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => s + 1);
  };

  const handleFinish = () => {
    if (!validateStep()) return;
    const curr = CURRENCIES.find(c => c.code === currency);
    const config: AppConfig = {
      isConfigured: true,
      companyName,
      tagLine,
      address,
      email,
      phone,
      taxId,
      taxIdType,
      currency,
      currencySymbol: curr?.symbol || currencySymbol,
      country,
      taxEnabled,
      taxRate,
      logoBase64,
      cashierName,
      printFormat,
      ticketFont: 'HELVETICA',
      ticketShowLogo: true,
      ticketCustomText: '',
      ticketShowBusinessData: true,
    };
    completeOnboarding(config, {
      fullName,
      username,
      passwordHash: btoa(`${username.toLowerCase()}:${password}`),
      email: adminEmail || email,
      role: 'Admin',
      permissions: defaultPermissions,
      isActive: true,
    });
  };

  const inputClass = "w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000] focus:shadow-[0px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px]";
  const labelClass = "block text-xs font-black text-[#1A1A1A] mb-1.5 uppercase tracking-wider";
  const errorClass = "text-red-650 text-xs font-bold mt-1";

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* Mascot Left (Onboarding) */}
      <motion.div 
        className="absolute left-6 lg:left-12 top-24 hidden xl:block w-44 h-44 pointer-events-none select-none"
        animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-full h-full p-2 bg-white rounded-3xl border-[3px] border-black shadow-[5px_5px_0px_#000]">
          <img src="/craftpos_caja_mascot.png" alt="Mascota Caja" className="w-full h-full object-contain" />
        </div>
      </motion.div>

      {/* Mascot Right (Onboarding) */}
      <motion.div 
        className="absolute right-6 lg:right-12 bottom-24 hidden xl:block w-44 h-44 pointer-events-none select-none"
        animate={{ y: [0, -12, 0], rotate: [2, -2, 2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-full h-full p-2 bg-white rounded-3xl border-[3px] border-black shadow-[5px_5px_0px_#000]">
          <img src="/craftpos_pan_mascot.png" alt="Mascota Pan" className="w-full h-full object-contain" />
        </div>
      </motion.div>

      <div className="relative w-full max-w-2xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white border-[2.5px] border-black rounded-2xl px-5 py-2.5 mb-4 shadow-[4px_4px_0px_#000]">
            <div className="w-7 h-7 bg-[#D92B75] rounded-lg flex items-center justify-center border-[2px] border-black">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="text-[#1A1A1A] text-sm font-black uppercase tracking-wider">Configuración Inicial del Sistema</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-2 uppercase tracking-tight">¡Bienvenido a tu POS!</h1>
          <p className="text-gray-600 text-sm font-bold">Completa estos sencillos pasos para comenzar a facturar.</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center border-[2.5px] border-black transition-all duration-300 shadow-[3px_3px_0px_#000]
                    ${isDone ? 'bg-[#4ADE80] text-black font-black' : isActive ? 'bg-[#FCD34D] text-black font-black' : 'bg-white text-gray-400'}`}>
                    {isDone ? <Check size={18} className="stroke-[3px] text-black" /> : <Icon size={18} className="text-black" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-[#D92B75]' : isDone ? 'text-[#4ADE80]' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-12 h-0.5 mx-1 mb-4 border-t-[3.5px] border-dashed border-black" />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[8px_8px_0px_#000]">
          
          {/* STEP 1: Business Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-1 uppercase tracking-tight">Datos de tu Negocio</h2>
                <p className="text-gray-600 text-sm font-medium">Esta información aparecerá en tus tickets y reportes.</p>
              </div>

              {/* Logo Upload */}
              <div className="flex items-center gap-5">
                <div
                  onClick={() => logoRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-[2.5px] border-dashed border-black hover:border-[#D92B75] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-gray-50 hover:bg-gray-100 flex-shrink-0 shadow-[2px_2px_0px_#000]"
                >
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload size={18} className="text-black/40 mb-1" />
                      <span className="text-[10px] text-black/40 text-center font-bold">Logo</span>
                    </>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <div className="flex-1">
                  <label className={labelClass}>Nombre del Negocio *</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} placeholder="Ej. Mi Tienda Feliz" />
                  {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Slogan / Tag Line</label>
                <input value={tagLine} onChange={e => setTagLine(e.target.value)} className={inputClass} placeholder="Ej. La mejor calidad de la ciudad" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo Identificador</label>
                  <select value={taxIdType} onChange={e => setTaxIdType(e.target.value)} className={inputClass}>
                    <option>NIT</option><option>RUC</option><option>CI</option><option>RIF</option><option>RFC</option><option>CUIT</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input value={taxId} onChange={e => setTaxId(e.target.value)} className={inputClass} placeholder="Número de identificación" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="+591 77777777" />
                </div>
                <div>
                  <label className={labelClass}>Correo Electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="negocio@ejemplo.com" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Dirección</label>
                <input value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Av. Principal #123" />
              </div>

              <div>
                <label className={labelClass}>Nombre de la Caja</label>
                <input value={cashierName} onChange={e => setCashierName(e.target.value)} className={inputClass} placeholder="Caja Principal" />
              </div>
            </div>
          )}

          {/* STEP 2: Currency & Tax */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-1 uppercase tracking-tight">Moneda e Impuestos</h2>
                <p className="text-gray-600 text-sm font-medium">Configura la moneda y si tu negocio maneja impuestos.</p>
              </div>

              <div>
                <label className={labelClass}>País</label>
                <input value={country} onChange={e => setCountry(e.target.value)} className={inputClass} placeholder="Bolivia" />
              </div>

              <div>
                <label className={labelClass}>Moneda</label>
                <select
                  value={currency}
                  onChange={e => {
                    const curr = CURRENCIES.find(c => c.code === e.target.value);
                    setCurrency(e.target.value);
                    if (curr) setCurrencySymbol(curr.symbol);
                  }}
                  className={inputClass}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#FFFCEB] border-[2px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">¿Trabajas con impuestos?</p>
                    <p className="text-gray-500 text-xs mt-0.5">El impuesto se aplicará en cada venta facturada.</p>
                  </div>
                  <button
                    onClick={() => setTaxEnabled(t => !t)}
                    className={`w-12 h-6 rounded-full border-[2.5px] border-black transition-all duration-300 relative ${taxEnabled ? 'bg-[#4ADE80]' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white border border-black rounded-full absolute top-0.5 transition-all ${taxEnabled ? 'left-6.5' : 'left-0.5'}`} />
                  </button>
                </div>
                {taxEnabled && (
                  <div>
                    <label className={labelClass}>Porcentaje de Impuesto (%)</label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                      className={inputClass}
                      min={0} max={50} step={0.5}
                    />
                  </div>
                )}
              </div>

              <div className="bg-[#EEFFE6] border-[2px] border-black rounded-2xl p-4 flex items-center gap-3 shadow-[3px_3px_0px_#000] text-black">
                <DollarSign size={20} className="text-[#4ADE80] flex-shrink-0" />
                <p className="text-gray-700 text-sm font-bold">
                  Tu moneda será: <strong className="text-black">{currency} ({currencySymbol})</strong>
                  {taxEnabled ? ` con ${taxRate}% de impuesto.` : ' sin impuestos.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Admin User */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-1 uppercase tracking-tight">Usuario Administrador</h2>
                <p className="text-gray-600 text-sm font-medium">Crea el usuario principal que tendrá acceso completo al sistema.</p>
              </div>

              <div>
                <label className={labelClass}>Nombres Completos *</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Ej. Carlos Mendoza Rivera" />
                {errors.fullName && <p className={errorClass}>{errors.fullName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Usuario de Ingreso *</label>
                  <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\\s/g, ''))} className={inputClass} placeholder="admin" />
                  {errors.username && <p className={errorClass}>{errors.username}</p>}
                </div>
                <div>
                  <label className={labelClass}>Correo de Recuperación</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className={inputClass} placeholder="admin@empresa.com" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={inputClass + ' pr-12'}
                    placeholder="Mínimo 4 caracteres"
                  />
                  <button onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className={errorClass}>{errors.password}</p>}
              </div>

              <div>
                <label className={labelClass}>Confirmar Contraseña *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Repite la contraseña"
                />
                {errors.confirmPassword && <p className={errorClass}>{errors.confirmPassword}</p>}
              </div>

              <div className="bg-[#EBF7FF] border-[2px] border-black rounded-2xl p-4 flex items-start gap-3 shadow-[3px_3px_0px_#000] text-black">
                <Lock size={18} className="text-[#60A5FA] flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm font-bold">
                  El usuario administrador tendrá acceso completo a todos los módulos y podrá crear operarios con permisos selectivos.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Print Format */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-[#1A1A1A] mb-1 uppercase tracking-tight">Formato de Impresión</h2>
                <p className="text-gray-600 text-sm font-medium">¿Qué tipo de impresora usarás para los tickets de venta?</p>
              </div>

              <div className="space-y-3">
                {[
                  { value: '80mm' as const, label: 'Ticketera de 80mm', desc: 'La más común. Impresoras POS térmicas estándar.', recommended: true },
                  { value: '58mm' as const, label: 'Ticketera de 58mm', desc: 'Impresoras POS mini, portátiles o inalámbricas.' },
                  { value: 'A4' as const, label: 'Impresora A4 / Carta', desc: 'Para facturas tradicionales de oficina.' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPrintFormat(opt.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-[2.5px] border-black transition-all text-left ${
                      printFormat === opt.value
                        ? 'bg-[#FFFCEB] shadow-[4px_4px_0px_#000] translate-x-[-2px] translate-y-[-2px]'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0 ${
                      printFormat === opt.value ? 'bg-[#D92B75]' : 'bg-white'
                    }`}>
                      {printFormat === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1A1A1A] text-sm font-black">{opt.label}</span>
                        {opt.recommended && (
                          <span className="text-[10px] bg-[#EEFFE6] border border-black text-black px-2 py-0.5 rounded-full font-bold">Recomendado</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5 font-medium">{opt.desc}</p>
                    </div>
                    <Printer size={18} className="text-black" />
                  </button>
                ))}
              </div>

              <div className="bg-[#FFEEDB] border-[2px] border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000]">
                <p className="text-[#1A1A1A] font-bold text-sm mb-3">Resumen de tu configuración:</p>
                <div className="space-y-1.5 font-bold text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Negocio:</span>
                    <span className="text-black">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Moneda:</span>
                    <span className="text-black">{currency} ({currencySymbol})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Impuestos:</span>
                    <span className="text-black">{taxEnabled ? `${taxRate}%` : 'No aplica'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Administrador:</span>
                    <span className="text-black">{fullName} (@{username})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-[2px] border-dashed border-black">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="bg-white hover:bg-gray-100 text-black border-[2px] border-black px-5 py-2.5 rounded-xl shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm cursor-pointer"
              >
                ← Atrás
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-[#D92B75] hover:bg-[#c22466] text-white font-bold px-6 py-2.5 rounded-xl border-[2px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-sm cursor-pointer"
              >
                Continuar <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 bg-[#4ADE80] hover:bg-[#3ec471] text-black font-bold px-6 py-2.5 rounded-xl border-[2px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all text-sm cursor-pointer"
              >
                <Check size={16} /> ¡Comenzar!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
