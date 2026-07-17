import React, { useState } from 'react';
import { usePOSStore } from '../store/store';
import { Quote, Product, CartItem } from '../types/types';
import { FileText, Plus, Check, RefreshCw, ShoppingCart, Trash2, ShieldAlert, AlertTriangle, Download, Eye, FileCode, Printer, Send, X } from 'lucide-react';

interface CotizacionesModuleProps {
  setActiveTab: (tab: string) => void;
}

export default function CotizacionesModule({ setActiveTab }: CotizacionesModuleProps) {
  const {
    currentModule,
    products,
    clients,
    quotes,
    addQuote,
    convertQuoteToSale,
    deleteQuote,
    companyConfig,
    dianConfig,
    appConfig
  } = usePOSStore();

  const sym = appConfig.currencySymbol || 'S/';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Quote | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Create quote states
  const [selectedClientId, setSelectedClientId] = useState('c-gen');
  const [quoteItems, setQuoteItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isElectronic, setIsElectronic] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  // Filter quotes belonging to current environment items
  const filteredQuotes = quotes.filter(q => 
    q.items.length > 0 && q.items[0].product.storeType === currentModule
  );

  const catalogProducts = products.filter(p => 
    p.storeType === currentModule && 
    (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddItemToQuote = (product: Product) => {
    const existingIdx = quoteItems.findIndex(i => i.product.id === product.id);
    if (existingIdx > -1) {
      const updated = [...quoteItems];
      updated[existingIdx].quantity += 1;
      setQuoteItems(updated);
    } else {
      setQuoteItems([...quoteItems, { product, quantity: 1, discountPercentage: 0 }]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems(quoteItems.filter(i => i.product.id !== id));
  };

  const handleUpdateQty = (id: string, qty: number) => {
    setQuoteItems(quoteItems.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) {
      showToast('No hay ítems en la cotización.', 'error');
      return;
    }
    
    const clientName = clients.find(c => c.id === selectedClientId)?.name || 'Cliente General';
    addQuote(clientName, quoteItems, isElectronic);
    
    showToast(`Cotización creada exitosamente para ${clientName}.`, 'success');
    
    // Clear
    setQuoteItems([]);
    setSelectedClientId('c-gen');
    setIsElectronic(false);
    setShowCreateModal(false);
  };

  const handleDeleteQuote = (quote: Quote) => {
    setQuoteToDelete(quote);
  };

  const handleConvertQuote = (quote: Quote) => {
    convertQuoteToSale(quote.id);
    setActiveTab('ventas'); // Redirect to checkout tab
  };

  // XML Generator
  const generateXml = (quote: Quote) => {
    const client = clients.find(c => c.name === quote.clientName);
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
   <cbc:CustomizationID>DIAN 2.1</cbc:CustomizationID>
   <cbc:ProfileExecutionID>1</cbc:ProfileExecutionID>
   <cbc:ID>${quote.code}</cbc:ID>
   <cbc:UUID schemeName="CUFE">${quote.cufe || 'NO-CUFE-PROCESSED'}</cbc:UUID>
   <cbc:IssueDate>${new Date(quote.date).toISOString().split('T')[0]}</cbc:IssueDate>
   <cac:AccountingSupplierParty>
      <cac:Party>
         <cac:PartyTaxScheme>
            <cbc:RegistrationName>${companyConfig.socialReason}</cbc:RegistrationName>
            <cbc:CompanyID>${companyConfig.nit}</cbc:CompanyID>
         </cac:PartyTaxScheme>
      </cac:Party>
   </cac:AccountingSupplierParty>
   <cac:AccountingCustomerParty>
      <cac:Party>
         <cac:PartyTaxScheme>
            <cbc:RegistrationName>${quote.clientName}</cbc:RegistrationName>
            <cbc:CompanyID>${client?.phone || '99999999'}</cbc:CompanyID>
         </cac:PartyTaxScheme>
      </cac:Party>
   </cac:AccountingCustomerParty>
   <cac:LegalMonetaryTotal>
      <cbc:LineExtensionAmount currencyID="${companyConfig.currency}">${quote.subtotal}</cbc:LineExtensionAmount>
      <cbc:TaxExclusiveAmount currencyID="${companyConfig.currency}">${quote.tax}</cbc:TaxExclusiveAmount>
      <cbc:PayableAmount currencyID="${companyConfig.currency}">${quote.total}</cbc:PayableAmount>
   </cac:LegalMonetaryTotal>
</Invoice>`;
  };

  const handleDownloadXml = (quote: Quote) => {
    const xmlContent = generateXml(quote);
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIAN-FE-${quote.code}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculations
  const subtotal = quoteItems.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  const taxAmount = subtotal * (companyConfig.taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* DIAN & SUPPORT DOCUMENT RESOLUTIONS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase">Facturación Electrónica DIAN Activa</h4>
            <p className="text-[10px] text-slate-500">{dianConfig.resolution}</p>
            <div className="flex gap-4 mt-1 font-mono text-[10px] text-slate-655 font-bold">
              <span>Prefijo: <strong className="text-indigo-650">{dianConfig.prefix}</strong></span>
              <span>Rango: {dianConfig.startNumber} - {dianConfig.endNumber}</span>
              <span>Consecutivo: #{dianConfig.currentNumber}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase">Documento Soporte DIAN (Proveedores)</h4>
            <p className="text-[10px] text-slate-500">Resolución DIAN No. 187680000300 de 2026</p>
            <div className="flex gap-4 mt-1 font-mono text-[10px] text-slate-655 font-bold">
              <span>Prefijo: <strong className="text-emerald-650">DS</strong></span>
              <span>Rango: 100 - 5000</span>
              <span>Consecutivo: #DS-105</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER CONTROL */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div>
          <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Módulo de Cotizaciones y Facturas Electrónicas</span>
          </h3>
          <p className="text-[11px] text-slate-400">Genere presupuestos estándar o pre-facturas con validación DIAN en tiempo real</p>
        </div>

        <button
          onClick={() => {
            setQuoteItems([]);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-950/20 animate-fade-in"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nueva Cotización</span>
        </button>
      </div>

      {/* LIST OF QUOTES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-3">Código</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Tipo Documento</th>
                <th className="p-3 text-center">Ítems</th>
                <th className="p-3 text-right">Importe Total</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Operaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-mono">
                    No se registran cotizaciones para este rubro. Haz clic en "Crear Nueva Cotización".
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-indigo-650">{q.code}</td>
                    <td className="p-3 text-slate-500">{new Date(q.date).toLocaleDateString()}</td>
                    <td className="p-3 text-slate-800 font-bold">{q.clientName}</td>
                    <td className="p-3">
                      {q.isElectronicInvoice ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Factura Electrónica
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          Cotización Estándar
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono">{q.items.length}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-850">{sym} {q.total.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        q.status === 'converted'
                          ? 'border-emerald-200 text-emerald-750 bg-emerald-50'
                          : 'border-amber-200 text-amber-700 bg-amber-50'
                      }`}>
                        {q.status === 'converted' ? 'Convertido' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-3 text-center flex items-center justify-center gap-2">
                      {q.status === 'pending' && (
                        <button
                          onClick={() => handleConvertQuote(q)}
                          className="px-2.5 py-1 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 shadow"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Vender</span>
                        </button>
                      )}
                      {q.isElectronicInvoice && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(q);
                            setShowInvoiceModal(true);
                          }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 text-indigo-650 hover:bg-indigo-50 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteQuote(q)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Elaborar Nueva Cotización</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden flex-1">
              
              {/* Left Column: Products Selector */}
              <div className="flex flex-col gap-3 overflow-hidden text-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar catálogo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none"
                />

                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 gap-1.5 flex flex-col">
                  {catalogProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center py-2 px-1">
                      <div>
                        <strong className="text-slate-800 block">{p.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">Stock: {p.stock} | SKU: {p.sku}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-700 font-bold">{sym} {p.salePrice.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleAddItemToQuote(p)}
                          className="p-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Quote Details Form */}
              <div className="flex flex-col gap-3 justify-between overflow-hidden text-xs">
                <form onSubmit={handleSaveQuote} className="flex flex-col gap-3 overflow-hidden flex-1 text-slate-700">
                  
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1">CLIENTE DESTINATARIO</label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 cursor-pointer outline-none font-semibold"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 py-1 bg-slate-50 border border-slate-200 rounded-xl px-3 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      id="electronicCheck"
                      checked={isElectronic}
                      onChange={(e) => setIsElectronic(e.target.checked)}
                      className="w-4 h-4 accent-indigo-650 cursor-pointer"
                    />
                    <label htmlFor="electronicCheck" className="text-[11px] text-slate-700 font-bold cursor-pointer">
                      Emitir como Pre-Factura Electrónica (Validación DIAN con CUFE)
                    </label>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                    <span className="text-[10px] text-slate-400 font-bold block border-b border-slate-200 pb-1 mb-1">ÍTEMS EN COTIZACIÓN</span>
                    {quoteItems.length === 0 ? (
                      <div className="text-center text-slate-400 font-mono text-[10px] py-12">
                        No hay productos en esta cotización.
                      </div>
                    ) : (
                      quoteItems.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center text-xs">
                          <span className="truncate max-w-[150px] font-semibold text-slate-850">{item.product.name}</span>
                          
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(item.product.id, parseInt(e.target.value) || 1)}
                              className="w-10 text-center bg-slate-50 border border-slate-200 rounded px-1 text-slate-800 font-mono outline-none"
                            />
                            <span className="font-mono text-slate-600">{sym} {(item.product.salePrice * item.quantity).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Total Presupuestado:</span>
                    <strong className="text-lg font-black font-mono text-indigo-650">{sym} {total.toFixed(2)}</strong>
                  </div>

                  <div className="flex gap-3 justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-650 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={quoteItems.length === 0}
                      className="px-5 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Generar Presupuesto
                    </button>
                  </div>

                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DIAN ELECTRONIC INVOICE MODAL */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileCode className="w-5 h-5 text-indigo-650" />
                <span>Simulador de Factura Electrónica (Representación Gráfica)</span>
              </h3>
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Simulated Invoice Sheet */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 font-medium">
              
              {/* Invoice Header */}
              <div className="text-center flex flex-col gap-1 border-b border-slate-200 pb-3 mb-3">
                <span className="text-sm font-black text-slate-850 uppercase">{companyConfig.name}</span>
                <span className="font-bold">{companyConfig.socialReason}</span>
                <span>NIT: {companyConfig.nit} - Régimen Común</span>
                <span>Dir: {companyConfig.address} - Tel: {companyConfig.phone}</span>
                <span className="mt-1 text-[10px] text-slate-500 font-semibold">{dianConfig.resolution}</span>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-slate-400 text-[9px] uppercase font-bold">Adquiriente / Cliente</div>
                  <div className="text-xs font-bold text-slate-800">{selectedInvoice.clientName}</div>
                  <div>Dir: {clients.find(c => c.name === selectedInvoice.clientName)?.address || '-'}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[9px] uppercase font-bold">Factura Electrónica de Venta</div>
                  <div className="text-xs font-black text-indigo-650">{selectedInvoice.code}</div>
                  <div>Fecha Emisión: {new Date(selectedInvoice.date).toLocaleString()}</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-[10px] text-left mb-3">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-1">Concepto</th>
                    <th className="py-1 text-center">Cant</th>
                    <th className="py-1 text-right">Precio U.</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map(item => (
                    <tr key={item.product.id} className="border-b border-slate-100">
                      <td className="py-1.5 font-semibold text-slate-800">{item.product.name}</td>
                      <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                      <td className="py-1.5 text-right font-mono">{sym} {item.product.salePrice.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono">{sym} {(item.product.salePrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex flex-col gap-1.5 items-end border-t border-slate-200 pt-3 mb-3 font-semibold">
                <div className="flex justify-between w-40 text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">{sym} {selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-slate-500">
                  <span>IVA ({companyConfig.taxRate}%):</span>
                  <span className="font-mono">{sym} {selectedInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-40 text-slate-850 font-black border-t border-dashed border-slate-200 pt-1">
                  <span>Total Neto:</span>
                  <span className="font-mono text-indigo-650">{sym} {selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* CUFE & QR Block */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-center justify-between mt-4">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Código Único de Factura Electrónica (CUFE)</span>
                  <code className="text-[9px] font-mono break-all bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-600 block">
                    {selectedInvoice.cufe || 'CUFE-NOT-FOUND'}
                  </code>
                </div>
                <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 flex flex-col gap-0.5 items-center justify-center text-[7px] text-slate-400 flex-shrink-0">
                  <div className="w-12 h-12 bg-slate-800 flex flex-wrap p-1 gap-[2px]">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`w-3.5 h-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-800'}`} />
                    ))}
                  </div>
                  <span>QR DIAN Val</span>
                </div>
              </div>

            </div>

            {/* Operations Footer */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleDownloadXml(selectedInvoice)}
                className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-indigo-650 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Bajar XML</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir POS</span>
              </button>
              <button
                onClick={() => {
                  const phone = clients.find(c => c.name === selectedInvoice.clientName)?.phone || '';
                  if (phone) {
                    const msg = encodeURIComponent(`Hola, adjunto la factura electrónica ${selectedInvoice.code} por un total de ${sym} ${selectedInvoice.total.toFixed(2)}.`);
                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                  } else {
                    showToast('El cliente no tiene un teléfono registrado.', 'error');
                  }
                }}
                className="py-2 px-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE QUOTE MODAL */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-md font-bold text-rose-450 flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Confirmar Eliminación</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              ¿Está seguro de que desea eliminar la cotización <strong className="text-white font-bold">"{quoteToDelete.code}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => setQuoteToDelete(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteQuote(quoteToDelete.id);
                  showToast(`Cotización ${quoteToDelete.code} eliminada exitosamente.`, 'success');
                  setQuoteToDelete(null);
                }}
                className="px-5 py-2 bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20 transition-all"
              >
                Eliminar Cotización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="font-bold text-sm">{toast.message}</div>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

    </div>
  );
}
