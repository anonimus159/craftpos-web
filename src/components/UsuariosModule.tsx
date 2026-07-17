'use client';
import { useState } from 'react';
import { usePOSStore } from '@/store/store';
import { AppUser, UserPermissions } from '@/types/types';
import { Users, Plus, Edit, Trash2, Shield, Eye, EyeOff, Check, X, ChevronDown } from 'lucide-react';

const DEFAULT_PERMISSIONS: UserPermissions = {
  ventas: { access: true, nuevo: true, cobrar: true, descuentos: false, cotizaciones: false },
  inventario: { access: false, entradas: false, salidas: false, ajustes: false, exportar: false },
  caja: { access: false, apertura: false, cierre: false, movimientos: false, reportes: false },
  kardex: { access: false },
  corte: { access: false },
  reporteVentas: { access: false },
  usuarios: { access: false },
  compras: { access: false },
  otros: { access: false },
};

const ADMIN_PERMISSIONS: UserPermissions = {
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

const MODULE_LABELS: Record<string, { label: string; actions: { key: string; label: string }[] }> = {
  ventas: { label: 'Ventas', actions: [
    { key: 'nuevo', label: 'Registrar nuevas ventas' },
    { key: 'cobrar', label: 'Procesar cobros' },
    { key: 'descuentos', label: 'Aplicar descuentos' },
    { key: 'cotizaciones', label: 'Gestionar cotizaciones' },
  ]},
  inventario: { label: 'Inventario', actions: [
    { key: 'entradas', label: 'Registrar Entradas' },
    { key: 'salidas', label: 'Registrar Salidas' },
    { key: 'ajustes', label: 'Registrar Ajustes' },
    { key: 'exportar', label: 'Exportar a Excel o PDF' },
  ]},
  caja: { label: 'Caja', actions: [
    { key: 'apertura', label: 'Apertura de caja' },
    { key: 'cierre', label: 'Cierre de caja' },
    { key: 'movimientos', label: 'Entradas/Salidas de dinero' },
    { key: 'reportes', label: 'Ver reportes de caja' },
  ]},
  kardex: { label: 'Kardex', actions: [] },
  corte: { label: 'Corte de Caja', actions: [] },
  reporteVentas: { label: 'Reporte de Ventas', actions: [] },
  usuarios: { label: 'Usuarios', actions: [] },
  compras: { label: 'Compras', actions: [] },
  otros: { label: 'Otros', actions: [] },
};

interface UserFormProps {
  user?: AppUser;
  onSave: (data: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'Admin' | 'Cajero' | 'Mozo'>(user?.role || 'Cajero');
  const [permissions, setPermissions] = useState<UserPermissions>(
    user?.permissions || DEFAULT_PERMISSIONS
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedModule, setExpandedModule] = useState<string | null>('ventas');

  const toggleAccess = (mod: string) => {
    setPermissions(p => {
      const current = (p as any)[mod];
      const newAccess = !current.access;
      // If disabling access, disable all sub-actions too
      const newActions: Record<string, boolean> = {};
      Object.keys(current).forEach(k => {
        if (k !== 'access') newActions[k] = newAccess;
      });
      return { ...p, [mod]: { ...current, access: newAccess, ...newActions } };
    });
  };

  const toggleAction = (mod: string, action: string) => {
    setPermissions(p => {
      const current = (p as any)[mod];
      return { ...p, [mod]: { ...current, [action]: !current[action] } };
    });
  };

  const applyPreset = (preset: 'admin' | 'cajero' | 'none') => {
    if (preset === 'admin') setPermissions(ADMIN_PERMISSIONS);
    else if (preset === 'cajero') setPermissions(DEFAULT_PERMISSIONS);
    else setPermissions({
      ventas: { access: false, nuevo: false, cobrar: false, descuentos: false, cotizaciones: false },
      inventario: { access: false, entradas: false, salidas: false, ajustes: false, exportar: false },
      caja: { access: false, apertura: false, cierre: false, movimientos: false, reportes: false },
      kardex: { access: false }, corte: { access: false }, reporteVentas: { access: false },
      usuarios: { access: false }, compras: { access: false }, otros: { access: false },
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Obligatorio';
    if (!username.trim()) errs.username = 'Obligatorio';
    if (!user && password.length < 4) errs.password = 'Mínimo 4 caracteres';
    if (!email.trim()) {
      errs.email = 'Obligatorio para recuperación';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Correo inválido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const passwordHash = password
      ? btoa(`${username.toLowerCase()}:${password}`)
      : (user?.passwordHash || btoa(`${username.toLowerCase()}:1234`));
    onSave({
      fullName,
      username,
      email,
      passwordHash,
      role,
      permissions,
      isActive: true,
    });
  };

  const inputClass = "w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 transition-all text-sm";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Nombres Completos *</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} placeholder="Carlos Mendoza" />
          {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
        </div>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Login de Ingreso *</label>
          <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} className={inputClass} placeholder="cajero1" />
          {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
        </div>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Contraseña {user ? '(dejar vacío para no cambiar)' : '*'}</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className={inputClass + ' pr-10'} placeholder="••••" />
            <button onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className="text-xs text-white/50 uppercase tracking-wider block mb-1.5">Correo (Recuperación) *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="cajero@empresa.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Permissions Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" /> Permisos del Usuario
          </p>
          <div className="flex gap-2">
            {[
              { key: 'admin', label: 'Admin' },
              { key: 'cajero', label: 'Cajero' },
              { key: 'none', label: 'Sin permisos' },
            ].map(p => (
              <button key={p.key} onClick={() => applyPreset(p.key as any)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-400/50 text-white/60 hover:text-emerald-400 transition-all">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Permission tabs */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(MODULE_LABELS).map(([mod, info]) => {
            const modPerms = (permissions as any)[mod];
            return (
              <button key={mod} onClick={() => setExpandedModule(expandedModule === mod ? null : mod)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  expandedModule === mod ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${modPerms.access ? 'bg-emerald-400' : 'bg-red-400/50'}`} />
                {info.label}
              </button>
            );
          })}
        </div>

        {expandedModule && (
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 space-y-2">
            {/* Module access toggle */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-sm font-medium text-white">Permitir el acceso a este módulo</span>
              <button onClick={() => toggleAccess(expandedModule)}
                className={`w-10 h-5 rounded-full transition-all relative ${(permissions as any)[expandedModule].access ? 'bg-emerald-500' : 'bg-white/10'}`}>
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${(permissions as any)[expandedModule].access ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            {/* Sub-actions */}
            {MODULE_LABELS[expandedModule].actions.map(action => {
              const val = (permissions as any)[expandedModule][action.key];
              const disabled = !(permissions as any)[expandedModule].access;
              return (
                <label key={action.key} className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div onClick={() => toggleAction(expandedModule, action.key)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${val ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 bg-transparent'}`}>
                    {val && <Check size={10} className="text-white" />}
                  </div>
                  <span className="text-sm text-white/70">{action.label}</span>
                </label>
              );
            })}
            {MODULE_LABELS[expandedModule].actions.length === 0 && (
              <p className="text-white/30 text-xs">Sin acciones adicionales.</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
        <button onClick={onCancel} className="px-4 py-2 text-white/50 hover:text-white text-sm transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all">
          <Check size={14} /> Guardar
        </button>
      </div>
    </div>
  );
}

export default function UsuariosModule() {
  const { appUsers, addUser, updateUser, deleteUser, activeSession } = usePOSStore(s => ({
    appUsers: s.appUsers,
    addUser: s.addUser,
    updateUser: s.updateUser,
    deleteUser: s.deleteUser,
    activeSession: s.activeSession,
  }));

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = (data: Omit<AppUser, 'id' | 'createdAt'>) => {
    addUser(data);
    setView('list');
  };

  const handleEdit = (data: Omit<AppUser, 'id' | 'createdAt'>) => {
    if (!selectedUser) return;
    updateUser({ ...selectedUser, ...data });
    setView('list');
    setSelectedUser(null);
  };

  const handleDelete = (userId: string) => {
    if (userId === activeSession?.id) return; // Can't delete yourself
    deleteUser(userId);
    setDeleteConfirm(null);
  };

  const roleColor = (role: string) => {
    if (role === 'Admin') return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
    if (role === 'Cajero') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  };

  return (
    <div className="bg-[#0d1117] min-h-screen p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Gestión de Usuarios</h1>
            <p className="text-white/40 text-xs">{appUsers.length} usuario(s) registrado(s)</p>
          </div>
        </div>
        {view === 'list' && (
          <button
            onClick={() => { setView('create'); setSelectedUser(null); }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={15} /> Agregar Usuario
          </button>
        )}
      </div>

      {/* Form View */}
      {(view === 'create' || view === 'edit') && (
        <div className="bg-[#151b27] border border-white/10 rounded-3xl p-6">
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            {view === 'create' ? <><Plus size={16} className="text-emerald-400" /> Agregar Usuario</> : <><Edit size={16} className="text-blue-400" /> Editar Usuario</>}
          </h2>
          <UserForm
            user={selectedUser || undefined}
            onSave={view === 'create' ? handleCreate : handleEdit}
            onCancel={() => { setView('list'); setSelectedUser(null); }}
          />
        </div>
      )}

      {/* Users List */}
      {view === 'list' && (
        <div className="bg-[#151b27] border border-white/10 rounded-3xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-white/5 text-xs text-white/30 uppercase tracking-wider">
            <span>Usuario</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Acciones</span>
          </div>

          {appUsers.length === 0 ? (
            <div className="py-16 text-center text-white/20 text-sm">No hay usuarios registrados.</div>
          ) : (
            appUsers.map(user => (
              <div key={user.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors items-center">
                <div>
                  <p className="text-white text-sm font-medium">{user.fullName}</p>
                  <p className="text-white/40 text-xs">@{user.username}</p>
                </div>
                <p className="text-white/60 text-sm">{user.email || '—'}</p>
                <div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${roleColor(user.role)}`}>{user.role}</span>
                  {user.id === activeSession?.id && (
                    <span className="ml-2 text-[10px] text-emerald-400/70">Tú</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedUser(user); setView('edit'); }}
                    className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                  >
                    <Edit size={13} className="text-blue-400" />
                  </button>
                  {user.id !== activeSession?.id && (
                    deleteConfirm === user.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(user.id)}
                          className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors">
                          <Check size={13} className="text-red-400" />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                          <X size={13} className="text-white/40" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(user.id)}
                        className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
