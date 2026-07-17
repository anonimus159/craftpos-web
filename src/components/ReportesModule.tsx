import React, { useState } from 'react';
import { usePOSStore } from '../store/store';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Calendar, AlertTriangle, Box, DollarSign, ListOrdered, 
  ArrowUpRight, ArrowDownRight, User, Share2, Download, CheckCircle, BarChart3, Clock, MapPin, Layers
} from 'lucide-react';

export default function ReportesModule() {
  const {
    sales,
    products,
    cashMovements,
    companyConfig,
    branches,
    activeBranchId,
    productionBatches,
    mermaLogs,
    customOrders,
    warehouseTransfers
    ,appConfig
  } = usePOSStore();

  const sym = appConfig.currencySymbol || "S/";

  const [activeReportTab, setActiveReportTab] = useState<'consolidated' | 'verticals' | 'export'>('consolidated');
  const [selectedVertical, setSelectedVertical] = useState<'restaurant' | 'pharmacy' | 'bakery' | 'fruit' | 'business'>('restaurant');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedBranchId, setSelectedBranchId] = useState<'all' | string>('all');

  // Export simulation states
  const [exportingType, setExportingType] = useState<'excel' | 'pdf' | null>(null);
  const [exportMessage, setExportMessage] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. KPI Calculations
  const activeBranchName = selectedBranchId === 'all' ? 'Todas las sedes' : (branches.find(b => b.id === selectedBranchId)?.name || 'Sede');

  const filteredSalesByBranch = sales.filter(s => {
    if (selectedBranchId === 'all') return true;
    return s.branchId === selectedBranchId;
  });

  const totalSalesVolume = filteredSalesByBranch.reduce((acc, s) => acc + s.total, 0);
  const transactionCount = filteredSalesByBranch.length;
  
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Chart Data: Sales share by Vertical
  const getSalesShareByModule = () => {
    const dataObj: Record<string, number> = {
      restaurant: 0,
      pharmacy: 0,
      bakery: 0,
      fruit: 0,
      business: 0
    };

    filteredSalesByBranch.forEach(s => {
      if (dataObj[s.storeType] !== undefined) {
        dataObj[s.storeType] += s.total;
      }
    });

    const labelMap: Record<string, string> = {
      restaurant: 'Restaurante',
      pharmacy: 'Farmacia',
      bakery: 'Panadería',
      fruit: 'Heladería & Postres',
      business: 'Almacén General'
    };

    return Object.entries(dataObj).map(([key, val]) => ({
      name: labelMap[key] || key,
      value: parseFloat(val.toFixed(2))
    })).filter(item => item.value > 0);
  };

  const pieData = getSalesShareByModule();
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

  // Chart Data: Hourly / Transactional Sales Timeline
  const getSalesTimeline = () => {
    if (filteredSalesByBranch.length === 0) {
      return [
        { time: '10:00', total: 0 },
        { time: '12:00', total: 0 },
        { time: '14:00', total: 0 },
        { time: '16:00', total: 0 }
      ];
    }

    const sortedSales = [...filteredSalesByBranch].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return sortedSales.map((s, idx) => ({
      time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: parseFloat(s.total.toFixed(2)),
      title: `Venta ${idx + 1}`
    }));
  };

  const timelineData = getSalesTimeline();

  // Bestselling Products
  const getBestsellingProducts = () => {
    const countMap: Record<string, { name: string; qty: number; totalSales: number; category: string }> = {};

    filteredSalesByBranch.forEach(sale => {
      sale.items.forEach(item => {
        const id = item.product.id;
        const mult = item.weight || item.quantity;
        const price = item.isGenericEquivalent ? (item.product.costPrice * 1.5) : item.product.salePrice;
        
        if (!countMap[id]) {
          countMap[id] = { 
            name: item.product.name, 
            qty: 0, 
            totalSales: 0,
            category: item.product.category
          };
        }
        countMap[id].qty += mult;
        countMap[id].totalSales += price * mult;
      });
    });

    return Object.values(countMap)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
  };

  const bestSellers = getBestsellingProducts();

  // Exits / Cash cuts
  const cashOutMovements = cashMovements.filter(m => m.type === 'out');

  // Excel / PDF Simulation Trigger
  const triggerExport = (type: 'excel' | 'pdf') => {
    setExportingType(type);
    setExportMessage(type === 'excel' 
      ? 'Generando hoja de cálculo XLSX consolidada. Procesando registros de ventas, kardex y cortes de caja...' 
      : 'Estructurando documento PDF gerencial. Insertando gráficos vectoriales y membretes tributarios de la DIAN...'
    );

    setTimeout(() => {
      setExportMessage('Aplicando firmas criptográficas de auditoría...');
      setTimeout(() => {
        setExportingType(null);
        showToast(`¡Correcto! Reporte descargado como DIAN-REPORTE-CONSOLIDADO.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      }, 1000);
    }, 1200);
  };

  // --- Vertical Custom Metric Calculations ---
  // Restaurant
  const restSales = sales.filter(s => s.storeType === 'restaurant');
  const restTotalTips = restSales.reduce((acc, s) => acc + (s.tipAmount || 0), 0);
  const restServiceTypes = {
    mesa: restSales.filter(s => s.orderType === 'mesa').length,
    llevar: restSales.filter(s => s.orderType === 'llevar').length,
    domicilio: restSales.filter(s => s.orderType === 'domicilio').length
  };

  // Pharmacy
  const pharmSales = sales.filter(s => s.storeType === 'pharmacy');
  const pharmControlledSales = pharmSales.reduce((acc, s) => {
    const controlledQty = s.items.reduce((sum, item) => sum + (item.product.isControlled ? item.quantity : 0), 0);
    return acc + controlledQty;
  }, 0);
  const pharmGenericSales = pharmSales.reduce((acc, s) => {
    const genericSum = s.items.reduce((sum, item) => sum + (item.product.isGeneric || item.isGenericEquivalent ? item.quantity : 0), 0);
    return acc + genericSum;
  }, 0);

  // Bakery
  const bakerySales = sales.filter(s => s.storeType === 'bakery');
  const bakeryCompletedBatches = productionBatches.filter(b => b.status === 'done').length;
  const bakerySpecialOrdersPending = customOrders.filter(o => o.status === 'pending').length;

  // Heladería
  const fruitSales = sales.filter(s => s.storeType === 'fruit');
  const fruitTotalMermasCount = mermaLogs.length;
  const fruitTotalMermasCost = mermaLogs.reduce((acc, m) => acc + m.cost, 0);

  // Almacén
  const businessSales = sales.filter(s => s.storeType === 'business');
  const businessStockValuation = products
    .filter(p => p.storeType === 'business')
    .reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const businessTransfersCount = warehouseTransfers.length;

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* FILTER TOP BAR */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Panel Gerencial y Reportes</h2>
          <p className="text-xs text-slate-500">Métricas analíticas consolidadas e informes por tipo de negocio en {activeBranchName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-indigo-650" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">Todas las Sedes</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Date range Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1 font-bold rounded-lg ${
                dateRange === 'today' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-600'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 font-bold rounded-lg ${
                dateRange === 'week' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-600'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 font-bold rounded-lg ${
                dateRange === 'month' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-600'
              }`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('consolidated')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeReportTab === 'consolidated' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Dashboard Consolidado
        </button>
        <button
          onClick={() => setActiveReportTab('verticals')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeReportTab === 'verticals' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Informes Especializados por Rubro
        </button>
        <button
          onClick={() => setActiveReportTab('export')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeReportTab === 'export' ? 'bg-white text-indigo-650 shadow' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Exportación de Documentos
        </button>
      </div>

      {/* TAB CONTENT: CONSOLIDATED */}
      {activeReportTab === 'consolidated' && (
        <>
          {/* KPI GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Volumen Facturado</span>
                <strong className="text-xl font-black font-mono text-slate-800">{sym} {totalSalesVolume.toFixed(2)}</strong>
                <span className="text-[10px] text-emerald-650 block mt-1 font-bold">Total Acumulado</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-650 border border-emerald-100">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Tickets de Venta</span>
                <strong className="text-xl font-black font-mono text-slate-800">{transactionCount} ventas</strong>
                <span className="text-[10px] text-indigo-650 block mt-1 font-bold">Cajas activas</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-100">
                <ListOrdered className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Alertas Stock Mínimo</span>
                <strong className="text-xl font-black font-mono text-slate-800">{lowStockCount} SKU</strong>
                <span className="text-[10px] text-amber-650 block mt-1 font-bold">Reponer insumos</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-650 border border-amber-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Productos Agotados</span>
                <strong className="text-xl font-black font-mono text-slate-800">{outOfStockCount} SKU</strong>
                <span className="text-[10px] text-red-600 block mt-1 font-bold">Sin existencias</span>
              </div>
              <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
                <Box className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* CHARTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-[360px] shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Curva de Facturación por Ventas (Día Actual)</span>
                </h3>
              </div>
              <div className="flex-1 w-full text-[10px] font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#1e293b' }} />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-[360px] shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>Cuota de Ventas por Rubro</span>
                </h3>
              </div>
              <div className="flex-1 w-full flex items-center justify-center text-[10px] font-mono relative">
                {pieData.length === 0 ? (
                  <span className="text-slate-400 font-bold">Sin datos de facturación</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#1e293b' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 9 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-indigo-650" />
                <span>Top 5 Productos Más Vendidos</span>
              </h3>
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5 text-center">Cant. Vendida</th>
                      <th className="p-2.5 text-right">Facturado ({sym})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bestSellers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 font-mono">
                          No hay transacciones registradas.
                        </td>
                      </tr>
                    ) : (
                      bestSellers.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-slate-850 font-bold">{item.name}</td>
                          <td className="p-2.5 text-slate-500">{item.category}</td>
                          <td className="p-2.5 text-center font-mono">{item.qty.toFixed(1)}</td>
                          <td className="p-2.5 text-right font-mono text-emerald-650 font-black">{sym} {item.totalSales.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span>Egresos y Retiros Auxiliares de Caja</span>
              </h3>
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="p-2.5">Hora</th>
                      <th className="p-2.5">Concepto / Retiro</th>
                      <th className="p-2.5">Cajero</th>
                      <th className="p-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {cashOutMovements.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400 font-mono">
                          No se registran egresos auxiliares.
                        </td>
                      </tr>
                    ) : (
                      cashOutMovements.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-slate-500">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="p-2.5 text-slate-800 font-semibold">{m.concept}</td>
                          <td className="p-2.5 text-slate-500">{m.user}</td>
                          <td className="p-2.5 text-right font-mono text-red-600 font-bold">- {sym} {m.amount.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB CONTENT: VERTICAL SPECIFIC REPORTS */}
      {activeReportTab === 'verticals' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vertical Menu selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm text-xs font-bold">
            <h4 className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">Seleccionar Rubro</h4>
            {[
              { id: 'restaurant', label: 'Restaurante', color: 'border-rose-500 text-rose-650' },
              { id: 'pharmacy', label: 'Farmacia', color: 'border-emerald-500 text-emerald-650' },
              { id: 'bakery', label: 'Panadería', color: 'border-amber-500 text-amber-650' },
              { id: 'fruit', label: 'Heladería & Postres', color: 'border-pink-500 text-pink-600' },
              { id: 'business', label: 'Almacén General', color: 'border-blue-500 text-blue-650' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVertical(v.id as any)}
                className={`w-full text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  selectedVertical === v.id
                    ? `bg-slate-50 border-l-4 ${v.color} shadow-sm`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Specialized Report Panel */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[400px]">
            {selectedVertical === 'restaurant' && (
              <div className="flex flex-col gap-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Informe Técnico - Restaurante</h3>
                  <p className="text-xs text-slate-500">Métricas de consumo en mesas, comandas a cocina y propinas de servicio</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Propinas Acumuladas</span>
                    <strong className="block text-lg font-mono font-black text-rose-600 mt-1">{sym} {restTotalTips.toFixed(2)}</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Tickets Emitidos</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{restSales.length} transacciones</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Servicios por Mesa</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{restServiceTypes.mesa} pedidos</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-850 mb-3 uppercase">Distribución de Canales de Venta</h4>
                  <div className="flex flex-col gap-2.5 text-xs font-medium">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Servicio de Mesa (Comanda Mesas):</span>
                      <strong className="text-slate-850">{restServiceTypes.mesa} pedidos</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <span className="text-slate-500">Ventas para Llevar (Mostrador):</span>
                      <strong className="text-slate-850">{restServiceTypes.llevar} pedidos</strong>
                    </div>
                    <div className="flex justify-between items-center pb-0.5">
                      <span className="text-slate-500">Pedidos a Domicilio:</span>
                      <strong className="text-slate-850">{restServiceTypes.domicilio} pedidos</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedVertical === 'pharmacy' && (
              <div className="flex flex-col gap-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Informe de Control Farmacéutico</h3>
                  <p className="text-xs text-slate-500">Métricas de medicamentos controlados (receta archivada) y genéricos vendidos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Medicamentos Controlados</span>
                    <strong className="block text-lg font-mono font-black text-emerald-650 mt-1">{pharmControlledSales} uds.</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Medicamentos Genéricos</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{pharmGenericSales} uds.</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Ventas Totales Rubro</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{sym} {pharmSales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 bg-amber-50 text-amber-800 rounded-xl text-xs flex gap-2 mt-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <h5 className="font-bold uppercase">Auditoría Regulatoria de Controlados</h5>
                    <p className="mt-0.5 font-medium leading-relaxed">
                      Se registraron {pharmControlledSales} dispensaciones de medicamentos clasificados bajo control oficial del Ministerio de Salud. Las actas físicas de recetas médicas archivadas deben conciliarse con los lotes registrados en el Kardex.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedVertical === 'bakery' && (
              <div className="flex flex-col gap-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Informe de Producción y Panadería</h3>
                  <p className="text-xs text-slate-500">Control de planificación diaria, lotes de horneado y encargos especiales</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Lotes Completados</span>
                    <strong className="block text-lg font-mono font-black text-amber-600 mt-1">{bakeryCompletedBatches} lotes</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Encargos Pendientes</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{bakerySpecialOrdersPending} pedidos</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Facturado</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{sym} {bakerySales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Pedidos Especiales Activos</h4>
                  <div className="text-xs text-slate-600 flex flex-col gap-2">
                    <p>
                      Los pedidos especiales a entregar requieren verificación en el panel de Ventas - Pedidos Especiales. Asegurar materias primas de horneo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedVertical === 'fruit' && (
              <div className="flex flex-col gap-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Informe de Mermas - Heladería & Postres</h3>
                  <p className="text-xs text-slate-500">Métricas de control de mermas agrícolas, helados derretidos o insumos vencidos</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Mermas Registradas</span>
                    <strong className="block text-lg font-mono font-black text-pink-600 mt-1">{fruitTotalMermasCount} incidentes</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Costo de Pérdidas</span>
                    <strong className="block text-lg font-mono font-black text-red-600 mt-1">{sym} {fruitTotalMermasCost.toFixed(2)}</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Facturación Rubro</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{sym} {fruitSales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-850 uppercase mb-2">Desglose de Pérdidas (Conceptos)</h4>
                  <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">Pérdidas acumuladas por deterioro físico o vencimiento de toppings y frutas frescas:</p>
                  <div className="w-full overflow-x-auto rounded-lg border border-slate-200 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-500">
                          <th className="p-2">Producto</th>
                          <th className="p-2 text-center">Cant</th>
                          <th className="p-2">Motivo</th>
                          <th className="p-2 text-right">Costo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                        {mermaLogs.map(m => (
                          <tr key={m.id}>
                            <td className="p-2 text-slate-850">{m.productName}</td>
                            <td className="p-2 text-center">{m.qty} {m.unit}</td>
                            <td className="p-2 text-slate-550 capitalize">{m.concept}</td>
                            <td className="p-2 text-right text-red-600">{sym} {m.cost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {selectedVertical === 'business' && (
              <div className="flex flex-col gap-5">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-800">Informe de Almacén y Logística</h3>
                  <p className="text-xs text-slate-500">Valoración total de stock en bodegas y transferencias internas de mercadería</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Valoración de Stock (Costo)</span>
                    <strong className="block text-lg font-mono font-black text-blue-600 mt-1">{sym} {businessStockValuation.toFixed(2)}</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Transferencias Bodega</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{businessTransfersCount} envíos</strong>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Ventas Totales</span>
                    <strong className="block text-lg font-mono font-black text-slate-850 mt-1">{sym} {businessSales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                  <h4 className="text-xs font-bold text-slate-850 uppercase mb-2">Auditoría Logística de Bodegas</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Se registran {businessTransfersCount} solicitudes de traslado físico entre las bodegas locales. El stock valorizado acumulado se calcula con base en los costos unitarios homologados de los proveedores.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: EXPORTS PANEL */}
      {activeReportTab === 'export' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row gap-8 items-center justify-between min-h-[350px]">
          
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <Download className="w-5 h-5 text-indigo-650" />
              <span>Exportar Reportes Fiscales y Auditorías</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Obtenga copias estructuradas del balance del POS. Cumple con los requerimientos de la DIAN en Colombia para el seguimiento del correlativo correlacionado del Libro de Caja y el Kardex del inventario valorizado.
            </p>
            
            <div className="flex flex-col gap-2.5 mt-3 text-xs font-bold text-slate-655">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Incluye Balance de Impuestos de IVA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Incluye Reportes de Control de Mermas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Incluye Firmas Digitales del Operador POS</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 text-xs font-semibold text-slate-700">
            <h4 className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-250 pb-2">Seleccionar Formato</h4>
            
            {exportingType ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                <Clock className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="font-mono text-[10px] text-indigo-600 leading-relaxed font-bold animate-pulse">
                  {exportMessage}
                </span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => triggerExport('excel')}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Exportar a Excel (XLSX)</span>
                </button>
                
                <button
                  onClick={() => triggerExport('pdf')}
                  className="w-full py-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl cursor-pointer font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Exportar a PDF Firmado</span>
                </button>
              </>
            )}
          </div>

        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-bold ${
            toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
