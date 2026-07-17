import React, { useState, useEffect } from 'react';
import { usePOSStore, generateLicenseKey } from '../store/store';
import { 
  Shield, UserCheck, Key, FileText, Download, Upload, Check, 
  Trash2, Database, AlertCircle, AlertTriangle, User, Award, ShieldAlert, Copy,
  Building, Settings2, Users, MapPin, Plus, Lock, ShieldCheck
} from 'lucide-react';

export default function ConfigSeguridadModule() {
  const {
    userRole,
    setUserRole,
    auditLogs,
    backupData,
    restoreData,
    addLog,
    isLicensed,
    licenseKey,
    deactivateLicense,
    companyConfig,
    dianConfig,
    branches,
    activeBranchId,
    setActiveBranch,
    activeRegisterId,
    setActiveRegister,
    updateCompanyConfig,
    updateDianConfig
  } = usePOSStore();

  const [activeSubTab, setActiveSubTab] = useState<'company' | 'policies' | 'users' | 'branches' | 'backups'>('company');

  // --- Company Settings state ---
  const [compSettings, setCompSettings] = useState({
    name: companyConfig.name,
    socialReason: companyConfig.socialReason,
    nit: companyConfig.nit,
    address: companyConfig.address,
    phone: companyConfig.phone,
    email: companyConfig.email,
    currency: companyConfig.currency,
    taxRate: companyConfig.taxRate.toString()
  });

  // --- Policies settings state ---
  const [policies, setPolicies] = useState({
    allowDiscounts: companyConfig.allowDiscounts,
    maxDiscount: companyConfig.maxDiscount.toString(),
    requireDiscountAuth: companyConfig.requireDiscountAuth,
    allowReturns: companyConfig.allowReturns,
    negativeInventoryAllowed: companyConfig.negativeInventoryAllowed,
    alertReposition: companyConfig.alertReposition
  });

  // --- Users management state ---
  const [localUsers, setLocalUsers] = useState([
    { id: 'u1', username: 'Administrador General', role: 'Admin', status: 'Activo' },
    { id: 'u2', username: 'Cajero Principal', role: 'Cajero', status: 'Activo' },
    { id: 'u3', username: 'Mesero Turno A', role: 'Mozo', status: 'Activo' }
  ]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Cajero' | 'Mozo'>('Cajero');

  // --- Branches and Cajas state ---
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');

  // --- Backups & License states ---
  const [backupJson, setBackupJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const [autoBackup, setAutoBackup] = useState(companyConfig.autoBackup);
  const [backupFreq, setBackupFreq] = useState<'diario' | 'semanal' | 'mensual'>(companyConfig.backupFrequency);
  const [backupPath, setBackupPath] = useState(companyConfig.backupLocation);

  // License Generator States
  const [masterPassword, setMasterPassword] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [machineId, setMachineId] = useState<string>('Calculando...');

  useEffect(() => {
    const fetchMachineId = async () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const id = await (window as any).electronAPI.getMachineId();
        setMachineId(id);
      } else {
        let webId = localStorage.getItem('web_machine_id');
        if (!webId) {
          webId = 'WEB-' + Math.random().toString(36).substring(2);
          localStorage.setItem('web_machine_id', webId);
        }
        setMachineId(webId);
      }
    };
    fetchMachineId();
  }, []);
  const [confirmAction, setConfirmAction] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [isKeyCopied, setIsKeyCopied] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Submits & Actions ---
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyConfig({
      name: compSettings.name,
      socialReason: compSettings.socialReason,
      nit: compSettings.nit,
      address: compSettings.address,
      phone: compSettings.phone,
      email: compSettings.email,
      currency: compSettings.currency,
      taxRate: parseFloat(compSettings.taxRate) || 0
    });
    showToast('Configuración de empresa guardada con éxito.');
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyConfig({
      allowDiscounts: policies.allowDiscounts,
      maxDiscount: parseFloat(policies.maxDiscount) || 0,
      requireDiscountAuth: policies.requireDiscountAuth,
      allowReturns: policies.allowReturns,
      negativeInventoryAllowed: policies.negativeInventoryAllowed,
      alertReposition: policies.alertReposition
    });
    showToast('Políticas operativas actualizadas con éxito.');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;
    const newUser = {
      id: `u-${Date.now()}`,
      username: newUsername,
      role: newUserRole,
      status: 'Activo'
    };
    setLocalUsers([...localUsers, newUser]);
    addLog(`Nuevo usuario creado: ${newUsername} con rol ${newUserRole}`, 'Seguridad');
    setNewUsername('');
    showToast(`Usuario ${newUsername} registrado exitosamente.`);
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchCode) return;
    const newB = {
      id: `b-${Date.now()}`,
      name: newBranchName,
      address: newBranchAddress,
      code: newBranchCode
    };
    usePOSStore.setState(state => ({ branches: [...state.branches, newB] }));
    addLog(`Nueva sucursal creada: ${newBranchName}`, 'Seguridad');
    setNewBranchName('');
    setNewBranchAddress('');
    setNewBranchCode('');
    showToast('Sucursal registrada con éxito.');
  };

  const handleGenerateBackup = () => {
    const json = backupData();
    setBackupJson(json);
    addLog('Copia de seguridad del sistema exportada.', 'Seguridad');
  };

  const handleCopyBackup = () => {
    navigator.clipboard.writeText(backupJson);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson) return;
    const success = restoreData(importJson);
    if (success) {
      setIsRestored(true);
      setImportJson('');
      addLog('Base de datos restaurada exitosamente.', 'Seguridad');
      setTimeout(() => setIsRestored(false), 3000);
      showToast('¡Base de datos restaurada correctamente!');
    } else {
      showToast('Error: El formato JSON de restauración no es válido.', 'error');
    }
  };

  const handleGenerateKey = () => {
    const newKey = generateLicenseKey();
    setGeneratedKey(newKey);
    addLog('Nueva clave de licencia generada con éxito.', 'Seguridad');
  };

  const handleCopyGeneratedKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setIsKeyCopied(true);
    setTimeout(() => setIsKeyCopied(false), 2000);
  };

  const isMasterPasswordCorrect = masterPassword === 'PRO-ADMIN-LICENSE-2026';

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ajustes y Seguridad del Sistema</h2>
          <p className="text-xs text-slate-500">Configure la información legal de la empresa, políticas comerciales y permisos de usuario</p>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start text-xs font-bold gap-1">
        <button
          onClick={() => setActiveSubTab('company')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeSubTab === 'company' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-850'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Datos Empresa</span>
        </button>
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeSubTab === 'policies' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-855'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Políticas POS</span>
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeSubTab === 'users' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-850'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuarios y Permisos</span>
        </button>
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeSubTab === 'branches' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-850'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Sedes y Cajas</span>
        </button>
        <button
          onClick={() => setActiveSubTab('backups')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeSubTab === 'backups' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-850'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Respaldos y Licencia</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SUBTAB CONTENT (COVERS 2 COLS) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
          
          {/* TAB 1: COMPANY SETTINGS */}
          {activeSubTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-2 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Perfil Legal e Identificación Tributaria</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    value={compSettings.name}
                    onChange={(e) => setCompSettings({ ...compSettings, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Razón Social</label>
                  <input
                    type="text"
                    required
                    value={compSettings.socialReason}
                    onChange={(e) => setCompSettings({ ...compSettings, socialReason: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">NIT / RUC / Identificación Tributaria</label>
                  <input
                    type="text"
                    required
                    value={compSettings.nit}
                    onChange={(e) => setCompSettings({ ...compSettings, nit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-855 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={compSettings.phone}
                    onChange={(e) => setCompSettings({ ...compSettings, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Correo Corporativo</label>
                  <input
                    type="email"
                    required
                    value={compSettings.email}
                    onChange={(e) => setCompSettings({ ...compSettings, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-855 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Dirección Matriz</label>
                <input
                  type="text"
                  required
                  value={compSettings.address}
                  onChange={(e) => setCompSettings({ ...compSettings, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-855 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Moneda del Sistema</label>
                  <select
                    value={compSettings.currency}
                    onChange={(e) => setCompSettings({ ...compSettings, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none cursor-pointer"
                  >
                    <option value="COP">Peso Colombiano ($ COP)</option>
                    <option value="S/">Sol Peruano (S/ PEN)</option>
                    <option value="USD">Dólar Americano ($ USD)</option>
                    <option value="EUR">Euro (€ EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Impuesto por Defecto (%)</label>
                  <input
                    type="number"
                    required
                    value={compSettings.taxRate}
                    onChange={(e) => setCompSettings({ ...compSettings, taxRate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 py-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer self-start px-6"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Datos Corporativos</span>
              </button>
            </form>
          )}

          {/* TAB 2: POLICIES */}
          {activeSubTab === 'policies' && (
            <form onSubmit={handleSavePolicies} className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-2 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-indigo-600" />
                <span>Políticas de Ventas e Inventario</span>
              </h3>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowDiscounts"
                    checked={policies.allowDiscounts}
                    onChange={(e) => setPolicies({ ...policies, allowDiscounts: e.target.checked })}
                    className="w-4 h-4 accent-indigo-650 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="allowDiscounts" className="font-bold text-slate-800 cursor-pointer block">Habilitar Descuentos en POS</label>
                    <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Permite a los cajeros aplicar descuentos sobre el total del carrito.</span>
                  </div>
                </div>

                {policies.allowDiscounts && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border border-indigo-100 bg-indigo-50/20 rounded-xl">
                    <div>
                      <label className="block text-slate-655 mb-1 font-bold">Porcentaje Máximo de Descuento (%)</label>
                      <input
                        type="number"
                        value={policies.maxDiscount}
                        onChange={(e) => setPolicies({ ...policies, maxDiscount: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input
                        type="checkbox"
                        id="requireDiscountAuth"
                        checked={policies.requireDiscountAuth}
                        onChange={(e) => setPolicies({ ...policies, requireDiscountAuth: e.target.checked })}
                        className="w-4 h-4 accent-indigo-650 cursor-pointer"
                      />
                      <label htmlFor="requireDiscountAuth" className="font-bold text-slate-700 cursor-pointer">Requerir Clave de Supervisor</label>
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allowReturns"
                    checked={policies.allowReturns}
                    onChange={(e) => setPolicies({ ...policies, allowReturns: e.target.checked })}
                    className="w-4 h-4 accent-indigo-650 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="allowReturns" className="font-bold text-slate-800 cursor-pointer block">Permitir Devoluciones</label>
                    <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Habilita el reingreso de stock y reintegro de dinero por tickets emitidos.</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="negativeInventoryAllowed"
                    checked={policies.negativeInventoryAllowed}
                    onChange={(e) => setPolicies({ ...policies, negativeInventoryAllowed: e.target.checked })}
                    className="w-4 h-4 accent-indigo-650 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="negativeInventoryAllowed" className="font-bold text-slate-850 cursor-pointer block text-rose-750">Permitir Inventario Negativo</label>
                    <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Si se desmarca, el sistema bloqueará ventas de productos sin stock disponible en el Kardex.</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="alertReposition"
                    checked={policies.alertReposition}
                    onChange={(e) => setPolicies({ ...policies, alertReposition: e.target.checked })}
                    className="w-4 h-4 accent-indigo-650 cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="alertReposition" className="font-bold text-slate-800 cursor-pointer block">Alertas de Stock Mínimo</label>
                    <span className="text-[10px] text-slate-500 block font-medium mt-0.5">Genera notificaciones de reabastecimiento en la bitácora cuando el stock cae bajo el mínimo SKU.</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 py-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer self-start px-6"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Políticas Comerciales</span>
              </button>
            </form>
          )}

          {/* TAB 3: USERS & PERMISSIONS */}
          {activeSubTab === 'users' && (
            <div className="flex flex-col gap-5 text-xs text-slate-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Administrador de Cuentas de Usuario</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User creation form */}
                <form onSubmit={handleCreateUser} className="flex flex-col gap-3 font-semibold">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-1">Registrar Nuevo Colaborador</h4>
                  
                  <div>
                    <label className="block text-slate-500 mb-1">Nombre de Usuario / Login</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                      placeholder="Ej. cajero_tarde"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Asignar Rol Funcional</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 cursor-pointer outline-none font-bold"
                    >
                      <option value="Admin">Administrador (Control Completo)</option>
                      <option value="Cajero">Cajero POS (Factura y Caja)</option>
                      <option value="Mozo">Mozo / Moza (Pedidos Mesas)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Cuenta de Acceso</span>
                  </button>
                </form>

                {/* Users List */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-1">Usuarios del Sistema</h4>
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {localUsers.map(user => (
                      <div key={user.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-55 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                            {user.username[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-850 block">{user.username}</span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Rol: {user.role}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 border border-emerald-100 rounded-full text-[9px] font-bold">
                          {user.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANCHES & REGISTERS */}
          {activeSubTab === 'branches' && (
            <div className="flex flex-col gap-5 text-xs text-slate-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Multisucursal y Cajones Monederos</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Branch Creator */}
                <form onSubmit={handleAddBranch} className="flex flex-col gap-3 font-semibold">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-1">Agregar Nueva Sucursal</h4>
                  <div>
                    <label className="block text-slate-500 mb-1">Nombre Comercial de la Sede</label>
                    <input
                      type="text"
                      required
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                      placeholder="Ej. Sucursal Medellín Sur"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-500 mb-1">Prefijo / Código Sede</label>
                      <input
                        type="text"
                        required
                        value={newBranchCode}
                        onChange={(e) => setNewBranchCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none"
                        placeholder="Ej. MED02"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Dirección Física</label>
                      <input
                        type="text"
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                        placeholder="Ej. Carrera 50 #12"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Habilitar Nueva Sede</span>
                  </button>
                </form>

                {/* Branches List */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-1">Sedes Registradas Activas</h4>
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {branches.map(branch => (
                      <div
                        key={branch.id}
                        onClick={() => setActiveBranch(branch.id)}
                        className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          activeBranchId === branch.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <strong className="block text-slate-850">{branch.name}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Código: {branch.code} | {branch.address}</span>
                        </div>
                        {activeBranchId === branch.id && (
                          <span className="px-2 py-0.5 bg-indigo-650 text-white rounded-full text-[8px] font-bold">Activo</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: BACKUPS & LICENSE */}
          {activeSubTab === 'backups' && (
            <div className="flex flex-col gap-5 text-xs text-slate-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Respaldos Automáticos y Licencia de Uso</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backups Panel */}
                <div className="flex flex-col gap-3 font-semibold">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-1">Copias de Seguridad (Respaldos)</h4>
                  
                  <div className="flex items-center gap-2 py-1.5">
                    <input
                      type="checkbox"
                      id="autoBackupCheck"
                      checked={autoBackup}
                      onChange={(e) => setAutoBackup(e.target.checked)}
                      className="w-4 h-4 accent-indigo-650 cursor-pointer"
                    />
                    <label htmlFor="autoBackupCheck" className="text-slate-700 cursor-pointer font-bold">
                      Habilitar Respaldos Automáticos
                    </label>
                  </div>

                  {autoBackup && (
                    <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <label className="block text-slate-500 mb-1 text-[10px]">Frecuencia del Respaldo</label>
                        <select
                          value={backupFreq}
                          onChange={(e) => setBackupFreq(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 cursor-pointer"
                        >
                          <option value="diario">Respaldo Diario automático al cerrar caja</option>
                          <option value="semanal">Respaldo Semanal programado domingos</option>
                          <option value="mensual">Respaldo Mensual consolidado de fin de mes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 text-[10px]">Ruta / Ubicación del Directorio</label>
                        <input
                          type="text"
                          value={backupPath}
                          onChange={(e) => setBackupPath(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                          placeholder="Ej. C:\Backups\POS"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      updateCompanyConfig({
                        autoBackup,
                        backupFrequency: backupFreq,
                        backupLocation: backupPath
                      });
                      showToast('Configuración de respaldos automáticos guardada con éxito.');
                    }}
                    className="py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Guardar Parámetros de Respaldo</span>
                  </button>
                </div>

                {/* Software License status */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-1">Clave de Licencia</h4>
                  <div className="flex items-center justify-between bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      {isLicensed ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <strong className="text-indigo-600 font-black">Licencia Premium Activa</strong>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-amber-700 font-bold">Modo Demo (Prueba)</span>
                        </>
                      )}
                    </div>
                    {isLicensed && licenseKey && (
                      <code className="mt-2 font-mono text-[9.5px] bg-white p-2 rounded border border-slate-200 text-slate-700 text-center break-all select-all block">
                        {licenseKey}
                      </code>
                    )}
                  </div>
                  <div className="mt-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-1">Hardware ID (ID Único de Equipo)</h4>
                    <div className="text-xs font-mono text-slate-800 font-black flex justify-between items-center break-all">
                      {machineId}
                      <button onClick={() => navigator.clipboard.writeText(machineId)} className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors">Copiar</button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">Esta huella enlaza tu licencia de forma exclusiva a este computador.</p>
                    {isLicensed && (
                      <button
                        onClick={() => {
                          setConfirmAction({
                            message: '¿Está seguro de desactivar la licencia? El software volverá a bloquearse en modo demo.',
                            onConfirm: () => deactivateLicense()
                          });
                        }}
                        className="mt-2 w-full py-1 text-[10px] border border-rose-250 hover:bg-rose-50 text-rose-600 font-bold rounded-lg cursor-pointer transition-all text-center"
                      >
                        Desactivar Licencia Local
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* SUBTAB SIDEBAR PANEL (COVERS 1 COL - USER ACCESS SIMULATOR / LOGS & KEYS TOOL) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col justify-between min-h-[500px]">
          
          <div>
            <h3 className="text-xs font-black text-slate-750 mb-4 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-indigo-500" />
              <span>Simulaciones Rápidas</span>
            </h3>

            {/* Simular cambio de rol */}
            <div className="flex flex-col gap-3 text-xs font-semibold">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Simular Operador Activo:</span>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setUserRole('Admin')}
                  className={`w-full py-2 px-3 border rounded-xl cursor-pointer text-left flex justify-between items-center transition-all ${
                    userRole === 'Admin' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>🔑 Administrador</span>
                  {userRole === 'Admin' && <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setUserRole('Cajero')}
                  className={`w-full py-2 px-3 border rounded-xl cursor-pointer text-left flex justify-between items-center transition-all ${
                    userRole === 'Cajero' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>🔑 Cajero POS</span>
                  {userRole === 'Cajero' && <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setUserRole('Mozo')}
                  className={`w-full py-2 px-3 border rounded-xl cursor-pointer text-left flex justify-between items-center transition-all ${
                    userRole === 'Mozo' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>🔑 Mozo / Moza</span>
                  {userRole === 'Mozo' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* License Generator Master key */}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-4 text-xs font-semibold">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Generar Licencia Indefinida:</span>
              <input
                type="password"
                placeholder="Clave Maestra Distribuidor..."
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 outline-none shadow-inner"
              />
              {isMasterPasswordCorrect ? (
                <div className="flex flex-col gap-2 mt-1 animate-fade-in">
                  <button
                    onClick={handleGenerateKey}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Key className="w-4.5 h-4.5" />
                    <span>Generar Licencia</span>
                  </button>
                  {generatedKey && (
                    <div className="flex flex-col gap-1.5 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-inner">
                      <span className="font-mono text-[9px] text-indigo-700 font-black block text-center break-all select-all">
                        {generatedKey}
                      </span>
                      <button
                        onClick={handleCopyGeneratedKey}
                        className="py-1 w-full text-[9px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{isKeyCopied ? '¡Copiada!' : 'Copiar'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1">
                  Ingrese la clave maestra de distribuidor: <code className="text-indigo-600 font-bold">PRO-ADMIN-LICENSE-2026</code> para simular la generación de licencias offline.
                </p>
              )}
            </div>

            {/* Database Import/Export Backup tool */}
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-4 text-xs font-semibold">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Base de datos JSON:</span>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateBackup}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl cursor-pointer font-bold flex items-center justify-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup</span>
                </button>
                {backupJson && (
                  <button
                    onClick={handleCopyBackup}
                    className="px-2.5 bg-indigo-650 text-white text-[10px] rounded-xl cursor-pointer font-bold transition-all shadow-sm"
                  >
                    {isCopied ? 'Ok!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[9px] text-slate-400 leading-relaxed font-mono flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span>Las operaciones de cambios de sede, arqueos y restauraciones quedan completamente auditadas.</span>
          </div>

        </div>

      </div>

      {/* AUDIT LOG TIMELINE ROW */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-250 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-650" />
              <span>Bitácora de Actividad Reciente del Servidor Local</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Seguimiento de eventos transaccionales, accesos de operador y ajustes de Kardex</p>
          </div>
          
          <button
            onClick={() => {
              setConfirmAction({
                message: '¿Desea vaciar los registros de auditoría?',
                onConfirm: () => usePOSStore.setState({ auditLogs: [] })
              });
            }}
            className="mt-2 sm:mt-0 py-1.5 px-3 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl cursor-pointer text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Auditoría</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin text-[11px] font-medium text-slate-700">
          {auditLogs.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-slate-400 font-mono">Sin registros de actividad recientes.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 hover:shadow-sm transition-all">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono font-bold">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-indigo-600" />
                    <span>{log.user}</span>
                  </span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-800 font-bold leading-relaxed">{log.action}</p>
                <div className="flex justify-end">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md">
                    {log.module}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONFIRMATION OVERLAY MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-md font-bold text-rose-450 flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Confirmar Acción</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              {confirmAction.message}
            </p>
            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                className="px-5 py-2 bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-bold ${
            toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
