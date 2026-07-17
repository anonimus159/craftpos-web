import React, { useState } from 'react';
import { User, Plus, Users, ShoppingBag, FolderOpen, Mail, Phone, MapPin, Receipt, Leaf, Check, X, AlertTriangle, Trash2 } from 'lucide-react';
import { usePOSStore } from '../store/store';
import { Client, Supplier } from '../types/types';

export default function ClientesProveedoresModule() {
  const {
    clients,
    suppliers,
    products,
    sales,
    addClient,
    updateClient,
    deleteClient,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchaseFromSupplier,
    appConfig
  } = usePOSStore();

  const sym = appConfig.currencySymbol || 'S/';

  const [activeSection, setActiveSection] = useState<'clients' | 'suppliers' | 'purchases'>('clients');

  // Supplier filter: 'all' | 'agro' | 'standard'
  const [supplierFilter, setSupplierFilter] = useState<'all' | 'agro' | 'standard'>('all');

  // Form states
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', companyName: '', isAgro: false });

  // Edit states
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Deletion confirm states
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);

  // Purchases Log state
  const [purchaseInvoices, setPurchaseInvoices] = useState([
    { id: 'pi-1', code: 'FAC-COMP-901', supplierName: 'Sabana Agro S.A.S.', date: '2026-06-24', total: 1200.00, items: '500kg Harina de Trigo, 200kg Fresas' },
    { id: 'pi-2', code: 'FAC-COMP-902', supplierName: 'Droguería Central S.A.', date: '2026-06-25', total: 1500.00, items: '300x Paracetamol, 100x Ibuprofeno' },
  ]);

  // Purchase Form states
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState('');
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('10');
  const [purchaseCost, setPurchaseCost] = useState('1.50');
  const [purchaseInvoiceCode, setPurchaseInvoiceCode] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    addClient(newClient);
    setNewClient({ name: '', email: '', phone: '', address: '' });
    setShowClientModal(false);
    showToast('Cliente registrado con éxito.');
  };

  const handleEditClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.name) return;
    updateClient(editingClient);
    setEditingClient(null);
    setShowEditClientModal(false);
    showToast('Cliente actualizado con éxito.');
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.companyName) return;
    addSupplier({
      name: newSupplier.name,
      email: newSupplier.email,
      phone: newSupplier.phone,
      companyName: newSupplier.companyName,
      isAgro: newSupplier.isAgro
    } as any);
    setNewSupplier({ name: '', email: '', phone: '', companyName: '', isAgro: false });
    setShowSupplierModal(false);
    showToast('Proveedor registrado con éxito.');
  };

  const handleEditSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier || !editingSupplier.name || !editingSupplier.companyName) return;
    updateSupplier(editingSupplier);
    setEditingSupplier(null);
    setShowEditSupplierModal(false);
    showToast('Proveedor actualizado con éxito.');
  };

  const handleRegisterPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(purchaseQty);
    const cost = parseFloat(purchaseCost);
    if (!selectedSupplierForPurchase || !selectedProductForPurchase || isNaN(qty) || isNaN(cost) || !purchaseInvoiceCode) return;
    
    // Process checkout on store
    purchaseFromSupplier(selectedSupplierForPurchase, selectedProductForPurchase, qty, cost);
    
    // Add to local PI log
    const supplier = suppliers.find(s => s.id === selectedSupplierForPurchase);
    const product = products.find(p => p.id === selectedProductForPurchase);
    
    const newPI = {
      id: `pi-${Date.now()}`,
      code: purchaseInvoiceCode,
      supplierName: supplier?.companyName || 'Proveedor',
      date: new Date().toISOString().split('T')[0],
      total: qty * cost,
      items: `${qty}x ${product?.name || 'Insumo/Producto'}`
    };
    
    setPurchaseInvoices(prev => [newPI, ...prev]);
    
    // Reset inputs
    setPurchaseInvoiceCode('');
    setPurchaseQty('10');
    setPurchaseCost('1.50');
    setSelectedSupplierForPurchase('');
    setSelectedProductForPurchase('');
    showToast('Compra registrada con éxito. Stock de producto/insumo incrementado.');
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(s => {
    if (supplierFilter === 'agro') return s.isAgro === true;
    if (supplierFilter === 'standard') return !s.isAgro;
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* TABS SELECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSection('clients')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeSection === 'clients'
                ? 'bg-cyan-600 border-cyan-700 text-white shadow-lg'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
          >
            Base de Datos Clientes
          </button>
          <button
            onClick={() => setActiveSection('suppliers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeSection === 'suppliers'
                ? 'bg-cyan-600 border-cyan-700 text-white shadow-lg'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
          >
            Proveedores de Mercadería
          </button>
          <button
            onClick={() => setActiveSection('purchases')}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeSection === 'purchases'
                ? 'bg-cyan-600 border-cyan-700 text-white shadow-lg'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
            }`}
          >
            Facturas de Compra (Restock)
          </button>
        </div>

        {activeSection !== 'purchases' && (
          <button
            onClick={() => activeSection === 'clients' ? setShowClientModal(true) : setShowSupplierModal(true)}
            className="px-4 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar {activeSection === 'clients' ? 'Cliente' : 'Proveedor'}</span>
          </button>
        )}
      </div>

      {/* SECTION RENDER */}
      {activeSection === 'clients' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Fichero de Clientes Frecuentes</span>
          </h3>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Datos Contacto</th>
                  <th className="p-3">Dirección Envío</th>
                  <th className="p-3 text-center">Visitas POS</th>
                  <th className="p-3 text-right">Monto Total Compras</th>
                  <th className="p-3 text-center">Nivel Cliente</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => {
                    let badge = 'General';
                    let badgeColor = 'text-slate-650 bg-slate-50 border-slate-200';

                    if (c.totalSpent > 300) {
                      badge = 'VIP Platino';
                      badgeColor = 'text-indigo-650 bg-indigo-50 border-indigo-200';
                    } else if (c.totalSpent > 100) {
                      badge = 'Cliente Frecuente';
                      badgeColor = 'text-emerald-750 bg-emerald-50 border-emerald-250';
                    }

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {c.name[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-850 block">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5 text-slate-600">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {c.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {c.phone}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.address}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-800">{c.visitsCount}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-850">{sym} {c.totalSpent.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                            {badge}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingClient(c);
                                setShowEditClientModal(true);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setClientToDelete(c)}
                              className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <FolderOpen className="w-4 h-4 text-indigo-600" />
              <span>Registro de Proveedores Mayoristas</span>
            </h3>
            
            {/* Filter Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSupplierFilter('all')}
                className={`px-3 py-1.5 font-bold rounded-lg ${
                  supplierFilter === 'all' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-650'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSupplierFilter('agro')}
                className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1 ${
                  supplierFilter === 'agro' ? 'bg-white text-emerald-650 shadow-sm' : 'text-slate-655'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                <span>Agrícolas</span>
              </button>
              <button
                onClick={() => setSupplierFilter('standard')}
                className={`px-3 py-1.5 font-bold rounded-lg ${
                  supplierFilter === 'standard' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-650'
                }`}
              >
                Estándar
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3">Razón Social</th>
                  <th className="p-3">Atención / Ventas</th>
                  <th className="p-3">Datos Contacto</th>
                  <th className="p-3 text-right">Volumen Compra</th>
                  <th className="p-3 text-center">Tipo / Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No hay proveedores registrados.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div>
                          <span className="font-semibold text-slate-850 block">{s.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {s.id}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-bold">{s.name}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5 text-slate-600">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {s.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {s.phone}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-850">{sym} {s.totalPurchases.toFixed(2)}</td>
                      <td className="p-3 text-center flex flex-col items-center justify-center gap-1 py-4">
                        {s.isAgro ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 text-emerald-750 bg-emerald-50">
                            <Leaf className="w-3 h-3 text-emerald-500" />
                            <span>Agrícola</span>
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-200 text-slate-600 bg-slate-50">
                            Estándar
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">Homologado</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingSupplier(s);
                              setShowEditSupplierModal(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setSupplierToDelete(s)}
                            className="px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'purchases' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Purchase Registry Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-xs font-bold text-slate-700 mb-4 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-200 pb-3">
              <Receipt className="w-4 h-4 text-indigo-650" />
              <span>Registrar Compra / Factura de Entrada</span>
            </h3>

            <form onSubmit={handleRegisterPurchase} className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div>
                <label className="block text-slate-500 mb-1">Nro de Factura Proveedor</label>
                <input
                  type="text"
                  required
                  value={purchaseInvoiceCode}
                  onChange={(e) => setPurchaseInvoiceCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none"
                  placeholder="Ej. FAC-COMP-4022"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Proveedor Emisor</label>
                <select
                  required
                  value={selectedSupplierForPurchase}
                  onChange={(e) => setSelectedSupplierForPurchase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 cursor-pointer outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} {s.isAgro ? '(Agro)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Producto / Insumo a Abastecer</label>
                <select
                  required
                  value={selectedProductForPurchase}
                  onChange={(e) => setSelectedProductForPurchase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 cursor-pointer outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.storeType.toUpperCase()}] {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Cantidad Recibida</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Costo Unitario ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Ingresar Compra a Stock</span>
              </button>
            </form>
          </div>

          {/* Simulated Invoices Log */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl flex flex-col">
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-200 pb-3">
              <Receipt className="w-4 h-4 text-emerald-500" />
              <span>Historial de Facturas de Compra (Restock)</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <th className="p-3">Factura Compra</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Fecha de Ingreso</th>
                    <th className="p-3">Detalle / Items</th>
                    <th className="p-3 text-right">Total Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {purchaseInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-650">{invoice.code}</td>
                      <td className="p-3">{invoice.supplierName}</td>
                      <td className="p-3 text-slate-500">{invoice.date}</td>
                      <td className="p-3 font-semibold">{invoice.items}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-850">{sym} {invoice.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* CREATE CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Registrar Nuevo Cliente</span>
            </h3>
            <form onSubmit={handleClientSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-750">
              <div>
                <label className="block text-slate-500 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  placeholder="Ej. Carlos Mendoza"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. +51 900 111 222"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. carlos@hotmail.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Dirección de Envío</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  placeholder="Ej. Calle Los Pinos 102, Lima"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. 0800-999-3000"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                    placeholder="Ej. ventas@surdistribuidora.com"
                  />
                </div>
              </div>

              {/* Agro Selector */}
              <div className="flex items-center gap-2 py-1.5">
                <input
                  type="checkbox"
                  id="isAgroCheckbox"
                  checked={newSupplier.isAgro}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, isAgro: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-650 cursor-pointer"
                />
                <label htmlFor="isAgroCheckbox" className="text-slate-700 cursor-pointer flex items-center gap-1 font-bold">
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Proveedor de Origen Agrícola / Materia Prima Orgánica</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
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
      {/* EDIT CLIENT MODAL */}
      {showEditClientModal && editingClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Editar Cliente</span>
            </h3>
            <form onSubmit={handleEditClientSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-755">
              <div>
                <label className="block text-slate-500 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Dirección de Envío</label>
                <input
                  type="text"
                  value={editingClient.address || ''}
                  onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClient(null);
                    setShowEditClientModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Actualizar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SUPPLIER MODAL */}
      {showEditSupplierModal && editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
              <span>Editar Proveedor Mayorista</span>
            </h3>
            <form onSubmit={handleEditSupplierSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-755">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Contacto Comercial</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Razón Social / Empresa</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.companyName}
                    onChange={(e) => setEditingSupplier(prev => prev ? ({ ...prev, companyName: e.target.value }) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ''}
                    onChange={(e) => setEditingSupplier(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 outline-none"
                  />
                </div>
              </div>

              {/* Agro Selector */}
              <div className="flex items-center gap-2 py-1.5">
                <input
                  type="checkbox"
                  id="editIsAgroCheckbox"
                  checked={editingSupplier.isAgro}
                  onChange={(e) => setEditingSupplier(prev => prev ? ({ ...prev, isAgro: e.target.checked }) : null)}
                  className="w-4 h-4 accent-indigo-650 cursor-pointer"
                />
                <label htmlFor="editIsAgroCheckbox" className="text-slate-700 cursor-pointer flex items-center gap-1 font-bold">
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Proveedor de Origen Agrícola / Materia Prima Orgánica</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier(null);
                    setShowEditSupplierModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Actualizar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CLIENT MODAL */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-md font-bold text-rose-400 flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Confirmar Eliminación</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              ¿Está seguro de que desea eliminar al cliente <strong className="text-white font-bold">"{clientToDelete.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteClient(clientToDelete.id);
                  showToast(`Cliente "${clientToDelete.name}" eliminado.`);
                  setClientToDelete(null);
                }}
                className="px-5 py-2 bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20 transition-all"
              >
                Eliminar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SUPPLIER MODAL */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-md font-bold text-rose-400 flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Confirmar Eliminación</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              ¿Está seguro de que desea eliminar al proveedor <strong className="text-white font-bold">"{supplierToDelete.companyName}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteSupplier(supplierToDelete.id);
                  showToast(`Proveedor "${supplierToDelete.companyName}" eliminado.`);
                  setSupplierToDelete(null);
                }}
                className="px-5 py-2 bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20 transition-all"
              >
                Eliminar Proveedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <Check className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
