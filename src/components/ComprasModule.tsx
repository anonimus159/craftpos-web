import React, { useState } from 'react';
import { usePOSStore } from '../store/store';
import { 
  ShoppingBag, Plus, Trash2, CheckCircle2, XCircle, 
  Eye, FileText, Search, User, Package, Calendar, 
  CreditCard, ChevronDown, Check, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PurchaseOrder, Supplier, Product } from '../types/types';

export default function ComprasModule() {
  const { 
    purchaseOrders, suppliers, products, activeSession, operatorName,
    addPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, addSupplier,
    appConfig
  } = usePOSStore();

  const sym = appConfig.currencySymbol || 'S/';

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'create' | 'suppliers'>('orders');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  
  // Shopping Cart for Purchase Order
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number; costPrice: number }[]>([]);
  const [newItemProductId, setNewItemProductId] = useState('');
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemCost, setNewItemCost] = useState(1.50);

  // Modals / Details
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', companyName: '', isAgro: false });

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'received' | 'cancelled'>('all');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add Item to Order Cart
  const handleAddItemToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemProductId) return;
    
    // Check if product is already in order cart
    const exists = cartItems.find(i => i.productId === newItemProductId);
    if (exists) {
      setCartItems(prev => prev.map(i => i.productId === newItemProductId 
        ? { ...i, quantity: i.quantity + newItemQty, costPrice: newItemCost } 
        : i
      ));
    } else {
      setCartItems(prev => [...prev, { productId: newItemProductId, quantity: newItemQty, costPrice: newItemCost }]);
    }
    
    setNewItemProductId('');
    setNewItemQty(10);
    setNewItemCost(1.50);
    showToast('Producto agregado al carrito de compra.');
  };

  // Remove Item from Order Cart
  const handleRemoveFromCart = (prodId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== prodId));
  };

  // Submit Purchase Order
  const handleCreateOrder = () => {
    if (!selectedSupplierId || cartItems.length === 0) return;
    
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const itemsWithDetails = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Insumo',
        quantity: item.quantity,
        costPrice: item.costPrice
      };
    });

    const total = cartItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);

    addPurchaseOrder({
      supplierId: selectedSupplierId,
      supplierName: supplier.companyName,
      status: 'pending',
      items: itemsWithDetails,
      total,
      userId: activeSession?.id || 'admin',
    });

    // Reset Form
    setCartItems([]);
    setSelectedSupplierId('');
    setActiveSubTab('orders');
    showToast('Orden de Compra creada con éxito en estado Pendiente.');
  };

  // Receive Purchase Order
  const handleReceiveOrder = (orderId: string) => {
    receivePurchaseOrder(orderId);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: 'received', receivedAt: new Date().toISOString() } : null);
    }
    showToast('Orden de compra recibida. El stock de productos ha sido actualizado.');
  };

  // Cancel Purchase Order
  const handleCancelOrder = (orderId: string) => {
    cancelPurchaseOrder(orderId);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
    showToast('Orden de compra cancelada.', 'error');
  };

  // Create Supplier
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.companyName) return;
    addSupplier(newSupplier);
    setNewSupplier({ name: '', email: '', phone: '', companyName: '', isAgro: false });
    setShowNewSupplierModal(false);
    showToast('Proveedor registrado con éxito.');
  };

  // Filters OC list
  const filteredOrders = purchaseOrders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="w-full flex flex-col gap-6 text-slate-800 font-sans relative">
      
      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-2 font-bold text-xs ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-250 text-emerald-700' 
                : 'bg-rose-50 border-rose-250 text-rose-700'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <span>Módulo de Compras & Abastecimiento</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Gestión de órdenes de compra, entrada de mercadería y directorio de proveedores mayoristas.</p>
        </div>

        {/* TABS SELECTION */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'orders' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Órdenes de Compra
          </button>
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'create' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Orden</span>
          </button>
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-4 py-2 font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'suppliers' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Proveedores
          </button>
        </div>
      </div>

      {/* MAIN CONTENT BLOCK */}
      {activeSubTab === 'orders' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* ORDERS LIST */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Historial de Órdenes de Compra</span>
              </h3>

              {/* Status filter */}
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-0.5 text-[11px] font-bold">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'received', label: 'Recibidas' },
                  { id: 'cancelled', label: 'Canceladas' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setOrderStatusFilter(opt.id as any)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      orderStatusFilter === opt.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="p-3">Referencia OC</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Fecha Creación</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">Total Pedido</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                        No se encontraron órdenes de compra registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      let statusBadge = 'Pendiente';
                      let statusClass = 'text-amber-700 bg-amber-50 border-amber-200';
                      
                      if (order.status === 'received') {
                        statusBadge = 'Recibido';
                        statusClass = 'text-emerald-700 bg-emerald-50 border-emerald-250';
                      } else if (order.status === 'cancelled') {
                        statusBadge = 'Cancelado';
                        statusClass = 'text-rose-700 bg-rose-50 border-rose-250';
                      }

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-650">{order.id}</td>
                          <td className="p-3 font-bold text-slate-800">{order.supplierName}</td>
                          <td className="p-3 text-slate-400 font-mono">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}>
                              {statusBadge}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{sym} {order.total.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAIL PANEL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Detalle de la Orden</span>
            </h3>

            {selectedOrder ? (
              <motion.div 
                key={selectedOrder.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4 text-xs font-semibold text-slate-700"
              >
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Referencia</span>
                    <span className="text-slate-800 font-bold text-xs">{selectedOrder.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Estado</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedOrder.status === 'received' 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-250' 
                        : selectedOrder.status === 'cancelled' 
                          ? 'text-rose-700 bg-rose-50 border-rose-200' 
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      {selectedOrder.status === 'received' ? 'Recibido' : selectedOrder.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-3.5">
                  <div>
                    <span className="text-slate-400 text-[10px] block">PROVEEDOR</span>
                    <span className="text-slate-800 font-bold">{selectedOrder.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">CREADA POR</span>
                    <span className="text-slate-800 font-bold font-mono">ID: {selectedOrder.userId}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-slate-400 text-[10px] block">ITEMS DEL PEDIDO</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="p-2">Producto</th>
                          <th className="p-2 text-center">Cant.</th>
                          <th className="p-2 text-right">Costo</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold">{item.productName}</td>
                            <td className="p-2 text-center font-mono">{item.quantity}</td>
                            <td className="p-2 text-right font-mono">{sym} {item.costPrice.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono font-bold">{sym} {(item.quantity * item.costPrice).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-800 text-white rounded-xl p-3.5 font-mono">
                  <span className="font-bold text-xs uppercase">Total de Compra:</span>
                  <span className="text-base font-black">{sym} {selectedOrder.total.toFixed(2)}</span>
                </div>

                {selectedOrder.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="flex-1 py-2.5 border border-rose-250 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      onClick={() => handleReceiveOrder(selectedOrder.id)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/25"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recibir Stock</span>
                    </button>
                  </div>
                )}

                {selectedOrder.receivedAt && (
                  <div className="text-[10px] text-slate-400 font-mono text-center mt-2">
                    Recibido el: {new Date(selectedOrder.receivedAt).toLocaleString()}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium">
                Seleccione una orden de compra para ver sus detalles y registrar recepción de stock.
              </div>
            )}
          </div>

        </div>
      )}

      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CREATE FORM */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3">
              <span>Registrar Nueva Orden de Compra</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Seleccionar Proveedor Emisor</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} ({s.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(true)}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-650"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Proveedor Mayorista</span>
                </button>
              </div>
            </div>

            {/* ADD ITEM SUBFORM */}
            <form onSubmit={handleAddItemToCart} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Agregar producto al pedido</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-slate-500 mb-1">Producto</label>
                  <select
                    required
                    value={newItemProductId}
                    onChange={(e) => {
                      setNewItemProductId(e.target.value);
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) setNewItemCost(prod.costPrice);
                    }}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                  >
                    <option value="">-- Seleccionar --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Cantidad a Comprar</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value === '' ? ('' as any) : (parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Costo Unitario ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value === '' ? ('' as any) : (parseFloat(e.target.value) || 0.0))}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Añadir al Carrito
                </button>
              </div>
            </form>

            {/* ORDER ITEMS TABLE */}
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Artículos en la Orden</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Costo Unitario</th>
                      <th className="p-3 text-right">Costo Total</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-850 font-medium">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                          Agregue al menos un producto a la lista.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item, idx) => {
                        const prod = products.find(p => p.id === item.productId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/20">
                            <td className="p-3 font-bold">{prod?.name || 'Insumo'}</td>
                            <td className="p-3 text-center font-mono">{item.quantity}</td>
                             <td className="p-3 text-right font-mono">{sym} {item.costPrice.toFixed(2)}</td>
                             <td className="p-3 text-right font-mono font-bold">{sym} {(item.quantity * item.costPrice).toFixed(2)}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveFromCart(item.productId)}
                                className="p-1 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

          {/* ORDER SUMMARY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-650" />
                <span>Resumen del Pedido</span>
              </h3>

              <div className="flex flex-col gap-3 text-xs font-semibold text-slate-750">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Proveedor:</span>
                  <span className="text-slate-800 font-bold">
                    {suppliers.find(s => s.id === selectedSupplierId)?.companyName || 'Ninguno'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Items:</span>
                  <span className="text-slate-800 font-bold font-mono">{cartItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cant. Artículos:</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <div className="flex justify-between items-center bg-slate-900 text-white rounded-xl p-4 font-mono">
                <span className="font-bold text-xs uppercase">Subtotal Neto:</span>
                <span className="text-lg font-black">
                  {sym} {cartItems.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={!selectedSupplierId || cartItems.length === 0}
                className="w-full py-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-indigo-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Generar Orden de Compra</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-indigo-600" />
              <span>Directorio de Proveedores Mayoristas</span>
            </h3>
            <button
              onClick={() => setShowNewSupplierModal(true)}
              className="px-4 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Proveedor</span>
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="p-3">Razón Social</th>
                  <th className="p-3">Contacto Comercial</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3 text-center">Tipo</th>
                  <th className="p-3 text-right">Volumen Compras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                      No hay proveedores registrados.
                    </td>
                  </tr>
                ) : (
                  suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div>
                          <span className="font-semibold text-slate-850 block">{s.companyName}</span>
                          <span className="text-[10px] text-slate-450 font-mono">ID: {s.id}</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{s.name}</td>
                      <td className="p-3 text-slate-500 font-mono">{s.email}</td>
                      <td className="p-3 text-slate-500 font-mono">{s.phone}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.isAgro 
                            ? 'text-emerald-700 border-emerald-200 bg-emerald-50' 
                            : 'text-slate-600 border-slate-200 bg-slate-50'
                        }`}>
                          {s.isAgro ? 'Agrícola' : 'Estándar'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{sym} {(s.totalPurchases || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <FolderOpen className="w-5 h-5 text-indigo-650" />
              <span>Registrar Nuevo Proveedor Mayorista</span>
            </h3>
            <form onSubmit={handleSupplierSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-750">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Contacto Comercial</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. Roberto Sánchez"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Razón Social / Empresa</label>
                  <input
                    type="text"
                    required
                    value={newSupplier.companyName}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. Distribuidora Sur S.A."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. 0800-999-3000"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. ventas@surdistribuidora.com"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1.5">
                <input
                  type="checkbox"
                  id="comprasIsAgroCheckbox"
                  checked={newSupplier.isAgro}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, isAgro: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-650 cursor-pointer"
                />
                <label htmlFor="comprasIsAgroCheckbox" className="text-slate-700 cursor-pointer flex items-center gap-1 font-bold">
                  <span>Proveedor de Origen Agrícola / Materia Prima</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
