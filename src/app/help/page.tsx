import React from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, BookOpen, MessageSquare, PlayCircle, TerminalSquare } from 'lucide-react';
import FaqAccordion from '@/components/FaqAccordion';

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Hero Section */}
      <div className="bg-slate-950 pt-8 pb-32 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold mb-12">
            <ArrowLeft className="w-4 h-4" />
            Volver a CraftPOS
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 text-center">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto text-lg">
            Encuentra tutoriales, guías paso a paso y respuestas a las preguntas más frecuentes sobre el uso del sistema.
          </p>
          
          <div className="relative max-w-2xl mx-auto shadow-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar 'cómo hacer corte de caja', 'agregar insumo'..." 
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-20 pb-24">
        
        {/* Quick Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Guía de Inicio</h3>
            <p className="text-sm text-slate-500">Aprende lo básico para arrancar tu negocio hoy mismo.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PlayCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Video Tutoriales</h3>
            <p className="text-sm text-slate-500">Aprende viendo. Videos cortos sobre cada módulo del POS.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TerminalSquare className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-2">Facturación y Caja</h3>
            <p className="text-sm text-slate-500">Todo sobre cierres de caja, reportes y cobros con datáfono.</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Preguntas Frecuentes</h2>
          <div className="flex flex-col gap-3">
            <FaqAccordion 
              question="¿Cómo hago un corte de caja al final del día?" 
              answer="Para realizar un corte de caja, dirígete al módulo de 'Caja' desde el menú lateral. Haz clic en el botón rojo que dice 'Cerrar Caja'. El sistema calculará automáticamente las ventas en efectivo, tarjeta y datáfono. Verifica que el dinero en gaveta coincida y confirma el cierre."
            />
            <FaqAccordion 
              question="¿Puedo usar CraftPOS sin conexión a internet?" 
              answer="Sí. CraftPOS está diseñado como una aplicación 'Offline-First'. Puedes seguir vendiendo e imprimiendo tickets sin internet. Una vez que recuperes la conexión, el sistema sincronizará automáticamente los datos con la nube si tienes activada esa función."
            />
            <FaqAccordion 
              question="¿Cómo agrego una receta o insumo para descontar stock?" 
              answer="Ve al módulo de 'Inventario' y selecciona la pestaña 'Recetas e Insumos'. Haz clic en 'Agregar Insumo'. Luego, al crear un Producto en el catálogo principal, asócialo a esa receta indicando las cantidades (ej: 0.150 kg de carne para 1 Hamburguesa)."
            />
            <FaqAccordion 
              question="¿Cómo funciona la integración con Datáfonos?" 
              answer="Al cobrar una orden en el módulo de Ventas, selecciona 'Datáfono' como método de pago. El sistema se comunicará automáticamente con tu terminal vinculada (como Wompi o MercadoPago Point) para que el cliente pase su tarjeta. Una vez aprobado, la venta se cerrará sola."
            />
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4 relative z-10">¿Aún necesitas ayuda?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto relative z-10">
            Nuestro equipo de soporte técnico está disponible 24/7 para ayudarte a resolver cualquier inconveniente con tu sistema.
          </p>
          <a href="#" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-900 font-bold px-8 py-4 rounded-xl transition-all shadow-lg relative z-10">
            <MessageSquare className="w-5 h-5" />
            Contactar por WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
