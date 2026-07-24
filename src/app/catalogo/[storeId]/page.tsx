import React from 'react';
import { ShoppingBag, Phone, MapPin, Store } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 60; // ISR cache every 60 seconds

export default async function CatalogoPublicoPage({ params }: { params: { storeId: string } }) {
  const storeId = params.storeId || '1';
  
  // Fetch from Supabase directly in the server component
  const { data: products, error } = await supabase
    .from('public_catalog_products')
    .select('*')
    .eq('license_key', storeId)
    .order('name');
    
  if (error) {
    console.error("Error fetching catalog for store:", storeId, error);
  }
  
  const catalog = products || [];

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
        {catalog.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Catálogo Vacío</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Este negocio aún no ha sincronizado sus productos a la nube.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {catalog.map((product: any) => (
              <div key={product.id || product.product_id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                <div className="h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-slate-200 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="absolute top-2 right-2 bg-white/90 backdrop-blur shadow-sm text-[10px] font-black uppercase px-2.5 py-1 rounded-md text-slate-700">
                    {product.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 flex-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-indigo-600 font-black text-xl">${Number(product.price).toFixed(2)}</div>
                    {product.stock > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Stock: {product.stock}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Agotado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <footer className="mt-12 py-8 bg-slate-900 text-center">
        <p className="text-slate-400 text-xs">
          Catálogo generado automáticamente por <strong>CraftPOS</strong>.
        </p>
      </footer>
    </div>
  );
}
