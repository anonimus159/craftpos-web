import React, { useState } from 'react';
import { X, Lock, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MockBackend, LicenseType } from '../lib/mockBackend';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: (licenseKey: string, type: LicenseType) => void;
}

export default function CheckoutModal({ onClose, onSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Plan, 2: Payment (Simulated), 3: Success
  const [selectedPlan, setSelectedPlan] = useState<LicenseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');

  const handleSimulatePayment = async () => {
    setLoading(true);
    // Call our Mock Server to generate a new valid license
    try {
      const key = await MockBackend.generateAndRegisterLicense(selectedPlan!);
      setLicenseKey(key);
      setStep(3);
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-zinc-900 tracking-tight">Caja Segura Wompi (Demo)</h2>
              <p className="text-xs font-semibold text-zinc-500">Adquiere tu Licencia Permanente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-200 hover:bg-zinc-300 rounded-full transition-colors">
            <X className="w-4 h-4 text-zinc-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h3 className="font-bold text-zinc-800 text-center mb-2">Selecciona el tipo de Licencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Single Plan */}
                <div 
                  onClick={() => setSelectedPlan('single')}
                  className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${selectedPlan === 'single' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-zinc-200 hover:border-indigo-300'}`}
                >
                  <h4 className="font-black text-indigo-900 mb-1">Licencia Única</h4>
                  <p className="text-xs text-zinc-600 font-medium mb-3">Válida para 1 sola computadora. Queda anclada a tu hardware.</p>
                  <div className="text-2xl font-black text-zinc-900">$29<span className="text-sm font-bold text-zinc-400">/pago único</span></div>
                </div>

                {/* Multi Plan */}
                <div 
                  onClick={() => setSelectedPlan('multiple')}
                  className={`border-2 rounded-xl p-5 cursor-pointer transition-all ${selectedPlan === 'multiple' ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-zinc-200 hover:border-emerald-300'}`}
                >
                  <h4 className="font-black text-emerald-900 mb-1">Licencia Múltiple Premium</h4>
                  <p className="text-xs text-zinc-600 font-medium mb-3">Úsala en cualquier número de computadoras sin restricciones.</p>
                  <div className="text-2xl font-black text-zinc-900">$99<span className="text-sm font-bold text-zinc-400">/pago único</span></div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button 
                  disabled={!selectedPlan}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-zinc-800"
                >
                  Continuar al Pago
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-8 duration-300">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-800 text-sm">Simulador de Pago Seguro Wompi</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Esto es una simulación de la pasarela de Wompi. Al hacer clic en Pagar, el servidor ficticio generará una licencia 100% válida.
                  </p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl p-5 bg-zinc-50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-700 text-sm">Total a pagar:</span>
                  <span className="font-black text-2xl text-zinc-900">{selectedPlan === 'single' ? '$29' : '$99'} USD</span>
                </div>
                
                <div className="h-[1px] bg-zinc-200 w-full" />

                <div className="flex flex-col gap-3">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Número de Tarjeta (Ficticio)</label>
                  <div className="relative">
                    <CreditCard className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" readOnly value="**** **** **** 4242" className="w-full bg-white border border-zinc-300 rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-zinc-700 font-bold outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  onClick={handleSimulatePayment}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? 'Procesando Pago con Wompi...' : 'Pagar con Wompi'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center py-8 animate-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-2xl font-black text-zinc-900 mb-2">¡Pago Exitoso!</h3>
              <p className="text-sm font-medium text-zinc-500 mb-6 max-w-md">
                Tu pago ha sido procesado mediante Wompi Simulator. Tu servidor ha generado una licencia válida.
              </p>
              
              <div className="bg-zinc-100 border border-zinc-200 p-4 rounded-xl w-full max-w-sm mb-6">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1">Clave de Licencia</p>
                <div className="font-mono text-lg font-black text-indigo-700 break-all select-all">
                  {licenseKey}
                </div>
              </div>

              <button 
                onClick={() => {
                  onSuccess(licenseKey, selectedPlan!);
                }}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl"
              >
                Activar Licencia Ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
