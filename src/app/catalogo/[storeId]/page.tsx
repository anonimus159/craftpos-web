import React from 'react';
import { ShoppingBag, Phone, MapPin, Store } from 'lucide-react';
import Link from 'next/link';

export function generateStaticParams() {
  return [{ storeId: '1' }];
}

export default function CatalogoPublicoPage({ params }: { params: { storeId: string } }) {
  const storeId = params.storeId || '1';

  // Demo products (In a real app, this would be fetched from Supabase using storeId)
  const products = [
    { id: 1, name: 'Helado de Vainilla (Cono)', price: 2.50, category: 'Helados' },
    { id: 2, name: 'Banana Split Especial', price: 5.50, category: 'Helados' },
    { id: 3, name: 'Malteada de Fresa', price: 3.50, category: 'Bebidas' },
    { id: 4, name: 'Pan de Queso (Docena)', price: 4.00, category: 'Panadería' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 leading-tight">Mi Negocio</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catálogo Oficial</p>
            </div>
          </div>
          <Link 
            href={`https://wa.me/1234567890?text=Hola, quiero hacer un pedido del catálogo web.`}
            target="_blank"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Phone className="w-4 h-4" />
            Pedir por WhatsApp
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">¡Bienvenidos!</h2>
            <p className="text-sm text-slate-500 mt-1">Revisa nuestros productos y precios actualizados al instante.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
            <MapPin className="w-4 h-4" />
            Local Principal
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-40 bg-slate-100 flex items-center justify-center relative">
                <ShoppingBag className="w-12 h-12 text-slate-300 group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 bg-white/80 backdrop-blur text-[10px] font-black uppercase px-2 py-1 rounded-md text-slate-600">
                  {product.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{product.name}</h3>
                <div className="text-indigo-600 font-black text-xl">${product.price.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

      </main>

      <footer className="mt-12 py-8 bg-slate-900 text-center">
        <p className="text-slate-400 text-xs">
          Catálogo generado automáticamente por <strong>CraftPOS</strong>.
        </p>
      </footer>
    </div>
  );
}
