import React, { useState } from 'react';
import { usePOSStore } from '../store/store';
import { 
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Search, Calendar, Filter, FileSpreadsheet, Package 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function KardexModule() {
  const { stockMovements, products } = usePOSStore();
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations for stats
  const totalMovements = stockMovements.length;
  const entriesCount = stockMovements.filter(m => m.type === 'in').length;
  const exitsCount = stockMovements.filter(m => m.type === 'out').length;
  const adjustmentsCount = stockMovements.filter(m => m.type === 'adjustment').length;

  // Filter stock movements
  const filteredMovements = stockMovements.filter(m => {
    const matchesProduct = selectedProductFilter === 'all' || m.productId === selectedProductFilter;
    const matchesType = selectedTypeFilter === 'all' || m.type === selectedTypeFilter;
    const matchesSearch = 
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.productSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.concept.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProduct && matchesType && matchesSearch;
  });

  // Export to simple CSV
  const exportCSV = () => {
    if (filteredMovements.length === 0) return;
    const headers = ['Fecha', 'Producto', 'SKU', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Concepto', 'Usuario'];
    const rows = filteredMovements.map(m => [
      new Date(m.timestamp).toLocaleString(),
      m.productName,
      m.productSku,
      m.type === 'in' ? 'Entrada' : m.type === 'out' ? 'Salida' : 'Ajuste',
      m.quantity,
      m.previousStock,
      m.newStock,
      m.concept,
      m.userName
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kardex_Inventario_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Kardex de Inventario</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Historial completo y trazabilidad de todos los movimientos de stock en tiempo real.</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredMovements.length === 0}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Historial (CSV)</span>
        </button>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Movimientos Totales', val: totalMovements, icon: <BarChart3 className="w-5 h-5 text-indigo-500" />, bg: 'from-indigo-50/50 to-purple-50/20 border-indigo-100' },
          { label: 'Entradas registradas', val: entriesCount, icon: <ArrowUpRight className="w-5 h-5 text-emerald-500" />, bg: 'from-emerald-50/50 to-teal-50/20 border-emerald-100' },
          { label: 'Salidas registradas', val: exitsCount, icon: <ArrowDownRight className="w-5 h-5 text-rose-500" />, bg: 'from-rose-50/50 to-orange-50/20 border-rose-100' },
          { label: 'Ajustes manuales', val: adjustmentsCount, icon: <RefreshCw className="w-5 h-5 text-amber-500" />, bg: 'from-amber-50/50 to-yellow-50/20 border-amber-100' }
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className={`bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between bg-gradient-to-tr ${c.bg}`}
          >
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{c.label}</p>
              <p className="text-2xl font-black text-slate-800 font-mono leading-none">{c.val}</p>
            </div>
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
              {c.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* FILTER & TABLE PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
        
        {/* FILTERS TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por SKU, nombre, motivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 transition-all placeholder-slate-400"
              />
            </div>

            {/* Product Select */}
            <div className="relative w-full sm:w-48">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="all">Todos los Productos</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Type Select */}
            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="all">Todos los Tipos</option>
                <option value="in">Entrada (+)</option>
                <option value="out">Salida (-)</option>
                <option value="adjustment">Ajuste (Manual)</option>
              </select>
            </div>

          </div>

          <div className="text-[11px] text-slate-400 font-bold font-mono">
            Mostrando {filteredMovements.length} de {stockMovements.length} movimientos
          </div>
        </div>

        {/* KARDEX TABLE */}
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Producto / SKU</th>
                <th className="p-3 text-center">Tipo</th>
                <th className="p-3 text-center">Cantidad</th>
                <th className="p-3 text-center">Había (Stock)</th>
                <th className="p-3 text-center">Hay (Stock)</th>
                <th className="p-3">Concepto / Motivo</th>
                <th className="p-3">Cajero / Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    No se encontraron movimientos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  let typeLabel = 'Ajuste';
                  let typeColor = 'text-amber-700 bg-amber-50 border-amber-200';
                  let typeIcon = <RefreshCw className="w-3 h-3 text-amber-500" />;

                  if (m.type === 'in') {
                    typeLabel = 'Entrada';
                    typeColor = 'text-emerald-750 bg-emerald-50 border-emerald-250';
                    typeIcon = <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
                  } else if (m.type === 'out') {
                    typeLabel = 'Salida';
                    typeColor = 'text-rose-700 bg-rose-50 border-rose-250';
                    typeIcon = <ArrowDownRight className="w-3 h-3 text-rose-500" />;
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div>
                          <span className="font-semibold text-slate-850 block">{m.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {m.productSku}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}>
                          {typeIcon}
                          <span>{typeLabel}</span>
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">
                        {m.type === 'out' ? '-' : m.type === 'in' ? '+' : ''}
                        {m.quantity}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{m.previousStock}</td>
                      <td className="p-3 text-center font-mono text-slate-900 font-bold">{m.newStock}</td>
                      <td className="p-3 max-w-[220px] truncate text-slate-650" title={m.concept}>
                        {m.concept}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-slate-800 font-bold">{m.userName}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
