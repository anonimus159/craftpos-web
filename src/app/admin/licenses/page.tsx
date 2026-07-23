"use client";

import React, { useState, useEffect } from 'react';
import { Lock, Search, RefreshCw, KeyRound, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLicensesPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Authenticate
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '157410') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      fetchLicenses();
    } else {
      setError('Contraseña incorrecta');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setIsAuthenticated(true);
      fetchLicenses();
    }
  }, []);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setLicenses(data || []);
    } catch (err) {
      console.error(err);
      // Fallback a datos mock si la tabla no existe o hay error
      setLicenses([
        { id: 'LIC-1', email: 'panaderia@gmail.com', status: 'active', expires_at: '2026-12-31', targetModule: 'panaderia' },
        { id: 'LIC-2', email: 'demo@heladeria.com', status: 'trial', expires_at: '2026-08-15', targetModule: 'heladeria' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white text-center mb-2">Panel Restringido</h1>
          <p className="text-slate-400 text-sm text-center mb-6">Ingresa la clave maestra para administrar las licencias de CraftPOS.</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Contraseña Maestra"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              {error && <p className="text-rose-500 text-xs mt-2 font-medium ml-1">{error}</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Desbloquear Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Admin <span className="font-light text-slate-500">Licencias</span></h1>
          </div>
          
          <button onClick={() => { sessionStorage.removeItem('adminAuth'); setIsAuthenticated(false); }} className="text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestión de Clientes</h2>
            <p className="text-sm text-slate-500">Visualiza todas las licencias emitidas y sus estados.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar correo o ID..." 
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button onClick={fetchLicenses} className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-4">ID Licencia</th>
                  <th className="px-6 py-4">Correo Cliente</th>
                  <th className="px-6 py-4">Módulo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Expiración</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {licenses.map((lic, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{lic.id}</td>
                    <td className="px-6 py-4 font-medium">{lic.email}</td>
                    <td className="px-6 py-4 capitalize">{lic.targetModule}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        lic.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        lic.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {lic.status === 'active' && <Check className="w-3 h-3" />}
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(lic.expires_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                
                {licenses.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay licencias registradas en la base de datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
