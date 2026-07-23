'use client';
import React, { useState, useRef } from 'react';
import { usePOSStore } from '../store/store';
import {
  DollarSign, ArrowUpRight, ArrowDownRight, Lock, Unlock,
  Calculator, FileText, CheckCircle2, Printer, X, ChevronRight,
  TrendingUp, Package, BarChart3, AlertTriangle, Receipt,
  CreditCard, Smartphone, ShoppingBag, Eye
} from 'lucide-react';

/* ─────────────────────────────────────────────
   TICKET PRINT TEMPLATE  (80mm / A4)
────────────────────────────────────────────── */
function TicketPrintView({ sale, config, onClose }: { sale: any; config: any; onClose: () => void }) {
  const is80mm = config.printFormat !== 'A4';
  const sym = config.currencySymbol || 'Bs.';

  const printContent = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Ticket ${sale.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: ${is80mm ? '11px' : '12px'}; 
               width: ${is80mm ? '80mm' : '210mm'}; padding: ${is80mm ? '4mm' : '15mm'}; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; padding: 1px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: ${is80mm ? '14px' : '16px'}; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; }
        h1 { font-size: ${is80mm ? '14px' : '18px'}; }
        @media print { @page { margin: 0; size: ${is80mm ? '80mm auto' : 'A4'}; } body { width: 100%; } }
      </style></head><body>
      ${config.ticketShowLogo && config.logoBase64 ? `<div class="center"><img src="${config.logoBase64}" style="max-height:50px;max-width:100%;margin-bottom:4px"></div>` : ''}
      ${config.ticketShowBusinessData ? `
        <div class="center bold">${config.companyName || 'Mi Negocio'}</div>
        ${config.tagLine ? `<div class="center" style="font-size:9px">${config.tagLine}</div>` : ''}
        ${config.address ? `<div class="center" style="font-size:9px">${config.address}</div>` : ''}
        ${config.phone ? `<div class="center" style="font-size:9px">Tel: ${config.phone}</div>` : ''}
        ${config.taxId ? `<div class="center" style="font-size:9px">${config.taxIdType || 'NIT'}: ${config.taxId}</div>` : ''}
      ` : ''}
      <div class="line"></div>
      <div class="center bold" style="font-size:9px">COMPROBANTE DE VENTA</div>
      <div class="row"><span>Ticket N°:</span><span class="bold">${sale.id?.slice(-8) || '---'}</span></div>
      <div class="row"><span>Fecha:</span><span>${new Date(sale.timestamp || Date.now()).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
      <div class="row"><span>Cajero:</span><span>${sale.user || 'Sistema'}</span></div>
      ${sale.cashier ? `<div class="row"><span>Cajero:</span><span>${sale.cashier}</span></div>` : ''}
      <div class="row"><span>Cliente:</span><span>${sale.invoiceName || 'S/N'}</span></div>
      <div class="row"><span>NIT/CI:</span><span>${sale.invoiceNit || '0'}</span></div>
      <div class="line"></div>
      <div class="row bold"><span>DESCRIPCIÓN</span><span>TOTAL</span></div>
      <div class="line"></div>
      ${(sale.items || []).map((item: any) => `
        <div style="padding:1px 0">
          <div class="bold" style="font-size:10px">${item.product?.name || item.name}</div>
          <div class="row" style="font-size:10px;color:#555">
            <span>${item.quantity || item.weight?.toFixed(3) + 'kg'} x ${sym} ${(item.product?.salePrice || item.salePrice || 0).toFixed(2)}</span>
            <span>${sym} ${((item.quantity || item.weight || 1) * (item.product?.salePrice || item.salePrice || 0) * (1 - (item.discountPercentage || 0) / 100)).toFixed(2)}</span>
          </div>
          ${item.discountPercentage > 0 ? `<div style="font-size:9px;color:#666;text-align:right">(-${item.discountPercentage}% desc.)</div>` : ''}
        </div>
      `).join('')}
      <div class="line"></div>
      ${sale.discount > 0 ? `<div class="row"><span>Descuento Global:</span><span>-${sym} ${sale.discount?.toFixed(2)}</span></div>` : ''}
      ${config.taxEnabled && sale.tax > 0 ? `<div class="row"><span>Impuesto (${config.taxRate}%):</span><span>${sym} ${sale.tax?.toFixed(2)}</span></div>` : ''}
      <div class="total-row"><span>TOTAL:</span><span>${sym} ${sale.total?.toFixed(2)}</span></div>
      ${sale.cashReceived > 0 ? `
        <div class="row" style="margin-top:4px"><span>Efectivo:</span><span>${sym} ${sale.cashReceived?.toFixed(2)}</span></div>
        <div class="row"><span>Cambio:</span><span class="bold">${sym} ${(sale.cashReceived - sale.total)?.toFixed(2)}</span></div>
      ` : ''}
      <div class="row"><span>Forma de Pago:</span><span>${sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'card' ? 'Tarjeta' : sale.paymentMethod === 'transfer' ? 'QR/Transf.' : sale.paymentMethod === 'datafono' ? 'Datáfono' : 'Crédito'}</span></div>
      <div class="line"></div>
      ${config.ticketCustomText ? `<div class="center" style="font-size:10px;margin-top:4px">${config.ticketCustomText}</div>` : ''}
      <div class="center" style="font-size:9px;margin-top:6px">¡Gracias por su compra!</div>
      <div class="center" style="font-size:8px;color:#aaa;margin-top:2px">Sistema POS v2.0</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const sym2 = config.currencySymbol || 'Bs.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b27] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Receipt size={18} className="text-emerald-400" />
            Vista Previa del Ticket
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        {/* Ticket Preview */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="bg-white rounded-xl p-4 font-mono text-xs text-slate-800 shadow-inner">
            {config.ticketShowBusinessData && (
              <div className="text-center mb-3">
                {config.logoBase64 && config.ticketShowLogo && (
                  <img src={config.logoBase64} alt="Logo" className="h-10 mx-auto mb-1 object-contain" />
                )}
                <p className="font-bold text-sm">{config.companyName || 'Mi Negocio'}</p>
                {config.tagLine && <p className="text-[10px] text-slate-500">{config.tagLine}</p>}
                {config.address && <p className="text-[10px] text-slate-500">{config.address}</p>}
                {config.phone && <p className="text-[10px] text-slate-500">Tel: {config.phone}</p>}
                {config.taxId && <p className="text-[10px] text-slate-500">{config.taxIdType}: {config.taxId}</p>}
              </div>
            )}
            <div className="border-t border-dashed border-slate-300 my-2" />
            <div className="text-center font-bold text-[10px] mb-2">COMPROBANTE DE VENTA</div>
            <div className="flex justify-between text-[10px] text-slate-500"><span>Ticket N°:</span><span className="font-bold">{sale.id?.slice(-8)}</span></div>
            <div className="flex justify-between text-[10px] text-slate-500"><span>Fecha:</span><span>{new Date(sale.timestamp || Date.now()).toLocaleDateString('es-BO')}</span></div>
            <div className="flex justify-between text-[10px] text-slate-500"><span>Cliente:</span><span>{sale.invoiceName || 'S/N'}</span></div>
            <div className="flex justify-between text-[10px] text-slate-500"><span>NIT/CI:</span><span>{sale.invoiceNit || '0'}</span></div>
            <div className="border-t border-dashed border-slate-300 my-2" />
            {(sale.items || []).map((item: any, i: number) => (
              <div key={i} className="mb-1">
                <p className="font-semibold text-[11px]">{item.product?.name || item.name}</p>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{item.quantity} x {sym2} {(item.product?.salePrice || 0).toFixed(2)}</span>
                  <span>{sym2} {((item.quantity || 1) * (item.product?.salePrice || 0)).toFixed(2)}</span>
                </div>
              </div>
            ))}
            <div className="border-t-2 border-slate-800 mt-2 pt-2 flex justify-between font-bold">
              <span>TOTAL:</span><span>{sym2} {sale.total?.toFixed(2)}</span>
            </div>
            {config.ticketCustomText && (
              <p className="text-center text-[10px] text-slate-500 mt-3 border-t border-dashed border-slate-300 pt-2">
                {config.ticketCustomText}
              </p>
            )}
            <p className="text-center text-[10px] text-slate-400 mt-2">¡Gracias por su compra!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 py-2.5 text-white/50 hover:text-white text-sm transition-colors">Cancelar</button>
          <button
            onClick={printContent}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   REPORTE CIERRE X / Z
────────────────────────────────────────────── */
function CierreReport({ sales, cashMovements, cashSession, config, registerId, onClose }: any) {
  const sym = config.currencySymbol || 'Bs.';
  const regSales = sales.filter((s: any) => s.registerId === registerId);
  const regMoves = cashMovements.filter((m: any) => m.registerId === registerId);

  const totalSales = regSales.reduce((a: number, s: any) => a + s.total, 0);
  const totalItems = regSales.reduce((a: number, s: any) => a + (s.items?.length || 0), 0);

  const byMethod = {
    cash: regSales.filter((s: any) => s.paymentMethod === 'cash').reduce((a: number, s: any) => a + s.total, 0),
    card: regSales.filter((s: any) => s.paymentMethod === 'card').reduce((a: number, s: any) => a + s.total, 0),
    transfer: regSales.filter((s: any) => s.paymentMethod === 'transfer').reduce((a: number, s: any) => a + s.total, 0),
    credit: regSales.filter((s: any) => s.paymentMethod === 'credit').reduce((a: number, s: any) => a + s.total, 0),
    datafono: regSales.filter((s: any) => s.paymentMethod === 'datafono').reduce((a: number, s: any) => a + s.total, 0),
  };

  const cashIns = regMoves.filter((m: any) => m.type === 'in' && m.concept !== 'Apertura de Caja').reduce((a: number, m: any) => a + m.amount, 0);
  const cashOuts = regMoves.filter((m: any) => m.type === 'out').reduce((a: number, m: any) => a + m.amount, 0);
  const openFloat = cashSession?.openingCash || 0;
  const expectedCash = openFloat + byMethod.cash + cashIns - cashOuts;
  const counted = cashSession?.closingCash || 0;
  const diff = counted - expectedCash;

  const printReport = () => {
    const win = window.open('', '_blank', 'width=500,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cierre de Caja</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;font-size:11px;padding:10mm;width:80mm}
    .c{text-align:center}.b{font-weight:bold}.r{text-align:right}.row{display:flex;justify-content:space-between;padding:2px 0}
    .line{border-top:1px dashed #000;margin:5px 0}.big{font-size:14px}.red{color:red}.green{color:green}
    @media print{@page{margin:0;size:80mm auto}body{width:100%}}</style></head><body>
    <div class="c b" style="font-size:14px">${config.companyName || 'Mi Negocio'}</div>
    <div class="c">REPORTE DE CIERRE DE CAJA</div>
    <div class="c">${registerId.toUpperCase()}</div>
    <div class="line"></div>
    <div class="row"><span>Fecha:</span><span>${new Date().toLocaleString('es-BO')}</span></div>
    <div class="row"><span>Turno abierto:</span><span>${cashSession?.openingDate ? new Date(cashSession.openingDate).toLocaleString('es-BO') : '—'}</span></div>
    <div class="row"><span>Turno cerrado:</span><span>${cashSession?.closingDate ? new Date(cashSession.closingDate).toLocaleString('es-BO') : 'Abierto'}</span></div>
    <div class="row"><span>Cajero:</span><span>${cashSession?.user || '—'}</span></div>
    <div class="line"></div>
    <div class="b">RESUMEN DE VENTAS</div>
    <div class="row"><span>Total transacciones:</span><span class="b">${regSales.length}</span></div>
    <div class="row"><span>Total ítems vendidos:</span><span>${totalItems}</span></div>
    <div class="row"><span>TOTAL VENTAS:</span><span class="b">${sym} ${totalSales.toFixed(2)}</span></div>
    <div class="line"></div>
    <div class="b">POR MÉTODO DE PAGO</div>
    <div class="row"><span>💵 Efectivo:</span><span>${sym} ${byMethod.cash.toFixed(2)}</span></div>
    <div class="row"><span>💳 Tarjeta:</span><span>${sym} ${byMethod.card.toFixed(2)}</span></div>
    <div class="row"><span>📲 QR / Transf.:</span><span>${sym} ${byMethod.transfer.toFixed(2)}</span></div>
    <div class="row"><span>📊 Crédito:</span><span>${sym} ${byMethod.credit.toFixed(2)}</span></div>
    <div class="line"></div>
    <div class="b">MOVIMIENTOS DE CAJA</div>
    <div class="row"><span>Fondo apertura:</span><span>${sym} ${openFloat.toFixed(2)}</span></div>
    <div class="row"><span>Entradas aux.:</span><span>${sym} ${cashIns.toFixed(2)}</span></div>
    <div class="row"><span>Salidas aux.:</span><span>-${sym} ${cashOuts.toFixed(2)}</span></div>
    <div class="line"></div>
    <div class="row b"><span>Efectivo esperado:</span><span>${sym} ${expectedCash.toFixed(2)}</span></div>
    <div class="row b"><span>Efectivo contado:</span><span>${sym} ${counted.toFixed(2)}</span></div>
    <div class="row b ${diff < 0 ? 'red' : 'green'}"><span>DIFERENCIA:</span><span>${diff >= 0 ? '+' : ''}${sym} ${diff.toFixed(2)}</span></div>
    <div class="line"></div>
    <div class="c" style="font-size:9px;margin-top:5px">Sistema POS v2.0 — © 2026</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#151b27] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#151b27]">
          <h3 className="text-white font-bold flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" />
            Reporte de Cierre de Caja — {registerId.toUpperCase()}
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <p className="text-emerald-300/60 text-xs">Total Ventas</p>
              <p className="text-2xl font-black text-emerald-400">{sym} {totalSales.toFixed(2)}</p>
              <p className="text-emerald-300/50 text-xs mt-1">{regSales.length} transacciones</p>
            </div>
            <div className={`rounded-2xl p-4 border ${diff < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              <p className={`text-xs ${diff < 0 ? 'text-red-300/60' : 'text-blue-300/60'}`}>Diferencia Arqueo</p>
              <p className={`text-2xl font-black ${diff < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {diff >= 0 ? '+' : ''}{sym} {diff.toFixed(2)}
              </p>
              <p className={`text-xs mt-1 ${diff < 0 ? 'text-red-300/50' : 'text-blue-300/50'}`}>
                {diff < 0 ? 'Faltante en caja' : diff === 0 ? 'Sin diferencia' : 'Sobrante en caja'}
              </p>
            </div>
          </div>

          {/* Por método de pago */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Ventas por Método de Pago</p>
            {[
              { label: '💵 Efectivo', value: byMethod.cash, icon: DollarSign, color: 'text-emerald-400' },
              { label: '💳 Tarjeta Débito/Crédito', value: byMethod.card, icon: CreditCard, color: 'text-blue-400' },
              { label: '📲 QR / Transferencia', value: byMethod.transfer, icon: Smartphone, color: 'text-purple-400' },
              { label: '📊 Crédito / Cartera', value: byMethod.credit, icon: ShoppingBag, color: 'text-amber-400' },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <span className="text-white/60 text-sm">{m.label}</span>
                <span className={`font-mono font-bold text-sm ${m.color}`}>{sym} {m.value.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Movimientos de caja */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Movimientos de Efectivo</p>
            {[
              { label: 'Fondo de Apertura', value: openFloat, positive: true },
              { label: 'Ventas en Efectivo', value: byMethod.cash, positive: true },
              { label: 'Entradas Auxiliares', value: cashIns, positive: true },
              { label: 'Salidas Auxiliares', value: cashOuts, positive: false },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 text-sm">
                <span className="text-white/60">{m.positive ? '(+)' : '(-)'} {m.label}</span>
                <span className={`font-mono font-bold ${m.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.positive ? '' : '-'}{sym} {m.value.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-2">
              <span className="text-white font-bold text-sm">Efectivo Esperado en Cajón:</span>
              <span className="font-mono font-black text-white text-lg">{sym} {expectedCash.toFixed(2)}</span>
            </div>
            {counted > 0 && (
              <>
                <div className="flex justify-between items-center pt-2 text-sm">
                  <span className="text-white/60">Efectivo Contado (Arqueo):</span>
                  <span className="font-mono font-bold text-white">{sym} {counted.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between items-center pt-2 border-t border-white/10 mt-2 ${diff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  <span className="font-bold text-sm">{diff < 0 ? '⚠️ Faltante:' : '✓ Sobrante:'}</span>
                  <span className="font-mono font-black text-lg">{diff >= 0 ? '+' : ''}{sym} {diff.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Movimientos detallados */}
          {regMoves.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Detalle de Movimientos ({regMoves.length})</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {regMoves.map((m: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                    <span className="text-white/60 truncate flex-1 mr-2">{m.concept}</span>
                    <span className={`font-mono font-bold flex-shrink-0 ${m.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.type === 'in' ? '+' : '-'}{sym} {m.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-white/10 sticky bottom-0 bg-[#151b27]">
          <button onClick={onClose} className="flex-1 py-2.5 text-white/50 hover:text-white text-sm transition-colors">Cerrar</button>
          <button
            onClick={printReport}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
          >
            <Printer size={15} /> Imprimir Reporte Z
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
export default function CajaModule() {
  const {
    cashSession, cashMovements, sales,
    openCaja, closeCaja, addCashMovement,
    activeRegisterId, setActiveRegister,
    clients, clientCredits, payClientCredit,
    appConfig, activeSession,
  } = usePOSStore(s => ({
    cashSession: s.cashSession,
    cashMovements: s.cashMovements,
    sales: s.sales,
    openCaja: s.openCaja,
    closeCaja: s.closeCaja,
    addCashMovement: s.addCashMovement,
    activeRegisterId: s.activeRegisterId,
    setActiveRegister: s.setActiveRegister,
    clients: s.clients,
    clientCredits: s.clientCredits,
    payClientCredit: s.payClientCredit,
    appConfig: s.appConfig,
    activeSession: s.activeSession,
  }));

  const sym = appConfig.currencySymbol || 'Bs.';

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Inputs
  const [openingFloat, setOpeningFloat] = useState('500');
  const [closingCashInput, setClosingCashInput] = useState('');

  // Movimiento
  const [moveAmount, setMoveAmount] = useState('');
  const [moveConcept, setMoveConcept] = useState('');
  const [moveType, setMoveType] = useState<'in' | 'out'>('out');
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Reporte cierre
  const [showCierreReport, setShowCierreReport] = useState(false);

  // Ticket preview
  const [ticketSale, setTicketSale] = useState<any | null>(null);

  // Client credits
  const [selectedCreditClient, setSelectedCreditClient] = useState('');
  const [creditAbonoAmount, setCreditAbonoAmount] = useState('');

  // Arqueo
  const [cashDenominations, setCashDenominations] = useState({
    d200: 0, d100: 0, d50: 0, d20: 0, d10: 0,
    d5: 0, d2: 0, d1: 0, c50: 0, c20: 0, c10: 0,
  });

  const isSessionOpen = cashSession?.status === 'open' && cashSession?.registerId === activeRegisterId;

  // Calculations
  const regSales = sales.filter(s => s.registerId === activeRegisterId);
  const totalCashSales = regSales.filter(s => s.paymentMethod === 'cash').reduce((a, s) => a + s.total, 0);
  const totalCardSales = regSales.filter(s => s.paymentMethod === 'card').reduce((a, s) => a + s.total, 0);
  const totalTransferSales = regSales.filter(s => s.paymentMethod === 'transfer').reduce((a, s) => a + s.total, 0);
  const totalCreditSales = regSales.filter(s => s.paymentMethod === 'credit').reduce((a, s) => a + s.total, 0);
  const totalDatafonoSales = regSales.filter(s => s.paymentMethod === 'datafono').reduce((a, s) => a + s.total, 0);
  const totalAllSales = regSales.reduce((a, s) => a + s.total, 0);

  const regMoves = cashMovements.filter(m => m.registerId === activeRegisterId);
  const cashIns = regMoves.filter(m => m.type === 'in' && m.concept !== 'Apertura de Caja').reduce((a, m) => a + m.amount, 0);
  const cashOuts = regMoves.filter(m => m.type === 'out').reduce((a, m) => a + m.amount, 0);
  const openFloat = cashSession?.registerId === activeRegisterId ? (cashSession.openingCash || 0) : 0;
  const expectedCash = openFloat + totalCashSales + cashIns - cashOuts;

  const arqueoTotal = () => (
    cashDenominations.d200 * 200 + cashDenominations.d100 * 100 +
    cashDenominations.d50 * 50 + cashDenominations.d20 * 20 +
    cashDenominations.d10 * 10 + cashDenominations.d5 * 5 +
    cashDenominations.d2 * 2 + cashDenominations.d1 * 1 +
    cashDenominations.c50 * 0.5 + cashDenominations.c20 * 0.2 +
    cashDenominations.c10 * 0.1
  );
  const arqueoSum = arqueoTotal();

  const handleOpenCaja = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(openingFloat);
    if (isNaN(val) || val < 0) return;
    openCaja(val, activeSession?.fullName || 'Admin');
    showToast('✓ Caja abierta correctamente.', 'success');
  };

  const handleCloseCaja = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(closingCashInput);
    if (isNaN(val) || val < 0) { showToast('Ingrese un monto de arqueo válido.', 'error'); return; }
    closeCaja(val);
    setClosingCashInput('');
    showToast('✓ Turno cerrado correctamente.', 'success');
  };

  const handleAddMove = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(moveAmount);
    if (isNaN(amount) || amount <= 0 || !moveConcept) return;
    addCashMovement(moveType, amount, moveConcept);
    setMoveAmount('');
    setMoveConcept('');
    setShowMoveModal(false);
    showToast(`✓ Movimiento de ${moveType === 'in' ? 'entrada' : 'salida'} registrado.`, 'success');
  };

  const handleCreditAbono = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(creditAbonoAmount);
    if (!selectedCreditClient || isNaN(amount) || amount <= 0) return;
    const debt = clientCredits[selectedCreditClient] || 0;
    if (amount > debt) { showToast('El abono no puede superar la deuda actual.', 'error'); return; }
    payClientCredit(selectedCreditClient, amount);
    setSelectedCreditClient('');
    setCreditAbonoAmount('');
    showToast('✓ Abono registrado en cartera.', 'success');
  };

  // Concepts presets
  const MOVE_CONCEPTS_OUT = ['Pago a proveedor', 'Gastos de limpieza', 'Gastos de operación', 'Pago de servicios', 'Retiro propietario', 'Préstamo interno'];
  const MOVE_CONCEPTS_IN = ['Préstamo del dueño', 'Depósito inicial extra', 'Ingreso extraordinario', 'Reposición de caja'];

  return (
    <div className="w-full flex flex-col gap-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            {appConfig.cashierName || 'Caja Registradora'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de turnos, arqueo y movimientos de efectivo</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de caja */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['caja-1', 'caja-2'].map((reg, i) => (
              <button key={reg} onClick={() => setActiveRegister(reg)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeRegisterId === reg ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                Caja {i + 1} {i === 0 ? '(Principal)' : '(Auxiliar)'}
              </button>
            ))}
          </div>

          {/* Reporte Cierre */}
          <button onClick={() => setShowCierreReport(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition-all">
            <BarChart3 size={14} />
            Reporte Z
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── COL 1: CONTROL DE TURNO ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-5">
          <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-indigo-600" />
            Control de Turno — {activeRegisterId.toUpperCase()}
          </h3>

          {!isSessionOpen ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
                🚨 La <strong>{activeRegisterId.toUpperCase()}</strong> está <strong>CERRADA</strong>. Abre el turno para facturar.
              </div>
              <form onSubmit={handleOpenCaja} className="flex flex-col gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Fondo de Apertura ({sym})</label>
                  <input type="number" value={openingFloat} onChange={e => setOpeningFloat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono text-center text-lg outline-none focus:border-emerald-400 transition-all"
                    placeholder="0.00" min="0" step="0.01" />
                </div>
                <button type="submit"
                  className="w-full py-3 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all">
                  <Unlock className="w-4 h-4" /> Abrir Turno de Caja
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>CAJA ABIERTA · <strong>{cashSession?.user}</strong></span>
              </div>

              <form onSubmit={handleCloseCaja} className="flex flex-col gap-3">
                <div>
                  <label className="block text-slate-500 mb-1 font-semibold">Monto Físico en Cajón ({sym})</label>
                  <div className="flex gap-2">
                    <input type="number" step="0.01" value={closingCashInput}
                      onChange={e => setClosingCashInput(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-mono text-center outline-none focus:border-red-400" />
                    {arqueoSum > 0 && (
                      <button type="button" onClick={() => setClosingCashInput(arqueoSum.toFixed(2))}
                        className="px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition-all">
                        Del arqueo<br />{sym} {arqueoSum.toFixed(1)}
                      </button>
                    )}
                  </div>
                </div>

                {closingCashInput && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-slate-400">Esperado</span>
                      <span className="font-mono font-bold text-slate-800">{sym} {expectedCash.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-400">Diferencia</span>
                      <span className={`font-mono font-bold ${(parseFloat(closingCashInput) - expectedCash) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {(parseFloat(closingCashInput) - expectedCash) >= 0 ? '+' : ''}{sym} {(parseFloat(closingCashInput) - expectedCash).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 transition-all">
                  <Lock className="w-4 h-4" /> Realizar Corte / Cierre de Caja
                </button>

                <button type="button" onClick={() => setShowCierreReport(true)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all">
                  <Eye size={14} /> Ver Reporte X (Sin Cerrar)
                </button>
              </form>
            </div>
          )}

          {/* Ultimo cierre info */}
          {cashSession?.status === 'closed' && cashSession.registerId === activeRegisterId && cashSession.closingCash !== undefined && (
            <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold space-y-1.5">
              <h4 className="font-bold text-slate-700 uppercase text-[10px] border-b border-slate-200 pb-1 mb-2">Último Corte:</h4>
              <div className="flex justify-between"><span className="text-slate-500">Arqueo:</span><span className="font-mono">{sym} {cashSession.closingCash?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Esperado:</span><span className="font-mono">{sym} {cashSession.calculatedCash?.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-1">
                <span className="text-slate-500">Diferencia:</span>
                <span className={`font-mono font-bold ${(cashSession.difference || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {sym} {cashSession.difference?.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── COL 2: FONDOS Y MOVIMIENTOS ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-500" />
              Fondos y Ventas — {activeRegisterId.toUpperCase()}
            </h3>
            {isSessionOpen && (
              <button onClick={() => setShowMoveModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all">
                + Movimiento
              </button>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Total Ventas', value: totalAllSales, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200' },
              { label: 'Efectivo', value: totalCashSales, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              { label: 'Tarjeta', value: totalCardSales, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'QR / Transf.', value: totalTransferSales, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3`}>
                <p className="text-slate-400 text-[10px] font-medium">{s.label}</p>
                <p className={`font-mono font-black text-base ${s.color}`}>{sym} {s.value.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Fondos */}
          <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-1.5"><span>(+) Fondo Apertura</span><span className="font-mono">{sym} {openFloat.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-500"><span>(+) Entradas Auxiliares</span><span className="font-mono text-emerald-600">{sym} {cashIns.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-500"><span>(-) Salidas Auxiliares</span><span className="font-mono text-red-600">-{sym} {cashOuts.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-dashed border-slate-300 pt-2 text-sm">
              <span>Efectivo Esperado</span><span className="font-mono text-indigo-700">{sym} {expectedCash.toFixed(2)}</span>
            </div>
          </div>

          {/* Historial movimientos */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Historial de Movimientos</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {regMoves.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-3">Sin movimientos registrados.</p>
              ) : (
                regMoves.slice(-15).reverse().map((m, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      {m.type === 'in' ? <ArrowUpRight size={13} className="text-emerald-500 flex-shrink-0" /> : <ArrowDownRight size={13} className="text-red-500 flex-shrink-0" />}
                      <span className="text-slate-600 truncate max-w-[140px]">{m.concept}</span>
                    </div>
                    <span className={`font-mono font-bold ${m.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.type === 'in' ? '+' : '-'}{sym} {m.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ventas recientes */}
          {regSales.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Últimas Ventas del Turno</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {regSales.slice(-8).reverse().map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono text-[10px]">#{s.id?.slice(-4)}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.paymentMethod === 'cash' ? 'bg-emerald-400' : s.paymentMethod === 'card' ? 'bg-blue-400' : s.paymentMethod === 'datafono' ? 'bg-indigo-500' : 'bg-purple-400'}`} />
                      <span className="text-slate-600 truncate max-w-[100px]">{s.cashier || 'Consumidor final'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800">{sym} {s.total?.toFixed(2)}</span>
                      <button onClick={() => setTicketSale(s)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" title="Ver/reimprimir ticket">
                        <Receipt size={11} className="text-slate-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── COL 3: ARQUEADOR ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Arqueador de Efectivo
            </h3>
            <button onClick={() => setCashDenominations({ d200: 0, d100: 0, d50: 0, d20: 0, d10: 0, d5: 0, d2: 0, d1: 0, c50: 0, c20: 0, c10: 0 })}
              className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-all">
              Limpiar
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-bold uppercase pb-1 border-b border-slate-100">
              <span>Denominación</span><span className="text-center">Cantidad</span><span className="text-right">Total</span>
            </div>
            {[
              { key: 'd200', label: `Bs. 200`, mult: 200 },
              { key: 'd100', label: `Bs. 100`, mult: 100 },
              { key: 'd50', label: `Bs. 50`, mult: 50 },
              { key: 'd20', label: `Bs. 20`, mult: 20 },
              { key: 'd10', label: `Bs. 10`, mult: 10 },
              { key: 'd5', label: `Bs. 5`, mult: 5 },
              { key: 'd2', label: `Bs. 2`, mult: 2 },
              { key: 'd1', label: `Bs. 1`, mult: 1 },
              { key: 'c50', label: `Bs. 0.50`, mult: 0.5 },
              { key: 'c20', label: `Bs. 0.20`, mult: 0.2 },
              { key: 'c10', label: `Bs. 0.10`, mult: 0.1 },
            ].map(row => (
              <div key={row.key} className="grid grid-cols-3 gap-2 items-center py-0.5">
                <span className="text-slate-600 font-medium text-[11px]">{row.label}</span>
                <input type="number" min={0}
                  value={(cashDenominations as any)[row.key]}
                  onChange={e => setCashDenominations(p => ({ ...p, [row.key]: e.target.value === '' ? ('' as any) : (parseInt(e.target.value) || 0) }))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-slate-800 font-mono text-xs outline-none focus:border-indigo-400 transition-all w-full"
                />
                <span className="text-right font-mono text-slate-700 text-[11px]">
                  {sym} {(((cashDenominations as any)[row.key] || 0) * row.mult).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
            <span className="text-slate-500 font-bold text-xs uppercase">Total Arqueado:</span>
            <strong className="text-2xl font-black font-mono text-emerald-600">{sym} {arqueoSum.toFixed(2)}</strong>
          </div>

          {isSessionOpen && arqueoSum > 0 && (
            <button onClick={() => setClosingCashInput(arqueoSum.toFixed(2))}
              className="w-full mt-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all">
              Usar este monto para el cierre
            </button>
          )}
        </div>
      </div>

      {/* ── CRÉDITOS Y CARTERA ── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Créditos y Cartera de Clientes
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Registra abonos a cuentas con saldo pendiente</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Contacto</th>
                  <th className="py-2 text-right">Saldo Pendiente</th>
                  <th className="py-2 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map(client => {
                  const debt = clientCredits[client.id] || 0;
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800">{client.name}</td>
                      <td className="py-3 text-slate-500">
                        <div>{client.phone}</div>
                        <div className="text-[10px]">{client.email}</div>
                      </td>
                      <td className="py-3 text-right font-mono font-bold">
                        {debt > 0 ? (
                          <span className="text-rose-600">{sym} {debt.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-300">Sin saldo</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {debt > 0 ? (
                          <button onClick={() => { setSelectedCreditClient(client.id); setCreditAbonoAmount(debt.toFixed(2)); }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition-colors text-[11px]">
                            Abonar
                          </button>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleCreditAbono} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Registrar Abono</h4>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Cliente</label>
              <select value={selectedCreditClient}
                onChange={e => { setSelectedCreditClient(e.target.value); const d = clientCredits[e.target.value] || 0; setCreditAbonoAmount(d > 0 ? d.toFixed(2) : ''); }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer text-xs">
                <option value="">-- Seleccionar --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Deuda: {sym} {(clientCredits[c.id] || 0).toFixed(2)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1 font-semibold">Monto del Abono ({sym})</label>
              <input type="number" step="0.01" min="0.01" value={creditAbonoAmount}
                onChange={e => setCreditAbonoAmount(e.target.value)} placeholder="0.00"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono outline-none text-xs" />
            </div>
            <button type="submit" disabled={!selectedCreditClient || !creditAbonoAmount}
              className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition-all ${selectedCreditClient && creditAbonoAmount ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
              <CheckCircle2 className="w-4 h-4" /> Aplicar Abono
            </button>
          </form>
        </div>
      </div>

      {/* ── MODAL: MOVIMIENTO ENTRADA/SALIDA ── */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151b27] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                {moveType === 'in' ? <ArrowUpRight size={18} className="text-emerald-400" /> : <ArrowDownRight size={18} className="text-red-400" />}
                {moveType === 'in' ? 'Entrada de Efectivo' : 'Salida de Efectivo'}
              </h3>
              <button onClick={() => setShowMoveModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddMove} className="space-y-4">
              {/* Tipo */}
              <div className="flex gap-2">
                {(['out', 'in'] as const).map(t => (
                  <button type="button" key={t} onClick={() => setMoveType(t)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${moveType === t ? (t === 'in' ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300' : 'bg-red-500/15 border-red-400/50 text-red-300') : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>
                    {t === 'in' ? '⬆ Entrada / Depósito' : '⬇ Salida / Retiro'}
                  </button>
                ))}
              </div>

              {/* Concepto presets */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Concepto</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(moveType === 'out' ? MOVE_CONCEPTS_OUT : MOVE_CONCEPTS_IN).map(c => (
                    <button type="button" key={c} onClick={() => setMoveConcept(c)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${moveConcept === c ? 'bg-white/15 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <input value={moveConcept} onChange={e => setMoveConcept(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 text-sm"
                  placeholder="O escribe el concepto..." />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Monto ({sym})</label>
                <input type="number" step="0.01" min="0.01" value={moveAmount} onChange={e => setMoveAmount(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg font-mono placeholder-white/30 focus:outline-none focus:border-emerald-400"
                  placeholder="0.00" />
              </div>

              <button type="submit"
                className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-sm transition-all shadow-lg ${moveType === 'in' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/20'}`}>
                {moveType === 'in' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                Registrar {moveType === 'in' ? 'Entrada' : 'Salida'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REPORTE CIERRE ── */}
      {showCierreReport && (
        <CierreReport
          sales={sales}
          cashMovements={cashMovements}
          cashSession={cashSession}
          config={appConfig}
          registerId={activeRegisterId}
          onClose={() => setShowCierreReport(false)}
        />
      )}

      {/* ── MODAL: TICKET PREVIEW ── */}
      {ticketSale && (
        <TicketPrintView
          sale={ticketSale}
          config={appConfig}
          onClose={() => setTicketSale(null)}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white font-bold text-sm transition-all animate-bounce ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

    </div>
  );
}
