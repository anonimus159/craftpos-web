"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fredoka, Nunito } from 'next/font/google';
import { 
  Check, 
  HelpCircle, 
  ChevronDown, 
  Sparkles, 
  Store,
  HeartPulse,
  Croissant,
  IceCreamCone,
  Barcode,
  Volume2,
  Download,
  ArrowRight,
  Lock,
  MonitorPlay,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CheckoutModal from '../../components/CheckoutModal';
import { usePOSStore } from '../../store/store';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'] });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '700'] });

const mockProducts = [
  { id: '1', name: 'Pizza Muzarella', price: 12.00, barcode: '1001', module: 'restaurante', color: '#FB923C', icon: Store, desc: 'Módulo Restaurante' },
  { id: '2', name: 'Acetaminofén 500mg', price: 1.50, barcode: '2001', module: 'farmacia', color: '#C4B5FD', icon: HeartPulse, desc: 'Módulo Farmacia' },
  { id: '3', name: 'Croissant de Queso', price: 1.20, barcode: '3001', module: 'panaderia', color: '#FCD34D', icon: Croissant, desc: 'Módulo Panadería' },
  { id: '4', name: 'Helado de Vainilla', price: 1.80, barcode: '4001', module: 'heladeria', color: '#4ADE80', icon: IceCreamCone, desc: 'Módulo Heladería' },
];

export default function PromoLanding() {
  const router = useRouter();
  const activateModuleLicense = usePOSStore((state: any) => state.activateModuleLicense);
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [simulatedCart, setSimulatedCart] = useState<any[]>([]);
  const [simulatedModule, setSimulatedModule] = useState('hub');
  const [showBeep, setShowBeep] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [targetModule, setTargetModule] = useState<string | null>(null);

  const getMachineId = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return await (window as any).electronAPI.getMachineId();
    }
    let id = localStorage.getItem('web_machine_id');
    if (!id) {
      id = 'WEB-' + Math.random().toString(36).substring(2);
      localStorage.setItem('web_machine_id', id);
    }
    return id;
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150);
    } catch (e) {
      console.log('Audio Context not allowed yet');
    }
  };

  const startLiveDemo = () => {
    usePOSStore.setState({
      isDemoMode: true,
      appConfig: {
        isConfigured: true,
        companyName: "Demo CraftPOS",
        taxIdType: "NIT",
        taxId: "123456789-0",
        tagLine: "Entorno de Prueba",
        phone: "+1 234 567 890",
        email: "demo@craftpos.com",
        address: "Demo 123",
        cashierName: "Caja Principal",
        currency: "USD",
        currencySymbol: "$",
        country: "US",
        taxEnabled: true,
        taxRate: 19,
        printFormat: "80mm",
        ticketFont: "Courier",
        ticketShowLogo: false,
        ticketCustomText: "Gracias por su compra",
        ticketShowBusinessData: true,
        onboardingDate: new Date().toISOString(),
      },
      activeSession: {
        id: "demo_admin",
        username: "admin",
        passwordHash: "demo",
        email: "admin@demo.com",
        role: "Admin",
        fullName: "Administrador Demo",
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: {
          ventas: { access: true, nuevo: true, cobrar: true, descuentos: true, cotizaciones: true },
          inventario: { access: true, entradas: true, salidas: true, ajustes: true, exportar: true },
          caja: { access: true, apertura: true, cierre: true, movimientos: true, reportes: true },
          kardex: { access: true },
          corte: { access: true },
          reporteVentas: { access: true },
          usuarios: { access: true },
          compras: { access: true },
          otros: { access: true },
        }
      },
      userRole: 'Admin',
      licensedModules: {
        hub: true,
        restaurant: true,
        pharmacy: true,
        bakery: true,
        fruit: true,
        business: true
      },
      currentModule: 'hub',
    });
    router.push('/?demo=true');
  };

  const clearSimulatedCart = () => {
    setSimulatedCart([]);
    setSimulatedModule('hub');
  };

  const getSimulatedTotal = () => {
    return simulatedCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2);
  };

  const faqs = [
    {
      q: "¿Cómo funciona el periodo de prueba de 30 días?",
      a: "Es totalmente gratis y libre de riesgos. Al instalar CraftPOS en tu computadora, tendrás acceso completo a todos los módulos comerciales por 30 días sin ingresar tarjetas de crédito. Al finalizar el mes, puedes activar el sistema comprando una licencia permanente."
    },
    {
      q: "¿Qué es el lector global de códigos de barras?",
      a: "Es una tecnología que lee códigos desde cualquier pantalla de la app. Si estás en el menú principal o en el módulo de Cafetería y lees el código de barras de un medicamento, CraftPOS detectará automáticamente el rubro, te redireccionará al panel de Farmacia y agregará el artículo al carrito sin perder tus ventas activas."
    },
    {
      q: "¿La base de datos se guarda en la nube o localmente?",
      a: "Tus datos (inventario, arqueos de caja, ventas, usuarios) se guardan de forma local en tu computadora por seguridad y rapidez, lo que te permite vender incluso si no tienes conexión a internet. También puedes configurar respaldos automáticos en la nube."
    },
    {
      q: "¿Se pueden gestionar múltiples mesas en Restaurantes y Heladerías?",
      a: "Sí. Puedes agregar, nombrar y reorganizar mesas dinámicamente según la distribución de tu local. La app te permite ver el estado de consumo de cada mesa en tiempo real (libre, ocupada, reservada o en cobro) y facturar de forma independiente."
    }
  ];

  return (
    <div className={`min-h-screen bg-[#FAF6EE] text-[#1A1A1A] ${nunito.className} antialiased selection:bg-[#D92B75] selection:!text-white`}>
      <nav className="sticky top-0 z-50 bg-[#FAF6EE] border-b-[4px] border-black px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className={`text-3xl font-extrabold flex items-center gap-2 ${fredoka.className}`}>
            <span className="bg-[#D92B75] !text-white px-3 py-1 rounded-2xl border-[3px] border-black shadow-[3px_3px_0px_#000]">
              C
            </span>
            <span>CraftPOS</span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-bold text-lg">
            <a href="#modulos" className="hover:text-[#D92B75] transition-colors">Módulos</a>
            <a href="#demo" className="hover:text-[#D92B75] transition-colors">Demostración</a>
            <a href="#precios" className="hover:text-[#D92B75] transition-colors">Precios</a>
            <a href="#faq" className="hover:text-[#D92B75] transition-colors">Preguntas</a>
          </div>

          <a 
            href="https://github.com/anonimus159/craftpos-web/releases/download/v1.0.0/CraftPOS-Setup.exe"
            className="bg-[#D92B75] hover:bg-[#c22466] !text-white px-5 py-2.5 rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all font-bold text-base flex items-center gap-2"
          >
            Descargar POS
            <Download className="w-5 h-5" />
          </a>
        </div>
      </nav>

      <header className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Animated Mascot Left */}
          <motion.div 
            className="absolute -left-12 lg:-left-48 top-10 hidden md:block w-40 h-40 lg:w-56 lg:h-56 pointer-events-none z-0"
            animate={{ 
              y: [0, -15, 0],
              rotate: [-2, 3, -2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="relative w-full h-full p-2 bg-white rounded-3xl border-[3px] border-black shadow-[5px_5px_0px_#000] overflow-hidden">
              <Image src="/craftpos_caja_mascot.png" alt="POS Mascot" fill className="object-cover" />
            </div>
          </motion.div>

          {/* Animated Mascot Right */}
          <motion.div 
            className="absolute -right-12 lg:-right-48 top-6 hidden md:block w-40 h-40 lg:w-56 lg:h-56 pointer-events-none z-0"
            animate={{ 
              y: [0, -18, 0],
              rotate: [3, -2, 3]
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="relative w-full h-full p-2 bg-white rounded-3xl border-[3px] border-black shadow-[5px_5px_0px_#000] overflow-hidden">
              <Image src="/craftpos_pan_mascot.png" alt="Bakery Mascot" fill className="object-cover" />
            </div>
          </motion.div>
          <span className="inline-block bg-[#FCD34D] text-[#1A1A1A] font-black text-sm px-4 py-1.5 rounded-full border-[3px] border-black shadow-[3px_3px_0px_#000] mb-6 uppercase tracking-wider">
            🎉 Software Multirubro de Próxima Generación
          </span>
          <div className="mb-4">
            <span className="inline-block bg-[#4ADE80] text-[#1A1A1A] font-black text-sm px-4 py-1.5 rounded-full border-[3px] border-black shadow-[3px_3px_0px_#000] uppercase tracking-wider">
              🎁 Promoción especial: ¡30 días gratis para descargar y probar!
            </span>
          </div>
          <h1 className={`text-4xl md:text-7xl font-black leading-tight mb-8 ${fredoka.className} tracking-tight`}>
            El ingrediente dulce, sencillo y <span className="text-[#D92B75] underline decoration-[5px] decoration-black">secreto</span> para tu negocio.
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-10 font-medium leading-relaxed">
            Simplifica tus cobros, controla inventarios, organiza mesas dinámicas y administra turnos de caja en una interfaz neobrutalista y ultra divertida.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <a 
              href="#demo"
              className="bg-[#D92B75] hover:bg-[#c22466] !text-white text-xl font-bold px-8 py-4 rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center gap-2"
            >
              Probar Demo en Vivo
              <Sparkles className="w-6 h-6 fill-white" />
            </a>
            <a 
              href="https://github.com/anonimus159/craftpos-web/releases/download/v1.0.0/CraftPOS-Setup.exe"
              className="bg-white hover:bg-gray-50 text-black text-xl font-bold px-8 py-4 rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center gap-2"
            >
              Descargar Instalador .exe
              <Download className="w-6 h-6 text-black" />
            </a>
          </div>
          <p className="text-sm font-bold text-gray-500 mt-6">
            Uso libre por 30 días. Sin tarjetas. Sin contratos.
          </p>
        </div>
      </header>

      <section id="modulos" className="py-20 px-6 bg-white border-y-[4px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${fredoka.className}`}>
              5 Módulos en Un Solo Sistema
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Activa la licencia que necesites o desbloquéalas todas para un control comercial absoluto sin software separado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FFEEDB] p-8 rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#000] transition-all rotate-[-1deg] hover:rotate-[1deg] hover:scale-[1.02]">
              <div className="bg-[#FB923C] text-black w-14 h-14 rounded-2xl border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_#000]">
                <Store className="w-8 h-8" />
              </div>
              <h3 className={`text-2xl font-black mb-3 ${fredoka.className}`}>Restaurantes y Cafés</h3>
              <p className="text-gray-700 font-medium mb-6">Salones y mesas personalizables, reservaciones en vivo y comandas rápidas asociadas a meseros.</p>
              <ul className="space-y-2.5 font-bold text-sm">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#FB923C]" /> Plan de mesas interactivo</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#FB923C]" /> Reservas con nombre y hora</li>
              </ul>
            </div>

            <div className="bg-[#F0EBFF] p-8 rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#000] transition-all rotate-[0.5deg] hover:rotate-[-1deg] hover:scale-[1.02]">
              <div className="bg-[#C4B5FD] text-black w-14 h-14 rounded-2xl border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_#000]">
                <HeartPulse className="w-8 h-8" />
              </div>
              <h3 className={`text-2xl font-black mb-3 ${fredoka.className}`}>Farmacias y Boticas</h3>
              <p className="text-gray-700 font-medium mb-6">Control estricto de medicamentos por lotes, fechas de vencimiento y recetas archivadas.</p>
              <ul className="space-y-2.5 font-bold text-sm">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#C4B5FD]" /> Gestión de lotes y fechas</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#C4B5FD]" /> Alertas por expirar</li>
              </ul>
            </div>

            <div className="bg-[#FFFCEB] p-8 rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#000] transition-all rotate-[-0.5deg] hover:rotate-[1deg] hover:scale-[1.02]">
              <div className="bg-[#FCD34D] text-black w-14 h-14 rounded-2xl border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_#000]">
                <Croissant className="w-8 h-8" />
              </div>
              <h3 className={`text-2xl font-black mb-3 ${fredoka.className}`}>Panaderías</h3>
              <p className="text-gray-700 font-medium mb-6">Descuento de ingredientes en tiempo real, insumos de producción y combos dulces.</p>
              <ul className="space-y-2.5 font-bold text-sm">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#FCD34D]" /> Descuento de stock</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#FCD34D]" /> Control de insumos</li>
              </ul>
            </div>
            
            <div className="bg-[#EEFFE6] p-8 rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#000] transition-all rotate-[-1deg] hover:rotate-[0.5deg] hover:scale-[1.02]">
              <div className="bg-[#4ADE80] text-black w-14 h-14 rounded-2xl border-[3px] border-black flex items-center justify-center mb-6 shadow-[3px_3px_0px_#000]">
                <IceCreamCone className="w-8 h-8" />
              </div>
              <h3 className={`text-2xl font-black mb-3 ${fredoka.className}`}>Heladería y Postres</h3>
              <p className="text-gray-700 font-medium mb-6">Venta de helados por sabores, crepas, waffles, postres y bebidas preparadas.</p>
              <ul className="space-y-2.5 font-bold text-sm">
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#4ADE80]" /> Control de sabores</li>
                <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#4ADE80]" /> Preparados dinámicos</li>
              </ul>
            </div>

            <div className="bg-[#EBF7FF] p-8 rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#000] transition-all rotate-[1deg] hover:rotate-[-0.5deg] hover:scale-[1.02] md:col-span-2">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="bg-[#60A5FA] text-black w-14 h-14 rounded-2xl border-[3px] border-black flex items-center justify-center mb-0 shadow-[3px_3px_0px_#000] shrink-0">
                  <Barcode className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`text-2xl font-black mb-3 ${fredoka.className}`}>Almacén y Minimarkets</h3>
                  <p className="text-gray-700 font-medium mb-6">
                    Módulo optimizado para flujos rápidos de venta minorista. Soporta el lector de códigos de barras inteligente que asocia el catálogo completo.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-bold text-sm">
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#60A5FA]" /> Escáner de barra rápido</li>
                    <li className="flex items-center gap-2"><Check className="w-5 h-5 text-[#60A5FA]" /> Alertas de stock mínimo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-24 px-6 bg-[#FAF6EE] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#D92B75]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h2 className={`text-4xl md:text-6xl font-black mb-6 ${fredoka.className}`}>
            No lo imagines, Pruébalo en Vivo.
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-medium">
            Ingresa ahora mismo al sistema real de CraftPOS. Explora los módulos, simula ventas y descubre por qué es el sistema más fácil e intuitivo del mercado.
          </p>
          
          <div className="relative inline-block group mb-20">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#D92B75] to-orange-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <button 
              onClick={startLiveDemo}
              className="relative bg-black !text-white px-10 py-5 rounded-xl font-black text-2xl md:text-3xl border-[4px] border-black shadow-[8px_8px_0px_#D92B75] hover:translate-y-1 hover:shadow-[4px_4px_0px_#D92B75] active:translate-y-2 active:shadow-none transition-all flex items-center gap-4"
            >
              <span>INICIAR ENTORNO DE PRUEBA REAL</span>
              <ArrowRight className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          </div>
          
          <div 
            onClick={startLiveDemo}
            className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden border-[6px] border-black shadow-[16px_16px_0px_#000] relative group cursor-pointer bg-white"
          >
             {/* Mac-like header bar for the screenshot */}
             <div className="bg-gray-100 border-b-[3px] border-black px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
                <div className="mx-auto bg-white px-4 py-1 rounded-md border-2 border-gray-300 text-xs font-bold text-gray-500 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  <span>craftpos-web.onrender.com/?demo=true</span>
                </div>
             </div>
             
             {/* Using the banner as the mock screenshot */}
             <div className="relative">
               <img src="/craftpos_promo_banner.png" alt="Pantallazo del Sistema" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
               <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                 <div className="bg-white text-black font-black px-8 py-4 rounded-2xl text-2xl shadow-[6px_6px_0px_#D92B75] flex items-center gap-3 border-[4px] border-black transform translate-y-4 group-hover:translate-y-0 transition-all">
                   <MonitorPlay className="w-8 h-8" />
                   Cargar Sistema Completo
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      <section id="precios" className="py-20 px-6 bg-white border-y-[4px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${fredoka.className}`}>
              Planes Flexibles y Claros
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Todos los planes son de pago único con soporte técnico garantizado. Elige la cobertura ideal para tu local.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl border-[3px] border-black shadow-[6px_6px_0px_#000] flex flex-col justify-between rotate-[1deg]">
              <div>
                <span className="bg-orange-100 text-orange-850 font-extrabold text-xs px-3 py-1 rounded-full border-[1.5px] border-black">
                  POR RUBRO
                </span>
                <h3 className={`text-3xl font-black mt-4 mb-2 ${fredoka.className}`}>Plan Módulo</h3>
                <p className="text-gray-500 font-medium text-sm mb-6">Licencia vitalicia para un solo rubro.</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black">$75</span>
                  <span className="text-gray-500 font-bold text-sm">USD /único</span>
                </div>
                <ul className="space-y-3 font-bold text-sm border-t border-gray-100 pt-6">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> 1 Módulo comercial activo</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Control de turnos de caja e IVA</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Licencia permanente de por vida</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Soporte técnico por correo</li>
                </ul>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetModule: 'restaurante' })
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    else alert('Error: ' + data.error);
                  } catch (e) {
                    alert('Error iniciando pago');
                  }
                }}
                className="w-full text-center mt-8 bg-gray-100 hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block text-sm"
              >
                Obtener Licencia Módulo
              </button>
            </div>

            {/* Global Pro - Highlighted / Recommended */}
            <div className="bg-[#FFFCEB] p-8 rounded-3xl border-[4px] border-black shadow-[8px_8px_0px_#000] flex flex-col justify-between relative transform md:-translate-y-4 md:scale-105 z-10">
              <div className="absolute -top-4 left-1/3 bg-[#FCD34D] text-black font-black text-xs px-4 py-1.5 rounded-full border-[2px] border-black shadow-[2px_2px_0px_#000] uppercase tracking-wider">
                ⭐ DE POR VIDA
              </div>
              <div>
                <span className="bg-[#FCD34D] text-black font-extrabold text-xs px-3 py-1 rounded-full border-[1.5px] border-black">
                  NEGOCIO TOTAL
                </span>
                <h3 className={`text-3xl font-black mt-4 mb-2 ${fredoka.className}`}>Plan Pro Max</h3>
                <p className="text-gray-500 font-medium text-sm mb-6">Todos los módulos desbloqueados para siempre.</p>
                <div className="mb-6 flex items-baseline gap-1 font-black">
                  <span className="text-4xl font-black text-black">$130</span>
                  <span className="text-gray-500 font-bold text-sm">USD /único</span>
                </div>
                <ul className="space-y-3 font-bold text-sm border-t border-black/10 pt-6">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D92B75]" /> Los 5 Módulos liberados</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D92B75]" /> Multicajas, bodegas y sucursales</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D92B75]" /> Licencia permanente de por vida</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D92B75]" /> Soporte premium WhatsApp/Remoto</li>
                </ul>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetModule: 'all' })
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    else alert('Error: ' + data.error);
                  } catch (e) {
                    alert('Error iniciando pago');
                  }
                }}
                className="w-full text-center mt-8 bg-[#D92B75] hover:bg-[#c22466] !text-white font-bold py-3.5 rounded-xl border-[2px] border-black shadow-[3px_3px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block text-sm"
              >
                Comprar Licencia Vitalicia
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-[#FAF6EE]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl md:text-5xl font-black mb-4 ${fredoka.className}`}>
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Todo lo que necesitas saber sobre CraftPOS.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border-[3px] border-black shadow-[4px_4px_0px_#000] overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-6 font-bold text-lg md:text-xl flex items-center justify-between gap-4 transition-colors hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-[#D92B75] shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown 
                    className={`w-6 h-6 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} 
                  />
                </button>

                <AnimatePresence initial={false}>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t-[2px] border-black/10"
                    >
                      <div className="p-6 text-gray-700 font-medium text-base leading-relaxed bg-[#FFFDF8]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-[4px] border-black py-12 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={`text-2xl font-extrabold flex items-center gap-2 ${fredoka.className}`}>
            <span className="bg-[#D92B75] !text-white px-2.5 py-0.5 rounded-xl border-[2px] border-black shadow-[2px_2px_0px_#000]">
              C
            </span>
            <span>CraftPOS</span>
          </div>

          <p className="text-sm font-bold text-gray-500">
            © {new Date().getFullYear()} CraftPOS. Todos los derechos reservados. Diseñado con amor y Neobrutalismo.
          </p>

          <div className="flex gap-6 font-bold text-sm">
            <a href="#modulos" className="hover:underline">Módulos</a>
            <a href="#precios" className="hover:underline">Precios</a>
            <a href="#faq" className="hover:underline">Soporte</a>
          </div>
        </div>
      </footer>
      
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/573232313781?text=Hola,%20me%20interesa%20CraftPOS" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#1ebe57] text-white p-4 rounded-full border-[3px] border-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all z-50 flex items-center justify-center"
        title="Soporte por WhatsApp"
      >
        <MessageCircle className="w-8 h-8 fill-current" />
      </a>
      
      {/* STRIPE CHECKOUT MODAL (REMOVED) */}
    </div>
  );
}
