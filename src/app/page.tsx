"use client";

import React, { useState, useEffect } from 'react';
import { usePOSStore } from '../store/store';
import Navbar from '../components/Navbar';
import HubView from '../components/HubView';
import VentasModule from '../components/VentasModule';
import InventarioModule from '../components/InventarioModule';
import CajaModule from '../components/CajaModule';
import ClientesProveedoresModule from '../components/ClientesProveedoresModule';
import CotizacionesModule from '../components/CotizacionesModule';
import ConfigSeguridadModule from '../components/ConfigSeguridadModule';
import ReportesModule from '../components/ReportesModule';
import OnboardingModule from '../components/OnboardingModule';
import LoginModule from '../components/LoginModule';
import UsuariosModule from '../components/UsuariosModule';
import ConfigNegocioModule from '../components/ConfigNegocioModule';
import ComprasModule from '../components/ComprasModule';
import KardexModule from '../components/KardexModule';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Check, Eye, EyeOff, KeyRound, ArrowLeft, Download, RefreshCw } from 'lucide-react';


export default function Home() {
  const { 
    currentModule, setModule, addLog, 
    isLicensed, activateLicense, 
    userRole, operatorName,
    appConfig, activeSession,
    login, resetPassword, recoverUsername,
    licensedModules, moduleLicenseKeys, activateModuleLicense, logout,
    products, addToCart, isDemoMode
  } = usePOSStore();

  const [serverTrialDaysLeft, setServerTrialDaysLeft] = useState<number | null>(null);

  const getTrialRemainingDays = () => {
    if (!appConfig.isConfigured) return 30;
    if (!appConfig.onboardingDate) return 30;
    const onboarding = new Date(appConfig.onboardingDate);
    const now = new Date();
    const diffTime = now.getTime() - onboarding.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  useEffect(() => {
    async function verifyTrial() {
      if (!appConfig.isConfigured) {
        setServerTrialDaysLeft(30);
        return;
      }
      
      let mId = 'WEB-' + Math.random().toString(36).substring(2);
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        mId = await (window as any).electronAPI.getMachineId();
      } else {
        let webId = localStorage.getItem('web_machine_id');
        if (!webId) {
          localStorage.setItem('web_machine_id', mId);
        } else {
          mId = webId;
        }
      }

      try {
        const res = await fetch('/api/verify-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: mId })
        });
        const data = await res.json();
        if (data.valid) {
          setServerTrialDaysLeft(data.days_left);
        } else {
          setServerTrialDaysLeft(0);
        }
      } catch(e) {
        // Fallback to local
        setServerTrialDaysLeft(getTrialRemainingDays());
      }
    }
    verifyTrial();
  }, [appConfig.isConfigured]);
  
  const trialDaysLeft = serverTrialDaysLeft !== null ? serverTrialDaysLeft : getTrialRemainingDays();
  const isTrialActive = trialDaysLeft > 0;

  useEffect(() => {
    if (!usePOSStore.getState().isDemoMode) {
      usePOSStore.getState().initStore();
    }
  }, []);

  // ============================================================
  // AUTH GUARD: Show Onboarding if not configured, Login if no session
  // ============================================================
  if (typeof window !== 'undefined') {
    // We need to guard during render - use the state directly
  }

  const [activeTab, setActiveTab] = useState('ventas');

  // Licensing/Login lock screen states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Cajero' | 'Mozo'>('Cajero');
  const [licenseInput, setLicenseInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sub-module Recovery States
  const [activeSubForm, setActiveSubForm] = useState<'login' | 'recover-password' | 'recover-username'>('login');
  
  // Recovery Password States
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryTaxId, setRecoveryTaxId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Recovery Username States
  const [usernameEmail, setUsernameEmail] = useState('');
  const [usernameTaxId, setUsernameTaxId] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [recoveredUsernames, setRecoveredUsernames] = useState<string[] | null>(null);

  // Mounted state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Installer Mode states
  const [isInstallerMode, setIsInstallerMode] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'failed'>('idle');

  // Automatically log in if activeSession is injected (e.g., Demo Mode)
  useEffect(() => {
    if (activeSession) {
      setIsLoggedIn(true);
    }
  }, [activeSession]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const isInstall = window.location.search.includes('mode=install');
      setIsInstallerMode(isInstall);

      // Listen for message callbacks from C++
      const handleMessage = (event: any) => {
        if (event.data === 'install_success') {
          setInstallStatus('success');
        } else if (event.data === 'install_failed') {
          setInstallStatus('failed');
        }
      };

      const win = window as any;
      if (win.chrome && win.chrome.webview) {
        win.chrome.webview.addEventListener('message', handleMessage);
      }

      return () => {
        const win = window as any;
        if (win.chrome && win.chrome.webview) {
          win.chrome.webview.removeEventListener('message', handleMessage);
        }
      };
    }
  }, []);

  // Automatically reset login mode and close session on Hub
  useEffect(() => {
    if (currentModule === 'hub' && !isDemoMode) {
      setIsLoggedIn(false);
      logout();
    }
  }, [currentModule, logout, isDemoMode]);

  // Monitor Global Barcode Scanner Input
  useEffect(() => {
    let accumulated = '';
    let lastTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      
      const now = Date.now();

      if (e.key === 'Enter') {
        const barcode = accumulated.trim();
        if (barcode.length >= 3) {
          const product = products.find(p => p.barcode === barcode);
          if (product) {
            // Check if input element is active
            const activeEl = document.activeElement;
            const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            
            // Only trigger if scanned rapidly or if we are not in a typing context
            const timeDiff = now - lastTime;
            const isRapid = timeDiff < 400; // Total time elapsed for typing the barcode
            const isBarcodeField = activeEl && activeEl.getAttribute('placeholder')?.toLowerCase().includes('código de barra');

            if (!isInput || isRapid || isBarcodeField) {
              e.preventDefault();
              
              // Clear input value if it was an input to avoid leaving the barcode text there
              if (isInput && activeEl instanceof HTMLInputElement) {
                activeEl.value = '';
              }
              
              // Switch module and set tab to sales
              setModule(product.storeType);
              setActiveTab('ventas');
              
              // Add to module cart
              addToCart({
                product,
                quantity: 1,
                discountPercentage: 0,
                weight: product.isBulk ? 1.0 : undefined
              });
              
              addLog(`Escaneo global: Producto '${product.name}' detectado. Redirigiendo a Ventas de ${product.storeType.toUpperCase()}.`, product.storeType);
            }
          }
        }
        accumulated = '';
      } else if (e.key.length === 1) {
        // Accumulate alphanumeric keys
        const isPrintable = /^[a-zA-Z0-9]$/.test(e.key);
        if (isPrintable) {
          // If the gap since the last character is too long, we reset
          if (now - lastTime > 150) {
            accumulated = '';
          }
          accumulated += e.key;
          lastTime = now;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, setModule, addToCart, addLog]);

  // Monitor Global F-keys for tab navigation
  useEffect(() => {
    if (!isLoggedIn) return; // Disable hotkeys when locked
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentModule === 'hub') return; // Disable shortcuts on main hub screen
      
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('ventas');
        addLog("Atajo F1 presionado - Pantalla Productos/Ventas", "Atajos");
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventario');
        addLog("Atajo F2 presionado - Pantalla Inventario", "Atajos");
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('caja');
        addLog("Atajo F3 presionado - Pantalla Caja/Corte", "Atajos");
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('reportes');
        addLog("Atajo F4 presionado - Pantalla Reportes", "Atajos");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentModule, isLoggedIn]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passwordInput.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const res = login(usernameInput, passwordInput);
    if (res.success) {
      setSuccessMsg('¡Sesión iniciada con éxito!');
      setTimeout(() => {
        setIsLoggedIn(true);
        setSuccessMsg('');
      }, 600);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleActivateModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    let mId = 'WEB-' + Math.random().toString(36).substring(2);
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      mId = await (window as any).electronAPI.getMachineId();
    } else {
      let webId = localStorage.getItem('web_machine_id');
      if (!webId) {
        localStorage.setItem('web_machine_id', mId);
      } else {
        mId = webId;
      }
    }

    const res = await activateModuleLicense(currentModule, licenseInput, mId);
    if (res.success) {
      setSuccessMsg('¡Licencia del módulo activada con éxito!');
      setTimeout(() => {
        setLicenseInput('');
        setSuccessMsg('');
      }, 1200);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !recoveryUsername.trim() ||
      !recoveryEmail.trim() ||
      !recoveryTaxId.trim() ||
      !newPassword.trim() ||
      !confirmNewPassword.trim()
    ) {
      setRecoveryError('Por favor completa todos los campos.');
      return;
    }
    if (newPassword.length < 4) {
      setRecoveryError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Las contraseñas no coinciden.');
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoverySuccess('');

    await new Promise(r => setTimeout(r, 600));

    const result = resetPassword(recoveryUsername, recoveryEmail, recoveryTaxId, newPassword);
    setRecoveryLoading(false);

    if (result.success) {
      setRecoverySuccess(result.message);
      setTimeout(() => {
        setActiveSubForm('login');
        setRecoveryUsername('');
        setRecoveryEmail('');
        setRecoveryTaxId('');
        setNewPassword('');
        setConfirmNewPassword('');
        setRecoverySuccess('');
      }, 1500);
    } else {
      setRecoveryError(result.message);
    }
  };

  const handleRecoverUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameEmail.trim() || !usernameTaxId.trim()) {
      setUsernameError('Por favor completa todos los campos.');
      return;
    }
    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess('');
    setRecoveredUsernames(null);

    await new Promise(r => setTimeout(r, 600));

    const result = recoverUsername(usernameEmail, usernameTaxId);
    setUsernameLoading(false);

    if (result.success && result.usernames) {
      setRecoveredUsernames(result.usernames);
      setUsernameSuccess(result.message);
    } else {
      setUsernameError(result.message);
    }
  };

  // Determine current active component based on dynamic state
  const renderActiveModuleComponent = () => {
    if (currentModule === 'hub') {
      return (
        <motion.div
          key="hub"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <HubView setActiveTab={setActiveTab} />
        </motion.div>
      );
    }

    let comp = <VentasModule />;
    if (activeTab === 'inventario') comp = <InventarioModule />;
    else if (activeTab === 'caja') comp = <CajaModule />;
    else if (activeTab === 'clientes') comp = <ClientesProveedoresModule />;
    else if (activeTab === 'cotizaciones') comp = <CotizacionesModule setActiveTab={setActiveTab} />;
    else if (activeTab === 'reportes') comp = <ReportesModule />;
    else if (activeTab === 'compras') comp = <ComprasModule />;
    else if (activeTab === 'kardex') comp = <KardexModule />;
    else if (activeTab === 'seguridad') comp = <ConfigSeguridadModule />;
    else if (activeTab === 'usuarios') comp = <UsuariosModule />;
    else if (activeTab === 'configuracion') comp = <ConfigNegocioModule />;

    return (
      <motion.div
        key={`${currentModule}-${activeTab}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="w-full"
      >
        {comp}
      </motion.div>
    );
  };

  // Dynamic mesh gradient bg based on active vertical (Light Mode)
  const getThemeBgClass = () => {
    switch (currentModule) {
      case 'restaurant': return 'bg-gradient-to-tr from-slate-50 via-white to-rose-50/40';
      case 'pharmacy': return 'bg-gradient-to-tr from-slate-50 via-white to-cyan-50/40';
      case 'bakery': return 'bg-gradient-to-tr from-slate-50 via-white to-amber-50/40';
      case 'fruit': return 'bg-gradient-to-tr from-slate-50 via-white to-emerald-50/40';
      case 'business': return 'bg-gradient-to-tr from-slate-50 via-white to-indigo-50/40';
      default: return 'bg-slate-50';
    }
  };

  const getBusinessName = (module: string) => {
    switch (module) {
      case 'restaurant': return 'Restaurante y Comidas';
      case 'pharmacy': return 'Farmacia y Droguería';
      case 'bakery': return 'Panadería y Pastelería';
      case 'fruit': return 'Heladería y Postres';
      case 'business': return 'Negocio y Almacén';
      default: return 'Punto de Venta';
    }
  };

  const getRegistrationTheme = (module: string) => {
    switch (module) {
      case 'restaurant':
        return {
          leftBg: 'bg-[#1e0f12]', // Deep rose-burgundy
          leftBorder: 'border-rose-950',
          rightBg: 'bg-gradient-to-tr from-slate-50 via-white to-rose-50/30',
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 focus:ring-rose-500 focus:border-rose-500',
          badgeText: '🍔 Restaurante & Comidas',
          badgeClass: 'bg-rose-950/50 border-rose-800 text-rose-300',
          glowClass: 'bg-rose-500/10',
          textColor: 'text-rose-200',
          primaryText: 'text-rose-400',
          tabActiveBgColor: '#e11d48'
        };
      case 'pharmacy':
        return {
          leftBg: 'bg-[#0a1816]', // Deep medical teal
          leftBorder: 'border-teal-950',
          rightBg: 'bg-gradient-to-tr from-slate-50 via-white to-cyan-50/30',
          btnClass: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-500 focus:ring-cyan-500 focus:border-cyan-500',
          badgeText: '💊 Farmacia & Droguería',
          badgeClass: 'bg-cyan-950/50 border-cyan-800 text-cyan-300',
          glowClass: 'bg-cyan-500/10',
          textColor: 'text-cyan-200',
          primaryText: 'text-cyan-400',
          tabActiveBgColor: '#0891b2'
        };
      case 'bakery':
        return {
          leftBg: 'bg-[#18110a]', // Deep chocolate/coffee brown
          leftBorder: 'border-amber-950',
          rightBg: 'bg-gradient-to-tr from-slate-50 via-white to-amber-50/30',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 focus:ring-amber-500 focus:border-amber-500',
          badgeText: '🥐 Panadería & Café',
          badgeClass: 'bg-amber-950/50 border-amber-800 text-amber-300',
          glowClass: 'bg-amber-500/10',
          textColor: 'text-amber-200',
          primaryText: 'text-amber-400',
          tabActiveBgColor: '#d97706'
        };
      case 'fruit':
        return {
          leftBg: 'bg-[#09180e]', // Deep forest green
          leftBorder: 'border-emerald-950',
          rightBg: 'bg-gradient-to-tr from-slate-50 via-white to-emerald-50/30',
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500',
          badgeText: '🍦 Heladería & Postres',
          badgeClass: 'bg-emerald-950/50 border-emerald-800 text-emerald-300',
          glowClass: 'bg-emerald-500/10',
          textColor: 'text-emerald-200',
          primaryText: 'text-emerald-400',
          tabActiveBgColor: '#059669'
        };
      case 'business':
      default:
        return {
          leftBg: 'bg-[#0d1521]', // Deep navy blue
          leftBorder: 'border-[#1e293b]',
          rightBg: 'bg-gradient-to-tr from-slate-50 via-white to-indigo-50/30',
          btnClass: 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700 focus:ring-indigo-500 focus:border-indigo-500',
          badgeText: '🛒 Negocio & Almacén',
          badgeClass: 'bg-[#1e293b]/50 border-slate-700 text-indigo-300',
          glowClass: 'bg-indigo-500/10',
          textColor: 'text-slate-350',
          primaryText: 'text-[#00bcd4]',
          tabActiveBgColor: '#1e293b'
        };
    }
  };

  const renderRegistrationScreen = () => {
    const theme = getRegistrationTheme(currentModule);
    const isModuleLicensed = licensedModules[currentModule] === true;
    const isModuleAccessAllowed = isTrialActive || isModuleLicensed;

    return (
      <div className="min-h-screen flex flex-col md:flex-row w-full text-[#1A1A1A] bg-[#FAF6EE]" style={{ fontFamily: "'Nunito', sans-serif" }}>
        
        {/* LEFT PANEL: CORPORATE LOGO & INFO */}
        <div className="w-full md:w-[42%] bg-[#FFFCEB] border-r-[4px] border-black flex flex-col justify-between items-center p-8 text-center min-h-[45vh] md:min-h-screen relative overflow-hidden transition-all duration-500">
          
          <div className="my-auto flex flex-col items-center">
            
            {/* Business Badge */}
            <div className="px-4 py-1.5 rounded-full border-[2.5px] border-black bg-[#FCD34D] text-black text-[10px] font-black uppercase tracking-widest mb-6 shadow-[3px_3px_0px_#000]">
              {theme.badgeText}
            </div>

            {/* Mascot Illustrations row */}
            <div className="flex gap-4 items-center justify-center mb-6 pointer-events-none select-none">
              <motion.div 
                className="w-24 h-24 p-1.5 bg-white rounded-2xl border-[2px] border-black shadow-[3px_3px_0px_#000]"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/craftpos_caja_mascot.png" alt="Mascot" className="w-full h-full object-contain" />
              </motion.div>
              <motion.div 
                className="w-24 h-24 p-1.5 bg-white rounded-2xl border-[2px] border-black shadow-[3px_3px_0px_#000]"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src="/craftpos_pan_mascot.png" alt="Mascot" className="w-full h-full object-contain" />
              </motion.div>
            </div>

            {/* CODECRAFT LOGO IMAGE */}
            <div className="relative select-none flex items-center justify-center p-2 mb-2 max-w-[220px]">
              <img 
                src="/logo_sin_nombre.png" 
                alt="CodeCraft Logo" 
                className="w-full h-auto object-contain drop-shadow-sm" 
              />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1 mt-6 text-[#1A1A1A] text-xs font-bold leading-relaxed">
              <strong className="text-black text-sm font-black">Sistema Punto de Venta</strong>
              <span>Bogotá D.C. Colombia</span>
              <span>Tel: 3232313781</span>
              
              <span className="mt-8 text-[11px] font-black text-[#D92B75]">Creado por Nelson Páez @ 2026</span>
            </div>

          </div>

          {/* CodeCraft Forge logo bottom */}
          <div className="flex items-center gap-1.5 justify-center text-black select-none pb-2">
            <span className="font-extrabold tracking-widest text-[11px]">CODECRAFT</span>
            <div className="bg-[#D92B75] text-white px-2 py-0.5 rounded border border-black font-mono text-[10px] font-black">
              &lt;/&gt;
            </div>
            <span className="font-extrabold tracking-widest text-[11px]">FORGE</span>
          </div>

        </div>

        {/* RIGHT PANEL: FORM SECTION */}
        <div className="w-full md:w-[58%] bg-[#FAF6EE] flex flex-col justify-center items-center p-8 min-h-[55vh] md:min-h-screen transition-all duration-500">
          
          <div className="bg-white border-[3px] border-black rounded-3xl p-8 shadow-[6px_6px_0px_#000] w-full max-w-[370px] flex flex-col gap-5">
            <h2 className="text-2xl font-black text-[#1A1A1A] text-center tracking-tight leading-tight uppercase">
              {getBusinessName(currentModule)}
            </h2>
            
            {/* If access is allowed, show login or recovery subforms */}
            {isModuleAccessAllowed ? (
              <AnimatePresence mode="wait">
                {activeSubForm === 'login' && (
                  <motion.div
                    key="login-subform"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                      {/* Trial active badge */}
                      {isTrialActive && !isModuleLicensed && (
                        <div className="p-2.5 bg-[#FFFCEB] border-[2px] border-black text-[#1A1A1A] rounded-xl text-[10px] font-bold text-center shadow-[2px_2px_0px_#000]">
                          ✨ Periodo de Prueba Activo: Quedan {trialDaysLeft} días gratis.
                        </div>
                      )}

                      {/* Username field */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[#1A1A1A] text-xs font-black uppercase">Nombre de usuario</label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubForm('recover-username');
                              setErrorMsg('');
                            }}
                            className="text-xs text-[#D92B75] hover:underline font-bold transition-all cursor-pointer"
                          >
                            ¿Lo olvidaste?
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="Tu usuario"
                        />
                      </div>

                      {/* Password field */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[#1A1A1A] text-xs font-black uppercase">Contraseña</label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubForm('recover-password');
                              setErrorMsg('');
                            }}
                            className="text-xs text-[#D92B75] hover:underline font-bold transition-all cursor-pointer"
                          >
                            ¿La olvidaste?
                          </button>
                        </div>
                        <div className="relative w-full">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full bg-white border-[2.5px] border-black rounded-xl pl-4 pr-10 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                            placeholder="Tu contraseña"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Error messages */}
                      {errorMsg && (
                        <div className="p-2.5 bg-[#FF8A8A] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-shake">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {/* Success messages */}
                      {successMsg && (
                        <div className="p-2.5 bg-[#4ADE80] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-bounce">
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span>{successMsg}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-3 mt-2">
                        <button
                          type="submit"
                          className="w-full bg-[#D92B75] hover:bg-[#c22466] text-white border-[2.5px] border-black py-3 rounded-xl font-bold transition-all text-sm shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="text-sm">🔐</span>
                          <span>Ingresar al Módulo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setUsernameInput('');
                            setPasswordInput('');
                            setLicenseInput('');
                            setErrorMsg('');
                            setModule('hub');
                          }}
                          className="w-full bg-white hover:bg-gray-100 text-black border-[2px] border-black py-2.5 rounded-xl font-bold transition-all text-sm shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="text-sm">⬅️</span>
                          <span>Regresar al Hub</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {activeSubForm === 'recover-password' && (
                  <motion.div
                    key="recovery-password-subform"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
                      <div>
                        <h3 className="text-sm font-black text-black uppercase tracking-tight">Recuperar Contraseña</h3>
                        <p className="text-gray-500 text-xs mt-0.5 font-bold">Ingresa tus datos registrados para restablecerla.</p>
                      </div>

                      {/* Recovery Username */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">Usuario</label>
                        <input
                          type="text"
                          required
                          value={recoveryUsername}
                          onChange={e => setRecoveryUsername(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="Nombre de usuario"
                        />
                      </div>

                      {/* Registered Email */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">Correo Registrado</label>
                        <input
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={e => setRecoveryEmail(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>

                      {/* Company NIT / Tax ID */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">NIT/RUC de la Empresa</label>
                        <input
                          type="text"
                          required
                          value={recoveryTaxId}
                          onChange={e => setRecoveryTaxId(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="NIT/RUC"
                        />
                      </div>

                      {/* New Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">Nueva Contraseña</label>
                        <div className="relative w-full">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full bg-white border-[2.5px] border-black rounded-xl pl-4 pr-10 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                            placeholder="Mínimo 4 caracteres"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(s => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">Confirmar Contraseña</label>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={e => setConfirmNewPassword(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="Repite la contraseña"
                        />
                      </div>

                      {/* Error & Success Messages */}
                      {recoveryError && (
                        <div className="p-2.5 bg-[#FF8A8A] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-shake">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">{recoveryError}</span>
                        </div>
                      )}

                      {recoverySuccess && (
                        <div className="p-2.5 bg-[#4ADE80] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-bounce">
                          <Check className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">{recoverySuccess}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2.5 mt-1">
                        <button
                          type="submit"
                          disabled={recoveryLoading}
                          className="w-full bg-[#D92B75] hover:bg-[#c22466] text-white border-[2.5px] border-black py-3 rounded-xl font-bold transition-all text-sm shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {recoveryLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <KeyRound size={16} />
                              Restablecer Contraseña
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubForm('login');
                            setRecoveryError('');
                            setRecoverySuccess('');
                          }}
                          className="w-full bg-white hover:bg-gray-100 text-black border-[2px] border-black py-2.5 rounded-xl font-bold transition-all text-sm shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          Regresar al inicio
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {activeSubForm === 'recover-username' && (
                  <motion.div
                    key="recovery-username-subform"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <form onSubmit={handleRecoverUsername} className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm font-black text-black uppercase tracking-tight">Recuperar Usuario</h3>
                        <p className="text-gray-500 text-xs mt-0.5 font-bold">Ingresa tus datos registrados para ver tus usuarios.</p>
                      </div>

                      {/* Registered Email */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">Correo Registrado</label>
                        <input
                          type="email"
                          required
                          value={usernameEmail}
                          onChange={e => setUsernameEmail(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>

                      {/* Company NIT / Tax ID */}
                      <div className="flex flex-col gap-1">
                        <label className="text-black text-xs font-black uppercase">NIT/RUC de la Empresa</label>
                        <input
                          type="text"
                          required
                          value={usernameTaxId}
                          onChange={e => setUsernameTaxId(e.target.value)}
                          className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black placeholder-gray-400 focus:outline-none focus:border-[#D92B75] transition-all text-sm font-semibold shadow-[2px_2px_0px_#000]"
                          placeholder="NIT/RUC"
                        />
                      </div>

                      {/* Error & Success Messages */}
                      {usernameError && (
                        <div className="p-2.5 bg-[#FF8A8A] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-shake">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">{usernameError}</span>
                        </div>
                      )}

                      {usernameSuccess && recoveredUsernames && (
                        <div className="flex flex-col gap-2 mt-1">
                          <div className="p-2.5 bg-[#4ADE80] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000]">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            <span className="text-xs">{usernameSuccess}</span>
                          </div>
                          <div className="bg-[#FFFCEB] border-[2px] border-black rounded-xl p-4 text-center shadow-[3px_3px_0px_#000]">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1 font-bold">Tus Usuarios:</span>
                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                              {recoveredUsernames.map(usr => (
                                <span key={usr} className="bg-white text-black border-[2px] border-black px-3 py-1 rounded-lg font-mono text-sm font-black shadow-[2px_2px_0px_#000]">
                                  {usr}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-2.5 mt-1">
                        <button
                          type="submit"
                          disabled={usernameLoading}
                          className="w-full bg-[#D92B75] hover:bg-[#c22466] text-white border-[2.5px] border-black py-3 rounded-xl font-bold transition-all text-sm shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {usernameLoading ? (
                            <div className="w-5 h-5 border-2 border-slate-450 border-t-slate-600 rounded-full animate-spin" />
                          ) : (
                            <>
                              <KeyRound size={16} />
                              Buscar Usuario
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubForm('login');
                            setUsernameError('');
                            setUsernameSuccess('');
                            setRecoveredUsernames(null);
                          }}
                          className="w-full bg-white hover:bg-gray-100 text-black border-[2px] border-black py-2.5 rounded-xl font-bold transition-all text-sm shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          Regresar al inicio
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              // If system is NOT licensed and trial is expired, render the license activation form directly
              <form onSubmit={handleActivateModuleSubmit} className="flex flex-col gap-4">
                <div className="mb-2">
                  <h3 className="text-sm font-black text-black uppercase tracking-tight">Licencia Requerida</h3>
                  <p className="text-gray-500 text-xs mt-0.5 font-bold">El periodo de prueba de 30 días ha vencido. Ingresa la clave de licencia de este módulo para continuar.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[#1A1A1A] text-xs font-black uppercase">Código de Registro del Módulo</label>
                  <input
                    type="text"
                    required
                    placeholder={`POS-${
                      currentModule === 'restaurant' ? 'REST' :
                      currentModule === 'pharmacy' ? 'PHAR' :
                      currentModule === 'bakery' ? 'BAKE' :
                      currentModule === 'fruit' ? 'FRUT' : 'BUSI'
                    }-XXXX-XXXX-XXXX-XXXX`}
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
                    className="w-full bg-white border-[2.5px] border-black rounded-xl px-4 py-2.5 text-black font-mono text-xs outline-none shadow-[2px_2px_0px_#000] uppercase font-bold"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-[#FF8A8A] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-shake">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 bg-[#4ADE80] border-[2px] border-black text-black rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] animate-bounce">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#D92B75] hover:bg-[#c22466] text-white border-[2.5px] border-black py-3 rounded-xl font-bold transition-all text-sm shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="text-sm">🔑</span>
                    <span>Activar Módulo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput('');
                      setPasswordInput('');
                      setLicenseInput('');
                      setErrorMsg('');
                      setModule('hub');
                    }}
                    className="w-full bg-white hover:bg-gray-100 text-black border-[2px] border-black py-2.5 rounded-xl font-bold transition-all text-sm shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    ⬅️ Regresar al Hub
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInstallerWizard = () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE] p-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="w-full max-w-md bg-white border-[3px] border-black rounded-3xl p-8 shadow-[6px_6px_0px_#000] relative overflow-hidden">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative select-none flex items-center justify-center p-2 mb-3 max-w-[160px]">
              <img 
                src="/logo_sin_nombre.png" 
                alt="Codecraft Logo" 
                className="w-full h-auto object-contain" 
              />
            </div>
            <h1 className="text-2xl font-black text-black tracking-tight text-center uppercase">Instalación de CraftPOS</h1>
            <p className="text-gray-500 text-xs font-bold mt-1 text-center uppercase tracking-wider">Asistente de Despliegue de Escritorio</p>
          </div>

          <div className="border-t-[2px] border-dashed border-gray-300 my-5"></div>

          {/* Setup States */}
          {installStatus === 'idle' && (
            <div className="space-y-6">
              <p className="text-gray-700 text-sm font-semibold text-center leading-relaxed">
                Este asistente copiará la aplicación y la interfaz Neobrutalista de forma permanente en tu computadora, y creará un acceso directo en tu Escritorio para un ingreso rápido de un solo clic.
              </p>
              
              <button
                onClick={() => {
                  setInstallStatus('installing');
                  const win = window as any;
                  if (win.chrome && win.chrome.webview) {
                    win.chrome.webview.postMessage("install");
                  } else {
                    // Fallback to simulate in browser
                    setTimeout(() => {
                      setInstallStatus('success');
                    }, 2500);
                  }
                }}
                className="w-full bg-[#D92B75] hover:bg-[#c22466] text-white border-[2.5px] border-black py-4 rounded-2xl font-black transition-all text-base shadow-[5px_5px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] flex items-center justify-center gap-2.5 cursor-pointer uppercase text-sm"
              >
                <Download size={18} />
                Instalar en Computadora
              </button>
            </div>
          )}

          {installStatus === 'installing' && (
            <div className="flex flex-col items-center py-6 space-y-5">
              {/* Spinner */}
              <div className="w-16 h-16 border-[4px] border-black border-t-[#D92B75] rounded-full animate-spin"></div>
              
              <div className="text-center">
                <h3 className="text-lg font-black text-black uppercase">Desplegando Archivos</h3>
                <p className="text-gray-500 text-xs font-semibold mt-1">Copiando binarios y vistas de diseño gráfico...</p>
              </div>
            </div>
          )}

          {installStatus === 'success' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-[#4ADE80] border-[3px] border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_#000] animate-bounce">
                  <Check className="w-8 h-8 text-black stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-black text-center uppercase mt-2">¡Instalado con Éxito!</h3>
                <p className="text-gray-700 text-sm font-semibold text-center leading-relaxed">
                  CraftPOS se ha configurado correctamente. Ya puedes cerrar esta ventana y abrir el sistema desde el acceso directo **CraftPOS** creado en tu Escritorio.
                </p>
              </div>

              <button
                onClick={() => {
                  window.close();
                }}
                className="w-full bg-white hover:bg-gray-50 text-black border-[2.5px] border-black py-3.5 rounded-2xl font-black transition-all text-sm shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                Cerrar Instalador
              </button>
            </div>
          )}

          {installStatus === 'failed' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-[#FF8A8A] border-[3px] border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_#000] animate-shake">
                  <ShieldAlert className="w-8 h-8 text-black stroke-[3]" />
                </div>
                <h3 className="text-xl font-black text-black text-center uppercase mt-2">Error de Escritura</h3>
                <p className="text-gray-700 text-sm font-semibold text-center leading-relaxed">
                  No se pudieron copiar los archivos de la aplicación. Asegúrate de tener permisos suficientes o de haber extraído el archivo ZIP completamente antes de ejecutar.
                </p>
              </div>

              <button
                onClick={() => setInstallStatus('idle')}
                className="w-full bg-[#FCD34D] hover:bg-[#e2bd3a] text-black border-[2.5px] border-black py-3.5 rounded-2xl font-black transition-all text-sm shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] flex items-center justify-center gap-2 cursor-pointer uppercase"
              >
                <RefreshCw size={14} className="animate-spin-slow" />
                Intentar Nuevamente
              </button>
            </div>
          )}

        </div>
      </div>
    );
  };

  // ============================================================
  // AUTH GUARD - Priority: Installer > Onboarding > Login > Main App
  // ============================================================
  
  if (!mounted) return null;

  // 0. If in Installer Wizard Mode, show the custom Next.js installation panel
  if (isInstallerMode) {
    return renderInstallerWizard();
  }

  // 1. If system has NOT been configured yet, show Onboarding wizard
  if (!appConfig.isConfigured) {
    return <OnboardingModule />;
  }

  

  // 3. Old sub-module login screen (when navigating to a business module inside the hub)
  if (!isLoggedIn && currentModule !== 'hub') {
    return renderRegistrationScreen();
  }

  // 2. Normal Flow for Licensed Application
  return (
    <div className={`min-h-screen text-slate-800 transition-all duration-700 flex flex-col ${getThemeBgClass()}`}>
      
      {/* Dynamic Navigation Header */}
      {isLoggedIn && currentModule !== 'hub' && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 py-6 flex">
        <AnimatePresence mode="wait">
          {renderActiveModuleComponent()}
        </AnimatePresence>
      </main>

      {/* Footer bar (Light Theme) */}
      <footer className="w-full border-t border-slate-200 bg-white/70 py-3.5 text-center text-[10px] text-slate-400 font-semibold font-mono">
        <div className="max-w-[1600px] mx-auto px-4 flex justify-between items-center">
          <span>Usuario: <strong className="text-slate-700 font-extrabold">{activeSession?.fullName || operatorName}</strong> ({activeSession?.role || userRole}) | {appConfig.companyName || 'Sistema POS'}</span>
          <span className="flex items-center gap-3">
            {isTrialActive ? (
              <span className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-md font-bold text-[11px] border border-yellow-400">
                Prueba: {trialDaysLeft} días gratis
              </span>
            ) : (
              <span className="bg-red-200 text-red-900 px-3 py-1 rounded-md font-bold text-[11px] border border-red-400">
                Prueba finalizada
              </span>
            )}
            <button 
              onClick={() => router.push('/promo')} 
              className="bg-[#D92B75] text-white px-4 py-1.5 rounded-md font-bold text-[11px] hover:bg-[#c22466] transition-colors border-[2px] border-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              Activar licencia
            </button>
          </span>
          <span>{appConfig.cashierName || 'Caja Principal'} | © 2026 POS</span>
        </div>
      </footer>

    </div>
  );
}
