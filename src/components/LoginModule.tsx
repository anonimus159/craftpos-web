'use client';
import { useState } from 'react';
import { usePOSStore } from '@/store/store';
import { Eye, EyeOff, LogIn, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModule() {
  const { appConfig, login, resetPassword, recoverUsername } = usePOSStore(s => ({
    appConfig: s.appConfig,
    login: s.login,
    resetPassword: s.resetPassword,
    recoverUsername: s.recoverUsername,
  }));

  // Form toggle state: 'login' | 'recover-password' | 'recover-username'
  const [activeForm, setActiveForm] = useState<'login' | 'recover-password' | 'recover-username'>('login');

  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    // Small artificial delay for UX polish
    await new Promise(r => setTimeout(r, 400));
    const result = login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleResetPassword = async () => {
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

    // UX delay
    await new Promise(r => setTimeout(r, 600));

    const result = resetPassword(recoveryUsername, recoveryEmail, recoveryTaxId, newPassword);
    setRecoveryLoading(false);

    if (result.success) {
      setRecoverySuccess(result.message);
      // Wait and redirect to login screen
      setTimeout(() => {
        setActiveForm('login');
        // Reset recovery fields
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

  const handleRecoverUsername = async () => {
    if (!usernameEmail.trim() || !usernameTaxId.trim()) {
      setUsernameError('Por favor completa todos los campos.');
      return;
    }
    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSuccess('');
    setRecoveredUsernames(null);

    // UX delay
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeForm === 'recover-password') {
        handleResetPassword();
      } else if (activeForm === 'recover-username') {
        handleRecoverUsername();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-blue-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-6">
          {appConfig.logoBase64 ? (
            <div className="flex justify-center mb-4">
              <img
                src={appConfig.logoBase64}
                alt="Logo"
                className="w-20 h-20 object-contain rounded-2xl border border-white/10"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={30} className="text-white" />
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{appConfig.companyName || 'Sistema POS'}</h1>
          {appConfig.tagLine && (
            <p className="text-white/40 text-sm mt-1">{appConfig.tagLine}</p>
          )}
        </div>

        {/* Login / Recovery Card */}
        <div className="bg-[#151b27] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">
            {activeForm === 'login' && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">Iniciar Sesión</h2>
                  <p className="text-white/40 text-sm mt-0.5">Ingresa tus credenciales para acceder.</p>
                </div>

                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                        Usuario
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveForm('recover-username');
                          setError('');
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-305 transition-colors cursor-pointer"
                      >
                        ¿Lo olvidaste?
                      </button>
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="Tu nombre de usuario"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveForm('recover-password');
                          setError('');
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        ¿La olvidaste?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                        placeholder="Tu contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-shake">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Login Button */}
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20 mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn size={16} />
                        Ingresar al sistema
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {activeForm === 'recover-password' && (
              <motion.div
                key="recovery-password-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">Recuperar Contraseña</h2>
                  <p className="text-white/40 text-sm mt-0.5">Ingresa los datos registrados para cambiarla.</p>
                </div>

                <div className="space-y-3.5">
                  {/* Recovery Username */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={recoveryUsername}
                      onChange={e => setRecoveryUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="Nombre de usuario"
                    />
                  </div>

                  {/* Registered Email */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      Correo Registrado
                    </label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={e => setRecoveryEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Company NIT / Tax ID */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      NIT/RUC de la Empresa
                    </label>
                    <input
                      type="text"
                      value={recoveryTaxId}
                      onChange={e => setRecoveryTaxId(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="NIT/RUC"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                        placeholder="Mínimo 4 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="Repite la contraseña"
                    />
                  </div>

                  {/* Error & Success Messages */}
                  {recoveryError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-shake">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <p className="text-red-450 text-xs">{recoveryError}</p>
                    </div>
                  )}

                  {recoverySuccess && (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-450 flex-shrink-0" />
                      <p className="text-emerald-455 text-xs">{recoverySuccess}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      onClick={handleResetPassword}
                      disabled={recoveryLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
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
                        setActiveForm('login');
                        setRecoveryError('');
                        setRecoverySuccess('');
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 transition-all text-xs font-semibold cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      Regresar al inicio de sesión
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeForm === 'recover-username' && (
              <motion.div
                key="recovery-username-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white">Recuperar Usuario</h2>
                  <p className="text-white/40 text-sm mt-0.5">Ingresa tus datos para ver tus nombres de usuario.</p>
                </div>

                <div className="space-y-3.5">
                  {/* Registered Email */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      Correo Registrado
                    </label>
                    <input
                      type="email"
                      value={usernameEmail}
                      onChange={e => setUsernameEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Company NIT / Tax ID */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                      NIT/RUC de la Empresa
                    </label>
                    <input
                      type="text"
                      value={usernameTaxId}
                      onChange={e => setUsernameTaxId(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-all text-sm"
                      placeholder="NIT/RUC"
                    />
                  </div>

                  {/* Error & Success Messages */}
                  {usernameError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-shake">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <p className="text-red-450 text-xs">{usernameError}</p>
                    </div>
                  )}

                  {usernameSuccess && recoveredUsernames && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-450 flex-shrink-0" />
                        <p className="text-emerald-450 text-xs font-semibold">{usernameSuccess}</p>
                      </div>
                      <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 text-center">
                        <span className="text-white/40 text-xs uppercase tracking-wider block mb-1">Tus Usuarios:</span>
                        <div className="flex flex-wrap gap-2 justify-center mt-1">
                          {recoveredUsernames.map(usr => (
                            <span
                              key={usr}
                              className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg font-mono text-sm font-bold shadow-sm"
                            >
                              {usr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      onClick={handleRecoverUsername}
                      disabled={usernameLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      {usernameLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                        setActiveForm('login');
                        setUsernameError('');
                        setUsernameSuccess('');
                        setRecoveredUsernames(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-2.5 transition-all text-xs font-semibold cursor-pointer"
                    >
                      <ArrowLeft size={14} />
                      Regresar al inicio de sesión
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/20 text-xs">
            {appConfig.cashierName || 'Caja Principal'} &nbsp;·&nbsp; Sistema POS
          </p>
        </div>
      </div>
    </div>
  );
}
