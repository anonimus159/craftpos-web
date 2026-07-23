"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, BookOpen, MessageSquare, PlayCircle, TerminalSquare, X } from 'lucide-react';
import FaqAccordion from '@/components/FaqAccordion';

export default function HelpCenterPage() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
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

        {/* Video Tutorials Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Video Tutoriales</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: '¿Cómo usar el Módulo de Ventas?',
                desc: 'Aprende a cobrar rápidamente, agregar productos al carrito, aplicar descuentos y emitir tickets para tus clientes.',
                time: '04:25',
                img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600',
                color: 'emerald',
                url: 'https://www.youtube.com/embed/zpOULjyy-n8?autoplay=1'
              },
              {
                title: 'Arqueo y Cierre de Caja',
                desc: 'Descubre cómo iniciar un turno, registrar entradas/salidas de efectivo, y hacer un corte Z perfecto sin faltantes.',
                time: '03:10',
                img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600',
                color: 'indigo',
                url: 'https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1'
              },
              {
                title: 'Control de Inventario y Recetas',
                desc: 'Cómo cargar insumos, crear productos compuestos (recetas) y manejar alertas de stock bajo automáticamente.',
                time: '06:45',
                img: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?auto=format&fit=crop&q=80&w=600',
                color: 'amber',
                url: 'https://www.youtube.com/embed/zpOULjyy-n8?autoplay=1'
              },
              {
                title: 'Análisis y Dashboard',
                desc: 'Interpreta los gráficos de ventas, productos más vendidos y comisiones para tomar mejores decisiones.',
                time: '02:50',
                img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
                color: 'blue',
                url: 'https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1'
              }
            ].map((video, idx) => (
              <div key={idx} onClick={() => setActiveVideo(video.url)} className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all cursor-pointer">
                <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                  <img src={video.img} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" />
                  <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-${video.color}-500 group-hover:text-white transition-all z-10 border border-white/30 group-hover:border-transparent`}>
                    <PlayCircle className="w-8 h-8 text-white ml-1" />
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                    {video.time}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className={`font-bold text-slate-900 text-lg mb-1 group-hover:text-${video.color}-600 transition-colors`}>{video.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{video.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step by Step Guides */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Guías Paso a Paso</h2>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Guide 1 */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Crear una Categoría y Producto</h3>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center">1</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Ir a Configuración</h4>
                      <p className="text-sm text-slate-500">En el menú lateral, selecciona el ícono de engranaje para ir a Configuración.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center">2</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Crear Categoría</h4>
                      <p className="text-sm text-slate-500">Haz clic en la pestaña "Categorías", luego en "Nueva Categoría". Asígnale un nombre (ej. Bebidas) y un color.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center">3</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Añadir Producto</h4>
                      <p className="text-sm text-slate-500">Ve a "Productos", clic en "+ Nuevo Producto", rellena los datos de precio, asocia la categoría que creaste y guarda.</p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="hidden md:block w-px bg-slate-100" />

              {/* Guide 2 */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-4 pb-4 border-b border-slate-100">Realizar una Devolución</h3>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center">1</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Buscar la Venta</h4>
                      <p className="text-sm text-slate-500">Ve al módulo de Ventas. En la sección superior, haz clic en el historial o "Últimas Ventas".</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center">2</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Seleccionar el Ticket</h4>
                      <p className="text-sm text-slate-500">Localiza el ticket por el número que trae el cliente o por la fecha/hora.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center">3</span>
                    <div>
                      <h4 className="font-bold text-slate-800">Anular y Reembolsar</h4>
                      <p className="text-sm text-slate-500">Haz clic en "Anular Venta". El inventario regresará automáticamente y la caja registrará la salida del dinero.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
            
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

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <button 
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe 
              src={activeVideo} 
              className="w-full h-full" 
              allow="autoplay; encrypted-media; picture-in-picture" 
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
