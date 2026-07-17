import React, { useState, useEffect, useRef } from 'react';
import { usePOSStore } from '../store/store';
import { CartItem, Product, TableState, Sale } from '../types/types';
import { 
  Search, Plus, Minus, Trash2, CreditCard, DollarSign, 
  Percent, Printer, RefreshCw, ShoppingBag, Eye, User, 
  AlertTriangle, Check, Layers, ChevronRight, Package,
  HelpCircle, Zap, X, Keyboard, Award
} from 'lucide-react';

export default function VentasModule() {
  const {
    currentModule,
    userRole,
    products,
    clients,
    activeCarts,
    cartDiscounts,
    restaurantTables,
    bakeryTables,
    fruitTables,
    selectedTableId,
    cashSession,
    processCheckout,
    addToCart,
    removeFromCart,
    updateCartQty,
    applyDiscount,
    clearCart,
    selectTable,
    updateTableStatus,
    updateTableGuests,
    addTable,
    scanBarcode,
    sales,
    addClient,
    addLog
    ,appConfig
  } = usePOSStore();

  const sym = appConfig.currencySymbol || "S/";

  // Component states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('c-gen');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add table states
  const [showAddTableInput, setShowAddTableInput] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      showToast('Por favor ingrese un nombre de mesa válido.', 'error');
      return;
    }
    addTable(currentModule, newTableName.trim());
    showToast(`✓ Mesa "${newTableName.trim()}" agregada con éxito`, 'success');
    setNewTableName('');
    setShowAddTableInput(false);
  };
  
  // Modals
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentSaleInvoice, setCurrentSaleInvoice] = useState<Sale | null>(null);
  
  // Barcode search
  const [barcodeInput, setBarcodeInput] = useState('');

  // Pharmacy Modals & Warnings
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [pendingControlledProduct, setPendingControlledProduct] = useState<Product | null>(null);
  const [prescriptionData, setPrescriptionData] = useState({ doctorId: '', doctorLicense: '', patientName: '' });
  
  // Fruit Scale States
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [selectedFruit, setSelectedFruit] = useState<Product | null>(null);
  const [fruitWeight, setFruitWeight] = useState('1.000');
  const [serialPort, setSerialPort] = useState<any>(null);
  const [isReadingSerial, setIsReadingSerial] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);
  const activeReaderRef = useRef<any>(null);

  // New Client States
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '', address: '' });

  // --- NEW EXPANDED STATES ---
  const [orderType, setOrderType] = useState<'mesa' | 'llevar' | 'domicilio'>('mesa');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [showKitchenDisplay, setShowKitchenDisplay] = useState(false);
  const [showSpecialOrderModal, setShowSpecialOrderModal] = useState(false);
  const [showIceCreamModal, setShowIceCreamModal] = useState(false);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [showBarcodeLabelModal, setShowBarcodeLabelModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  
  // Ice Cream scoop selector states
  const [selectedScoopProduct, setSelectedScoopProduct] = useState<Product | null>(null);
  const [iceCreamFlavors, setIceCreamFlavors] = useState<string[]>([]);
  const [iceCreamToppings, setIceCreamToppings] = useState<string[]>([]);
  
  // Variants Selector states
  const [selectedVariantProduct, setSelectedVariantProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Rojo');
  
  // Special Order Form states
  const [specialOrderForm, setSpecialOrderForm] = useState({ clientName: '', phone: '', details: '', deliveryDate: '', price: '30.00' });
  
  // Split bill states
  const [splitCount, setSplitCount] = useState<number>(2);
  
  // Reservation states
  const [selectedTableForRes, setSelectedTableForRes] = useState<string | null>(null);
  const [reservationName, setReservationName] = useState('');
  const [reservationTime, setReservationTime] = useState('19:00');
  
  // WhatsApp invoice simulation
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');

  // --- NUEVOS ESTADOS: Otros Servicios + Ayuda + Descuento por item ---
  const [showOtrosModal, setShowOtrosModal] = useState(false);
  const [otrosForm, setOtrosForm] = useState({ name: '', qty: '1', price: '', isBulk: false });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'shortcuts' | 'faq' | 'support'>('shortcuts');
  const [itemDiscountModal, setItemDiscountModal] = useState<{ productId: string; current: number } | null>(null);
  const [itemDiscountInput, setItemDiscountInput] = useState('');

  // Get active cart based on context (direct cart or table cart)
  const isTableEnv = currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit';
  const getActiveCartItems = (): CartItem[] => {
    if (isTableEnv && selectedTableId) {
      const tables = currentModule === 'restaurant' ? restaurantTables : currentModule === 'bakery' ? bakeryTables : fruitTables;
      const table = tables.find(t => t.id === selectedTableId);
      return table ? table.cart : [];
    }
    return activeCarts[currentModule] || [];
  };

  const cartItems = getActiveCartItems();
  const discountPercent = cartDiscounts[currentModule] || 0;

  // Totals calculations
  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const price = item.isGenericEquivalent ? (item.product.costPrice * 1.5) : item.product.salePrice;
      const multiplier = item.weight || item.quantity;
      return acc + (price * multiplier);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const discountAmount = subtotal * (discountPercent / 100);
  const tax = (subtotal - discountAmount) * 0.18; // 18% IGV
  const total = subtotal - discountAmount;

  // Filter products by current vertical
  const filteredProducts = products.filter(p => p.storeType === currentModule);

  // Search results
  const searchResults = searchQuery
    ? filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.barcode.includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredProducts.slice(0, 8);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'F1') { e.preventDefault(); /* already on ventas tab */ }
      if (e.key === 'c' && e.altKey) {
        e.preventDefault();
        handleNormalCheckoutTrigger();
      }
      if (e.key === 'r' && e.altKey) {
        e.preventDefault();
        handleQuickCheckout();
      }
      if (e.key === 'a' && e.altKey) {
        e.preventDefault();
        setShowNewClientModal(true);
      }
      // ALT+S: Otros Servicios
      if (e.key === 's' && e.altKey) {
        e.preventDefault();
        setShowOtrosModal(true);
      }
      // ALT+H or F1 with alt: Ayuda
      if (e.key === 'h' && e.altKey) {
        e.preventDefault();
        setShowHelpModal(true);
      }
      // ALT+N: Nueva venta / Limpiar carrito
      if (e.key === 'n' && e.altKey) {
        e.preventDefault();
        clearCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, total]);

  // Web Serial Port cleanup effect
  useEffect(() => {
    if (!showScaleModal) {
      handleDisconnectSerial();
    }
    return () => {
      if (activeReaderRef.current) {
        activeReaderRef.current.cancel().catch(() => {});
      }
    };
  }, [showScaleModal]);

  // Drug Interaction Checking (Pharmacy specific)
  const getDrugInteractions = () => {
    if (currentModule !== 'pharmacy') return [];
    const cartProductIds = cartItems.map(item => item.product.id);
    const warnings: string[] = [];
    
    // Simple rule: Clonazepam (p4) and Morfina (p5) interact dangerously
    if (cartProductIds.includes('p4') && cartProductIds.includes('p5')) {
      warnings.push("⚠️ INTERACCIÓN CRÍTICA: La combinación de Clonazepam y Morfina puede provocar depresión respiratoria grave. Monitorear estrechamente o sugerir alternativa.");
    }
    // Ibuprofeno (p3) and Aspirina (p6) interact
    if (cartProductIds.includes('p3') && cartProductIds.includes('p6')) {
      warnings.push("⚠️ Interacción Moderada: El uso conjunto de Ibuprofeno y Aspirina puede disminuir el efecto cardioprotector de la aspirina y aumentar el riesgo de sangrado gastrointestinal.");
    }
    return warnings;
  };
  const drugWarnings = getDrugInteractions();

  // Barcode Scan submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const found = scanBarcode(barcodeInput);
    if (found) {
      setBarcodeInput('');
      addLog(`Código '${barcodeInput}' escaneado correctamente`, currentModule);
    } else {
      showToast('Producto no encontrado en este módulo.', 'error');
      addLog(`Intento fallido de escaneo código: '${barcodeInput}'`, currentModule);
    }
  };

  // Add Item to cart with Vertical specifics
  const handleAddItem = (product: Product) => {
    if (product.isBulk) {
      setSelectedFruit(product);
      const existing = cartItems.find(i => i.product.id === product.id);
      setFruitWeight(existing?.weight ? existing.weight.toString() : '1.000');
      setShowScaleModal(true);
      return;
    }

    if (currentModule === 'pharmacy' && product.isControlled) {
      // Trigger controlled prescription verification
      setPendingControlledProduct(product);
      setShowPrescriptionModal(true);
      return;
    }

    if (currentModule === 'fruit') {
      if (product.category === 'Toppings') {
        setSelectedFruit(product);
        setFruitWeight('50.00'); // Default to 50g
        setShowScaleModal(true);
        return;
      }
      if (product.category === 'Waffles' || product.category === 'Helados') {
        setSelectedScoopProduct(product);
        setIceCreamFlavors([]);
        setIceCreamToppings([]);
        setShowIceCreamModal(true);
        return;
      }
    }

    // If product has custom variants and we are in business (Retail) or bakery
    if (product.variants && product.variants.length > 0) {
      setSelectedVariantProduct(product);
      setSelectedSize(product.variants[0]);
      setSelectedColor('Único');
      setShowVariantsModal(true);
      return;
    }

    // Default retail / rest add
    addToCart({
      product,
      quantity: 1,
      discountPercentage: 0
    });
  };

  // Prescription validation confirm
  const handlePrescriptionConfirm = () => {
    if (!pendingControlledProduct) return;
    if (!prescriptionData.doctorId || !prescriptionData.doctorLicense || !prescriptionData.patientName) {
      showToast('Por favor complete todos los datos de la receta médica.', 'error');
      return;
    }
    
    addToCart({
      product: pendingControlledProduct,
      quantity: 1,
      discountPercentage: 0
    });
    
    addLog(`Receta archivada verificada para ${pendingControlledProduct.name} - Paciente: ${prescriptionData.patientName}, Dr. Lic: ${prescriptionData.doctorLicense}`, 'Farmacia');
    
    // Reset
    setShowPrescriptionModal(false);
    setPendingControlledProduct(null);
    setPrescriptionData({ doctorId: '', doctorLicense: '', patientName: '' });
  };

  // Fruit weight confirm
  const handleScaleConfirm = () => {
    if (!selectedFruit) return;
    const weight = parseFloat(fruitWeight);
    if (isNaN(weight) || weight <= 0) {
      showToast('Ingrese un peso válido.', 'error');
      return;
    }

    const isRestaurant = currentModule === 'restaurant';
    const isBakery = currentModule === 'bakery';
    
    // Check if the product is already in the active cart
    const existingItem = cartItems.find(item => item.product.id === selectedFruit.id);
    if (existingItem) {
      // Update existing item weight
      const updatedCart = cartItems.map(item =>
        item.product.id === selectedFruit.id ? { ...item, weight } : item
      );
      if ((isRestaurant || isBakery || currentModule === 'fruit') && selectedTableId) {
        const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
        const updatedTables = tablesList.map(t =>
          t.id === selectedTableId ? { ...t, cart: updatedCart } : t
        );
        if (isRestaurant) {
          usePOSStore.setState({ restaurantTables: updatedTables });
          if (typeof window !== 'undefined') {
            localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
          }
        } else if (isBakery) {
          usePOSStore.setState({ bakeryTables: updatedTables });
          if (typeof window !== 'undefined') {
            localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
          }
        } else {
          usePOSStore.setState({ fruitTables: updatedTables });
          if (typeof window !== 'undefined') {
            localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
          }
        }
      } else {
        usePOSStore.setState(state => ({
          activeCarts: { ...state.activeCarts, [currentModule]: updatedCart }
        }));
      }
      showToast(`✓ Peso actualizado para ${selectedFruit.name}: ${weight.toFixed(3)} kg`, 'success');
      addLog(`Pesaje actualizado para ${selectedFruit.name}: ${weight.toFixed(3)} kg`, currentModule);
    } else {
      addToCart({
        product: selectedFruit,
        quantity: 1,
        discountPercentage: 0,
        weight
      });
      addLog(`Pesaje registrado para ${selectedFruit.name}: ${weight.toFixed(3)} kg`, currentModule);
    }

    setShowScaleModal(false);
    setSelectedFruit(null);
  };

  // Simulate Scale trigger (yields random weight)
  const handleSimulateScale = () => {
    const weights = ['0.450', '0.780', '1.240', '1.850', '2.340', '0.920'];
    const randomWeight = weights[Math.floor(Math.random() * weights.length)];
    setFruitWeight(randomWeight);
  };

  const handleDisconnectSerial = async () => {
    if (activeReaderRef.current) {
      try {
        await activeReaderRef.current.cancel();
      } catch (err) {
        console.error('Error cancelando lector serial:', err);
      }
      activeReaderRef.current = null;
    }
    if (serialPort) {
      try {
        await serialPort.close();
      } catch (err) {
        console.error('Error cerrando puerto serial:', err);
      }
      setSerialPort(null);
    }
    setIsReadingSerial(false);
  };

  const handleConnectSerial = async () => {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      showToast('Su navegador no soporta la Web Serial API (Chrome/Edge/Opera son requeridos).', 'error');
      return;
    }
    try {
      setSerialError(null);
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialPort(port);
      setIsReadingSerial(true);
      showToast('Conectando a la balanza serial...', 'success');
      
      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      activeReaderRef.current = reader;
      
      (async () => {
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += value;
              const lines = buffer.split(/[\r\n]+/);
              buffer = lines.pop() || '';
              if (lines.length > 0) {
                const latestLine = lines[lines.length - 1];
                const match = latestLine.match(/\d+\.\d+/);
                if (match) {
                  const parsed = parseFloat(match[0]);
                  if (!isNaN(parsed) && parsed >= 0) {
                     setFruitWeight(parsed.toFixed(3));
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Lectura serial interrumpida:', err);
        } finally {
          reader.releaseLock();
          await readableStreamClosed.catch(() => {});
          setIsReadingSerial(false);
        }
      })();
      
    } catch (err: any) {
      console.error('Error al iniciar Web Serial:', err);
      setSerialError(err.message || 'Error al conectar');
      showToast('No se pudo conectar a la balanza serial.', 'error');
      setIsReadingSerial(false);
    }
  };

  // Generic equivalents search (Pharmacy specific)
  const handleSuggestGeneric = (item: CartItem) => {
    if (!item.product.genericEquivalent) return;
    const genericItem = products.find(p => p.name === item.product.genericEquivalent && p.storeType === 'pharmacy');
    if (genericItem) {
      removeFromCart(item.product.id);
      addToCart({
        product: genericItem,
        quantity: item.quantity,
        discountPercentage: 0,
        isGenericEquivalent: true
      });
      addLog(`Sugerido equivalente genérico: ${genericItem.name} en reemplazo de ${item.product.name}`, 'Farmacia');
    }
  };

  // Open normal checkout modal
  const handleNormalCheckoutTrigger = () => {
    if (cartItems.length === 0) return;
    setCashReceived(total.toFixed(2));
    setShowCheckoutModal(true);
  };

  // Complete checkout
  const handleCheckoutSubmit = () => {
    const cashVal = parseFloat(cashReceived);
    if (paymentMethod === 'cash' && (isNaN(cashVal) || cashVal < total)) {
      showToast('El efectivo recibido es menor al total.', 'error');
      return;
    }

    const res = processCheckout(paymentMethod, cashVal);
    if (res.success && res.sale) {
      setCurrentSaleInvoice(res.sale);
      setShowCheckoutModal(false);
      setShowInvoiceModal(true);
    } else {
      showToast('Error al realizar el cobro. Asegúrese de abrir la caja antes.', 'error');
    }
  };

  // Quick checkout
  const handleQuickCheckout = () => {
    if (cartItems.length === 0) return;
    const res = processCheckout('cash', total);
    if (res.success && res.sale) {
      setCurrentSaleInvoice(res.sale);
      setShowInvoiceModal(true);
      // Play a quick register sound if needed (using simulated alert)
      addLog(`Cobro Rápido en Efectivo procesado.`, currentModule);
    } else {
      showToast('Error al realizar el cobro rápido. Asegúrese de que la caja esté abierta.', 'error');
    }
  };

  // Create Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name) return;
    addClient(newClientData);
    setNewClientData({ name: '', email: '', phone: '', address: '' });
    setShowNewClientModal(false);
  };

  // Re-print last ticket
  const handleReprintLast = () => {
    if (sales.length > 0) {
      setCurrentSaleInvoice(sales[0]);
      setShowInvoiceModal(true);
    } else {
      showToast('No se registran ventas en la sesión actual.', 'error');
    }
  };

  // Get active vertical design tokens
  const getThemeStyles = () => {
    switch (currentModule) {
      case 'restaurant':
        return {
          primaryBg: 'bg-rose-600 hover:bg-rose-700',
          accentBorder: 'border-rose-200',
          accentText: 'text-rose-600',
          totalPanel: 'bg-rose-50/80 border-rose-200 text-rose-950',
          buttonPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/10',
          cardHeader: 'bg-rose-100/50 border-rose-200 text-rose-700',
          gridAccent: 'bg-rose-50/50 border-rose-100 hover:bg-rose-50/80 text-rose-950'
        };
      case 'pharmacy':
        return {
          primaryBg: 'bg-cyan-600 hover:bg-cyan-700',
          accentBorder: 'border-cyan-200',
          accentText: 'text-cyan-600',
          totalPanel: 'bg-cyan-50/80 border-cyan-200 text-cyan-950',
          buttonPrimary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-950/10',
          cardHeader: 'bg-cyan-100/50 border-cyan-200 text-cyan-700',
          gridAccent: 'bg-cyan-50/50 border-cyan-100 hover:bg-cyan-50/80 text-cyan-950'
        };
      case 'bakery':
        return {
          primaryBg: 'bg-amber-600 hover:bg-amber-700',
          accentBorder: 'border-amber-200',
          accentText: 'text-amber-700',
          totalPanel: 'bg-amber-50/80 border-amber-200 text-amber-950',
          buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10',
          cardHeader: 'bg-amber-100/50 border-amber-200 text-amber-800',
          gridAccent: 'bg-amber-50/50 border-amber-100 hover:bg-amber-50/80 text-amber-950'
        };
      case 'fruit':
        return {
          primaryBg: 'bg-emerald-600 hover:bg-emerald-700',
          accentBorder: 'border-emerald-200',
          accentText: 'text-emerald-700',
          totalPanel: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
          buttonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10',
          cardHeader: 'bg-emerald-100/50 border-emerald-200 text-emerald-800',
          gridAccent: 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50/80 text-emerald-950'
        };
      case 'business':
        return {
          primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
          accentBorder: 'border-indigo-200',
          accentText: 'text-indigo-600',
          totalPanel: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
          buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-950/10',
          cardHeader: 'bg-indigo-100/50 border-indigo-200 text-indigo-800',
          gridAccent: 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50/80 text-indigo-950'
        };
      default:
        return {
          primaryBg: 'bg-slate-700 hover:bg-slate-800',
          accentBorder: 'border-slate-200',
          accentText: 'text-slate-600',
          totalPanel: 'bg-slate-50/80 border-slate-200 text-slate-950',
          buttonPrimary: 'bg-slate-700 hover:bg-slate-800 text-white',
          cardHeader: 'bg-slate-100/50 border-slate-200 text-slate-600',
          gridAccent: 'bg-slate-50/50 border-slate-200 hover:bg-slate-50/80 text-slate-950'
        };
    }
  };

  const style = getThemeStyles();

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6">
      
      {/* LEFT AREA: SALES TICKET WORKBENCH */}
      <div className="flex-1 bg-white border border-slate-200 shadow-sm border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xl backdrop-blur-md">
        
        <div>
          {/* HEADER OPTIONS */}
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4 border-b border-slate-200 pb-4">
            
            <div className="flex flex-wrap gap-3 items-center">
              {/* Ticket No Dropdown */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">TICKET / COMBO</label>
                <select className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-mono outline-none">
                  <option>TICKET: T001 - 0044</option>
                  <option>TICKET: T001 - 0045</option>
                  <option>COTIZACIÓN / PRESU</option>
                </select>
              </div>

              {/* Payment Method ALT+W */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">FORMA DE PAGO [ALT+W]</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-bold outline-none cursor-pointer"
                >
                  <option value="cash">💵 Efectivo</option>
                  <option value="card">💳 Tarjeta Débito/Crédito</option>
                  <option value="transfer">📲 Transferencia / QR</option>
                  <option value="credit">📊 Crédito / Cartera</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Client general */}
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">CLIENTE</label>
                <div className="flex gap-1.5">
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-semibold outline-none cursor-pointer min-w-[140px]"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setShowNewClientModal(true)}
                    className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                    title="Nuevo Cliente [ALT+A]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* DRUG WARNING ALERT */}
          {drugWarnings.length > 0 && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-900/60 rounded-xl flex flex-col gap-1.5 animate-pulse">
              {drugWarnings.map((warn, i) => (
                <div key={i} className="text-xs text-red-400 font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          {/* SEARCH & CODE SCANNER SIMULATOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Standard catalog search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto por nombre o categoría..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Barcode scanner simulator */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Simular lector código barras + ENTER..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                type="submit" 
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${style.primaryBg} text-white border-transparent`}
              >
                Escanear
              </button>
            </form>
          </div>

          {/* ACTIVE CART ITEMS TABLE */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-center">Disp.</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">P. Venta</th>
                  <th className="p-3 text-center">Desc. %</th>
                  <th className="p-3 text-right">Importe</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-medium">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-bounce" />
                      El carrito está vacío. Añade productos desde el catálogo o escanea.
                    </td>
                  </tr>
                ) : (
                  cartItems.map((item) => {
                    const price = item.isGenericEquivalent ? (item.product.costPrice * 1.5) : item.product.salePrice;
                    const multiplier = item.weight || item.quantity;
                    const itemTotal = price * multiplier * (1 - item.discountPercentage / 100);

                    return (
                      <tr key={item.product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {item.product.name}
                              {item.selectedVariant && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 border border-slate-200">
                                  {item.selectedVariant}
                                </span>
                              )}
                              {item.isGenericEquivalent && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-250 text-[10px] text-emerald-600 font-bold">
                                  Genérico
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono font-medium">
                              SKU: {item.product.sku} | Barcode: {item.product.barcode}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">
                          {item.product.stock}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.product.isBulk || item.weight ? (
                              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                                <span className="font-mono font-bold text-slate-800">
                                  {item.weight ? `${item.weight.toFixed(3)} kg` : `${item.quantity.toFixed(3)} kg`}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedFruit(item.product);
                                    setFruitWeight(item.weight ? item.weight.toString() : '1.000');
                                    setShowScaleModal(true);
                                  }}
                                  className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 transition-colors cursor-pointer"
                                  title="Pesar en Balanza"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => updateCartQty(item.product.id, Math.max(1, item.quantity - 1))}
                                  className="p-1 rounded bg-white border border-slate-250 hover:bg-slate-100 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-mono font-bold text-slate-800">{item.quantity}</span>
                                <button 
                                  onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                                  className="p-1 rounded bg-white border border-slate-250 hover:bg-slate-100 cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {sym} {price.toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <input
                            type="number"
                            value={item.discountPercentage}
                            min={0}
                            max={100}
                            onChange={(e) => {
                              const disc = parseInt(e.target.value) || 0;
                              // Update items discount
                              const updatedCart = cartItems.map(i => 
                                i.product.id === item.product.id ? { ...i, discountPercentage: Math.min(100, Math.max(0, disc)) } : i
                              );
                              usePOSStore.setState(state => ({
                                activeCarts: { ...state.activeCarts, [currentModule]: updatedCart }
                              }));
                            }}
                            className="w-12 text-center bg-white border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                          />
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-850">
                          {sym} {itemTotal.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            {currentModule === 'pharmacy' && item.product.genericEquivalent && !item.isGenericEquivalent && (
                              <button
                                onClick={() => handleSuggestGeneric(item)}
                                className="px-2 py-1 rounded bg-emerald-50 border border-emerald-250 text-[10px] text-emerald-600 hover:bg-emerald-100 cursor-pointer transition-colors"
                                title="Sugerir Genérico equivalente"
                              >
                                Ofrecer Genérico
                              </button>
                            )}
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-400 rounded cursor-pointer transition-colors"
                              title="Quitar ítem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

        {/* BOTTOM METRICS PANEL & ACTION BUTTONS */}
        <div className="mt-8 pt-5 border-t border-slate-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            
            {/* Action buttons list */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button 
                onClick={handleReprintLast}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                <span>Reimprimir Recibo</span>
              </button>
              <button 
                onClick={() => {
                  if (confirm('¿Desea limpiar el carrito actual?')) clearCart();
                }}
                className="px-3 py-2 bg-white hover:bg-red-50 hover:text-red-600 border border-slate-250 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Vaciar Carrito</span>
              </button>

              {isTableEnv && selectedTableId && cartItems.length > 0 && (
                <button 
                  onClick={() => setShowSplitBillModal(true)}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 hover:text-indigo-900 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Dividir Cuenta (Calc)</span>
                </button>
              )}

              {/* OTROS SERVICIOS [ALT+S] */}
              <button
                onClick={() => setShowOtrosModal(true)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Otros Servicios [ALT+S]</span>
              </button>

              {/* AYUDA [ALT+H] */}
              <button
                onClick={() => setShowHelpModal(true)}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>Ayuda [ALT+H]</span>
              </button>

              <button 
                onClick={handleNormalCheckoutTrigger}
                className={`col-span-2 sm:col-span-1 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${style.buttonPrimary} border-transparent shadow-lg`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Cobro Normal [ALT+C]</span>
              </button>
              <button 
                onClick={handleQuickCheckout}
                className="col-span-2 sm:col-span-3 px-4 py-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>COBRO RÁPIDO EFECTIVO [ALT+R]</span>
              </button>
            </div>

            {/* Total balance display panel */}
            <div className={`p-4 rounded-2xl border ${style.totalPanel} flex flex-col gap-1.5 shadow-inner`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">DESCUENTO GLOBAL (%):</span>
                <input
                  type="number"
                  value={discountPercent}
                  min={0}
                  max={100}
                  onChange={(e) => applyDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 text-center bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-bold font-mono outline-none"
                />
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-200/40 pb-1.5">
                <span className="text-slate-500 font-bold">SUBTOTAL:</span>
                <span className="font-mono font-bold text-slate-750">{sym} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-200/40 pb-1.5">
                <span className="text-slate-500 font-bold">IGV (18%):</span>
                <span className="font-mono font-bold text-slate-750">{sym} {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-black text-slate-800">TOTAL:</span>
                <span className="text-xl font-black font-mono tracking-tighter text-slate-900">
                  {sym} {total.toFixed(2)}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT AREA: CONTEXTUAL WORKFLOW PANELS (VERTICAL-SPECIFIC) */}
      <div className="w-full xl:w-[480px] flex flex-col gap-6">
        
        {/* PANEL 1: SEATING GRID FOR RESTAURANT / BAKERY */}
        {isTableEnv && (
          <div className="bg-white border border-slate-200 shadow-sm border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Plano de Mesas y Salones</span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKitchenDisplay(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  🍳 Pantalla de Cocina
                </button>
                <button
                  onClick={() => setShowAddTableInput(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  ➕ Agregar Mesa
                </button>
              </div>
            </div>
            
            {showAddTableInput && (
              <form 
                onSubmit={handleAddTableSubmit}
                className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Nombre de la mesa (Ej: Mesa 9)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTableInput(false);
                    setNewTableName('');
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            )}
            
            <div className="grid grid-cols-3 gap-3">
              {((currentModule === 'restaurant' ? restaurantTables : currentModule === 'bakery' ? bakeryTables : fruitTables) as TableState[]).map(table => {
                const isSelected = selectedTableId === table.id;
                
                let btnColor = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500';
                let indicator = 'bg-slate-300';

                if (table.status === 'occupied') {
                  btnColor = isSelected 
                    ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm shadow-amber-100' 
                    : 'bg-amber-50 border-amber-200 text-amber-800';
                  indicator = 'bg-amber-500 animate-pulse';
                } else if (table.status === 'billing') {
                  btnColor = isSelected 
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-sm shadow-emerald-100' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-850';
                  indicator = 'bg-emerald-500 animate-pulse';
                } else if (table.status === 'reserved') {
                  btnColor = isSelected 
                    ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-sm shadow-blue-100' 
                    : 'bg-blue-50 border-blue-200 text-blue-800';
                  indicator = 'bg-blue-500';
                } else if (isSelected) {
                  btnColor = 'bg-slate-100 border-slate-400 text-slate-800';
                }

                return (
                  <button
                    key={table.id}
                    onClick={() => selectTable(isSelected ? null : table.id)}
                    className={`p-3 rounded-xl border flex flex-col justify-between items-start transition-all cursor-pointer duration-300 relative overflow-hidden ${btnColor}`}
                  >
                    <div className="flex justify-between w-full items-center">
                      <span className="font-bold text-xs">{table.name}</span>
                      <span className={`w-2 h-2 rounded-full ${indicator}`}></span>
                    </div>
                    
                    <div className="mt-3 text-[10px] text-slate-400 font-semibold font-mono">
                      {table.status === 'free' 
                        ? 'Libre' 
                        : table.status === 'reserved' 
                          ? `Res: ${table.reservationName || 'S/N'} (${table.reservationTime || '19:00'})`
                          : `Cart: ${table.cart.length} ítems`}
                    </div>

                    {table.guestsCount > 0 && (
                      <span className="absolute top-1 right-5 text-[8px] bg-slate-100 border border-slate-200 px-1 rounded text-slate-500 font-bold">
                        👥{table.guestsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedTableId && (
              <div className="mt-4 p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Configuración Mesa Activa:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      onClick={() => updateTableStatus(selectedTableId!, 'occupied')}
                      className="px-2 py-0.5 rounded bg-amber-50 border border-amber-250 text-[10px] text-amber-700 hover:bg-amber-100 cursor-pointer font-bold"
                    >
                      Ocupar
                    </button>
                    <button 
                      onClick={() => updateTableStatus(selectedTableId!, 'billing')}
                      className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-250 text-[10px] text-emerald-700 hover:bg-emerald-100 cursor-pointer font-bold"
                    >
                      Pide Cuenta
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedTableForRes(selectedTableId);
                        setReservationName('');
                        setReservationTime('19:00');
                        setShowReservationModal(true);
                      }}
                      className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] text-blue-700 hover:bg-blue-100 cursor-pointer font-bold"
                    >
                      Reservar
                    </button>
                    <button 
                      onClick={() => updateTableStatus(selectedTableId!, 'free')}
                      className="px-2 py-0.5 rounded bg-slate-100 border border-slate-250 text-[10px] text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">Nro Comensales:</span>
                  <input
                    type="number"
                    min={0}
                    defaultValue={2}
                    onChange={(e) => updateTableGuests(selectedTableId!, parseInt(e.target.value) || 0)}
                    className="w-12 text-center bg-white border border-slate-200 rounded text-xs text-slate-800 outline-none font-bold"
                  />
                </div>
              </div>
            )}

          </div>
        )}

        {/* PANEL 2: PRODUCT QUICK LIST CATALOG GRID */}
        <div className="flex-1 bg-white border border-slate-200 shadow-sm border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden max-h-[600px]">
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <span>Catálogo Rápido de Productos</span>
            </h3>
            {(currentModule === 'bakery' || currentModule === 'restaurant') && (
              <button
                onClick={() => {
                  setSpecialOrderForm({ 
                    clientName: '', 
                    phone: '', 
                    details: '', 
                    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
                    price: '30.00' 
                  });
                  setShowSpecialOrderModal(true);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                📅 Pedido Especial
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1">
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddItem(product)}
                disabled={product.stock === 0}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${style.gridAccent} ${
                  product.stock === 0 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    {product.category}
                  </span>
                  <strong className="text-xs text-slate-800 line-clamp-1">{product.name}</strong>
                </div>

                <div className="mt-3 flex items-center justify-between w-full border-t border-slate-200/40 pt-2">
                  <span className="font-mono font-bold text-xs text-slate-900">{sym} {product.salePrice.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold font-mono ${product.stock <= product.minStock ? 'text-red-500' : 'text-slate-400'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* CHECKOUT PAYMENT MODAL (ALT+C) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>Detalles del Cobro (Facturación)</span>
            </h3>

            <div className="flex flex-col gap-3 font-medium text-xs">
              <div className="flex justify-between items-center text-slate-500 bg-slate-100 p-2.5 rounded-lg">
                <span>Total a Pagar:</span>
                <strong className="text-lg font-black text-slate-900 font-mono">{sym} {total.toFixed(2)}</strong>
              </div>

              {/* Payment selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Método de Cobro</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'card', 'transfer'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 border rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        paymentMethod === method
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 bg-white/30 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {method === 'cash' && <DollarSign className="w-4 h-4" />}
                      {method === 'card' && <CreditCard className="w-4 h-4" />}
                      {method === 'transfer' && <RefreshCw className="w-4 h-4" />}
                      <span className="text-[10px] font-bold uppercase capitalize">{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash amount received */}
              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Efectivo Recibido ({sym})</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-sm outline-none"
                    placeholder={`${sym} 0.00`}
                    autoFocus
                  />
                  {parseFloat(cashReceived) >= total && (
                    <div className="mt-2 text-emerald-400 font-semibold text-right">
                      Vuelto: {sym} {(parseFloat(cashReceived) - total).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckoutSubmit}
                className="px-5 py-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Confirmar Pago
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TICKET / INVOICE PREVIEW MODAL */}
      {showInvoiceModal && currentSaleInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-3 justify-between">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>COMPROBANTE ELECTRÓNICO</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">{currentSaleInvoice.ticketNumber}</span>
            </h3>

            {/* Simulated thermal receipt paper layout */}
            <div className="bg-white text-zinc-900 p-4 rounded-lg font-mono text-[10px] shadow-inner flex flex-col gap-2">
              <div className="text-center border-b border-dashed border-zinc-400 pb-2">
                <h4 className="font-black text-sm uppercase">POS MULTIRUBRO S.A.</h4>
                <p>AV. GENERAL PAZ 1250 - LIMA</p>
                <p>R.U.C.: 20123456789</p>
                <p className="mt-1 font-bold">RUBRO: {currentSaleInvoice.storeType.toUpperCase()}</p>
                {currentSaleInvoice.tableName && <p className="font-bold">MESA: {currentSaleInvoice.tableName}</p>}
              </div>

              <div className="border-b border-dashed border-zinc-400 pb-2">
                <p>FECHA: {new Date(currentSaleInvoice.timestamp).toLocaleString()}</p>
                <p>CAJERO: {currentSaleInvoice.cashier}</p>
                <p>CLIENTE: {clients.find(c => c.id === selectedClientId)?.name || 'Cliente General'}</p>
              </div>

              <div className="border-b border-dashed border-zinc-400 pb-2">
                <div className="flex justify-between font-bold border-b border-dashed border-zinc-300 pb-1 mb-1">
                  <span>DESCRIPCION</span>
                  <span>CANT x PREC</span>
                  <span className="text-right">TOTAL</span>
                </div>
                {currentSaleInvoice.items.map((item, idx) => {
                  const price = item.isGenericEquivalent ? (item.product.costPrice * 1.5) : item.product.salePrice;
                  const mult = item.weight || item.quantity;
                  const unit = item.weight ? 'kg' : 'un';
                  return (
                    <div key={idx} className="flex justify-between py-0.5">
                      <span className="max-w-[120px] truncate">{item.product.name}</span>
                      <span>{mult.toFixed(2)} {unit} x {price.toFixed(2)}</span>
                      <span className="text-right">{(price * mult).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col items-end gap-0.5 font-bold">
                <div className="flex justify-between w-full">
                  <span>SUBTOTAL:</span>
                  <span>{sym} {currentSaleInvoice.subtotal.toFixed(2)}</span>
                </div>
                {currentSaleInvoice.discount > 0 && (
                  <div className="flex justify-between w-full text-red-650">
                    <span>DESC:</span>
                    <span>- {sym} {currentSaleInvoice.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-full">
                  <span>IGV (18%):</span>
                  <span>{sym} {currentSaleInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full text-sm font-black border-t border-dashed border-zinc-400 pt-1 mt-1">
                  <span>TOTAL:</span>
                  <span>{sym} {currentSaleInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-400 pt-2 text-center text-[8px] mt-2">
                <p>FORMA DE PAGO: {currentSaleInvoice.paymentMethod.toUpperCase()}</p>
                {currentSaleInvoice.paymentMethod === 'cash' && (
                  <>
                    <p>ENTREGADO: {sym} {currentSaleInvoice.cashReceived.toFixed(2)}</p>
                    <p>VUELTO: {sym} {currentSaleInvoice.changeGiven.toFixed(2)}</p>
                  </>
                )}
                <p className="mt-2 font-bold">*** GRACIAS POR SU COMPRA ***</p>
              </div>

            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setWhatsAppPhone(clients.find(c => c.id === selectedClientId)?.phone || '');
                  setShowWhatsAppModal(true);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>📲 WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowInvoiceModal(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${style.buttonPrimary} shadow-sm`}
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRESCRIPTION CHECK MODAL (Pharmacy Controlled items) */}
      {showPrescriptionModal && pendingControlledProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            
            <h3 className="text-md font-bold text-red-400 flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-red-450" />
              <span>Verificación de Receta Médica</span>
            </h3>

            <p className="text-xs text-white/70 leading-relaxed font-normal">
              El producto <strong className="text-emerald-400 font-bold">'{pendingControlledProduct.name}'</strong> es una sustancia controlada y requiere registrar la receta médica para autorizar la venta.
            </p>

            <div className="flex flex-col gap-3 font-semibold text-xs text-white/80">
              <div>
                <label className="block text-white/40 mb-1 tracking-wider">NOMBRE DEL PACIENTE</label>
                <input
                  type="text"
                  value={prescriptionData.patientName}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-red-400 transition-colors"
                  placeholder="Ej. María Josefa"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/40 mb-1 tracking-wider">ID / RUT MÉDICO</label>
                  <input
                    type="text"
                    value={prescriptionData.doctorId}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, doctorId: e.target.value }))}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-red-400 transition-colors"
                    placeholder="Ej. MD-4509"
                  />
                </div>
                <div>
                  <label className="block text-white/40 mb-1 tracking-wider">NRO DE MATRÍCULA</label>
                  <input
                    type="text"
                    value={prescriptionData.doctorLicense}
                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, doctorLicense: e.target.value }))}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-red-400 transition-colors"
                    placeholder="Ej. MAT-890-4"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setPendingControlledProduct(null);
                }}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePrescriptionConfirm}
                className="px-5 py-2 bg-gradient-to-tr from-red-650 to-rose-650 hover:from-red-550 hover:to-rose-550 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20 transition-all"
              >
                Aprobar y Agregar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WEIGHT SCALE SIMULATOR MODAL (Fruit Shop) */}
      {showScaleModal && selectedFruit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            
            <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Layers className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span>Báscula de Pesaje Digital</span>
            </h3>

            <div className="bg-white/5 border border-white/15 p-4 rounded-2xl text-center flex flex-col gap-1.5 shadow-inner">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">PRODUCTO A PESAR</span>
              <strong className="text-base text-white">{selectedFruit.name}</strong>
              <span className="text-xs text-white/60 mt-1 font-mono">Precio por Kg: {sym} {selectedFruit.salePrice.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 mb-1.5 tracking-wider uppercase">PESO (KILOGRAMOS)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fruitWeight}
                  onChange={(e) => setFruitWeight(e.target.value)}
                  className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-mono text-center text-2xl font-bold outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0.000"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSimulateScale}
                  className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                  title="Simular pesaje con un valor aleatorio"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>Simular</span>
                </button>
              </div>
            </div>

            {/* Quick weights list */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
              {['0.250', '0.500', '1.000', '2.000'].map(w => (
                <button
                  key={w}
                  onClick={() => setFruitWeight(w)}
                  className="py-2 border border-white/5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10 cursor-pointer transition-all"
                >
                  {parseFloat(w).toFixed(3)} Kg
                </button>
              ))}
            </div>

            {/* Serial port connection interface */}
            <div className="mt-2 p-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60 font-semibold">Conexión Balanza Serial:</span>
                {isReadingSerial ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    🟢 Activo / Leyendo...
                  </span>
                ) : (
                  <span className="text-[10px] bg-white/5 text-white/40 border border-white/10 px-2 py-0.5 rounded-full font-bold">
                    ⚫ Desconectado
                  </span>
                )}
              </div>
              
              {serialError && (
                <div className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-900/40 p-2 rounded-xl">
                  ⚠️ Error: {serialError}
                </div>
              )}

              <button
                type="button"
                onClick={isReadingSerial ? handleDisconnectSerial : handleConnectSerial}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                  isReadingSerial 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-350 hover:bg-rose-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-350 hover:bg-emerald-500/20'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {isReadingSerial ? 'Desconectar Balanza Serial' : 'Conectar Balanza Digital'}
              </button>
            </div>

            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => {
                  setShowScaleModal(false);
                  setSelectedFruit(null);
                }}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleScaleConfirm}
                className="px-5 py-2 bg-gradient-to-tr from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-emerald-950/20 transition-all"
              >
                Confirmar Pesaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CLIENT MODAL */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <User className="w-5 h-5 text-indigo-605" />
              <span>Agregar Nuevo Cliente [ALT+A]</span>
            </h3>

            <form onSubmit={handleCreateClient} className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newClientData.name}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none"
                  placeholder="Ej. +51 987 654 321"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none"
                  placeholder="Ej. juan@gmail.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dirección de Envío</label>
                <input
                  type="text"
                  value={newClientData.address}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none"
                  placeholder="Ej. Av. Larco 450, Miraflores"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
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

      {/* SPLIT BILL MODAL */}
      {showSplitBillModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Calculadora Informativa de Cuentas Divididas</span>
            </h3>
            
            <div className="flex flex-col gap-4 font-semibold text-xs text-slate-700">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center text-indigo-950">
                <span>Total de la Cuenta:</span>
                <strong className="text-base font-black font-mono">{sym} {total.toFixed(2)}</strong>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Dividir entre cuántos comensales:</label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={splitCount}
                  onChange={(e) => setSplitCount(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-center font-bold text-base outline-none"
                />
              </div>

              <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
                  <span>Importe por Persona (Neto):</span>
                  <span className="font-mono font-bold text-slate-900">{sym} {(total / splitCount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl">
                  <span>Proporción de IGV (18%) por Persona:</span>
                  <span className="font-mono text-slate-500">{sym} {(tax / splitCount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowSplitBillModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  showToast(`Imprimiendo ${splitCount} pre-cuentas de ${sym} ${(total / splitCount).toFixed(2)} cada una...`, 'success');
                  setShowSplitBillModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                🖨️ Imprimir Pre-Cuentas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESERVATION MODAL */}
      {showReservationModal && selectedTableForRes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Check className="w-5 h-5 text-indigo-600" />
              <span>Registrar Reserva de Mesa</span>
            </h3>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center text-indigo-950 font-semibold text-xs">
              <span>Mesa a Reservar:</span>
              <span>{((currentModule === 'restaurant' ? restaurantTables : currentModule === 'bakery' ? bakeryTables : fruitTables) as TableState[]).find(t => t.id === selectedTableForRes)?.name}</span>
            </div>

            <div className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div>
                <label className="block text-slate-400 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  placeholder="Ej. Andrés Pastrana"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hora de Reserva</label>
                <input
                  type="time"
                  required
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setSelectedTableForRes(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!reservationName) {
                    showToast('Complete el nombre de reserva.', 'error');
                    return;
                  }
                  const tablesList = currentModule === 'restaurant' ? restaurantTables : currentModule === 'bakery' ? bakeryTables : fruitTables;
                  const updatedTables = tablesList.map(t => {
                    if (t.id === selectedTableForRes) {
                      return { ...t, status: 'reserved' as const, reservationName, reservationTime };
                    }
                    return t;
                  });
                  if (currentModule === 'restaurant') {
                    usePOSStore.setState({ restaurantTables: updatedTables });
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
                    }
                  } else if (currentModule === 'bakery') {
                    usePOSStore.setState({ bakeryTables: updatedTables });
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
                    }
                  } else {
                    usePOSStore.setState({ fruitTables: updatedTables });
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
                    }
                  }
                  addLog(`Mesa ${selectedTableForRes.split('-')[1]} reservada para ${reservationName} a las ${reservationTime}`, currentModule);
                  setShowReservationModal(false);
                  setSelectedTableForRes(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ICE CREAM / DESSERT MODAL */}
      {showIceCreamModal && selectedScoopProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Plus className="w-5 h-5 text-emerald-600 animate-pulse" />
              <span>Personalizar Postre / Helado</span>
            </h3>

            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center">
              <strong className="text-slate-800 text-xs">{selectedScoopProduct.name}</strong>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Precio base: {sym} {selectedScoopProduct.salePrice.toFixed(2)}</p>
            </div>

            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-700 max-h-[300px] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Sabores de Helado (Seleccione hasta 3)</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {['Chocolate Belga', 'Vainilla Francesa', 'Fresa Silvestre', 'Arequipe/Manjar', 'Coco Loco', 'Limón Menta'].map(flv => {
                    const isSelected = iceCreamFlavors.includes(flv);
                    return (
                      <button
                        key={flv}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setIceCreamFlavors(prev => prev.filter(f => f !== flv));
                          } else if (iceCreamFlavors.length < 3) {
                            setIceCreamFlavors(prev => [...prev, flv]);
                          }
                        }}
                        className={`p-2 border rounded-lg transition-all text-left ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{flv}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">Adiciones / Toppings (Crema, Dulces)</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {['Chispas de Chocolate', 'Crema Chantilly', 'Salsa de Chocolate', 'Leche Condensada', 'Fruta Picada', 'Queso Rallado'].map(top => {
                    const isSelected = iceCreamToppings.includes(top);
                    return (
                      <button
                        key={top}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setIceCreamToppings(prev => prev.filter(t => t !== top));
                          } else {
                            setIceCreamToppings(prev => [...prev, top]);
                          }
                        }}
                        className={`p-2 border rounded-lg transition-all text-left ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{top}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  setShowIceCreamModal(false);
                  setSelectedScoopProduct(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  let detailsStr = '';
                  if (iceCreamFlavors.length > 0) detailsStr += `Flvs: ${iceCreamFlavors.join(', ')}`;
                  if (iceCreamToppings.length > 0) {
                    if (detailsStr) detailsStr += ' | ';
                    detailsStr += `Tops: ${iceCreamToppings.join(', ')}`;
                  }
                  
                  addToCart({
                    product: selectedScoopProduct,
                    quantity: 1,
                    discountPercentage: 0,
                    selectedVariant: detailsStr || undefined,
                    flavors: iceCreamFlavors,
                    toppings: iceCreamToppings
                  });

                  addLog(`Helado/Postre personalizado añadido: ${selectedScoopProduct.name} (${detailsStr})`, 'Heladería');
                  setShowIceCreamModal(false);
                  setSelectedScoopProduct(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VARIANTS SELECTOR MODAL */}
      {showVariantsModal && selectedVariantProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Layers className="w-5 h-5 text-indigo-650" />
              <span>Selección de Variante / Presentación</span>
            </h3>

            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center">
              <strong className="text-slate-850 text-xs font-bold">{selectedVariantProduct.name}</strong>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Precio base: {sym} {selectedVariantProduct.salePrice.toFixed(2)}</p>
            </div>

            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Variante disponible:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedVariantProduct.variants || []).map(variant => {
                    const isSelected = selectedSize === variant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedSize(variant)}
                        className={`p-2.5 border rounded-xl text-center transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-750 font-bold' 
                            : 'border-slate-250 bg-white text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {variant}
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentModule === 'business' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Detalle / Color (Opcional):</label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                  >
                    <option value="Único">Único / Genérico</option>
                    <option value="Rojo">Rojo</option>
                    <option value="Azul">Azul</option>
                    <option value="Negro">Negro</option>
                    <option value="Blanco">Blanco</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-2 border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  setShowVariantsModal(false);
                  setSelectedVariantProduct(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const label = selectedColor !== 'Único' ? `${selectedSize} - Color: ${selectedColor}` : selectedSize;
                  addToCart({
                    product: selectedVariantProduct,
                    quantity: 1,
                    discountPercentage: 0,
                    selectedVariant: label,
                    selectedSize,
                    selectedColor: selectedColor !== 'Único' ? selectedColor : undefined
                  });
                  addLog(`Variante '${label}' de ${selectedVariantProduct.name} agregada al carrito`, currentModule);
                  setShowVariantsModal(false);
                  setSelectedVariantProduct(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <span>📲 Envío de Factura por WhatsApp</span>
            </h3>

            <div className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div>
                <label className="block text-slate-400 mb-1">Número de Celular Destino</label>
                <input
                  type="text"
                  required
                  value={whatsAppPhone}
                  onChange={(e) => setWhatsAppPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-center text-sm outline-none font-bold"
                  placeholder="Ej. +57 300 4567890"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-xl text-[10px] leading-relaxed">
                ℹ️ Esta opción redirigirá a WhatsApp Web/Desktop para enviar el mensaje al cliente.
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  if (!whatsAppPhone) {
                    showToast('Ingrese un número telefónico.', 'error');
                    return;
                  }
                  
                  const cleanPhone = whatsAppPhone.replace(/\D/g, '');
                  const message = encodeURIComponent(`¡Hola! 👋 Aquí tienes el comprobante de tu compra. ¡Gracias por preferirnos!`);
                  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
                  
                  showToast(`¡Comprobante enviado por WhatsApp al número ${whatsAppPhone}!`, 'success');
                  addLog(`Comprobante electrónico enviado por WhatsApp a: ${whatsAppPhone}`, currentModule);
                  setShowWhatsAppModal(false);
                  setShowInvoiceModal(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Enviar Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KITCHEN DISPLAY VIEW */}
      {showKitchenDisplay && (
        <div className="fixed inset-0 z-[100] bg-[#111111] flex flex-col p-6 overflow-y-auto">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>🍳 Pantalla de visualización de Cocina y Bar</span>
                <span className="px-2 py-0.5 rounded bg-zinc-850 border border-zinc-700 text-xs font-mono text-indigo-400">MODO COLA</span>
              </h2>
              <p className="text-xs text-zinc-500 font-semibold">Pedidos en cola activos de salón</p>
            </div>
            <button
              onClick={() => setShowKitchenDisplay(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Cerrar Pantalla
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {((currentModule === 'restaurant' ? restaurantTables : currentModule === 'bakery' ? bakeryTables : fruitTables) as TableState[])
              .filter(t => t.status === 'occupied' || t.status === 'billing')
              .map(table => (
                <div key={table.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-xl">
                  <div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2">
                      <strong className="text-white text-sm font-bold uppercase">{table.name}</strong>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">👤 Comensales: {table.guestsCount || 2}</span>
                    </div>

                    <ul className="flex flex-col gap-2 font-semibold">
                      {table.cart.map((c, i) => (
                        <li key={i} className="text-xs text-zinc-355 flex justify-between items-start">
                          <div>
                            <span className="text-white font-bold">{c.quantity}x</span> {c.product.name}
                            {c.selectedVariant && (
                              <p className="text-[9px] text-zinc-550 italic ml-4 font-mono font-medium">{c.selectedVariant}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-zinc-800 pt-3 flex gap-2 w-full">
                    <button
                      onClick={() => {
                        showToast(`Imprimiendo comandas en cocina para la ${table.name}...`, 'success');
                        addLog(`Comanda para cocina impresa de forma manual - ${table.name}`, currentModule);
                      }}
                      className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      🖨️ Imprimir Comanda
                    </button>
                    <button
                      onClick={() => {
                        showToast(`¡Pedido de la ${table.name} marcado como LISTO!`, 'success');
                        updateTableStatus(table.id, 'billing');
                        addLog(`Comanda de cocina completada - ${table.name} lista para cobro`, currentModule);
                      }}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      ✓ Listo para Servir
                    </button>
                  </div>
                </div>
              ))}
            {((currentModule === 'restaurant' ? restaurantTables : currentModule === 'bakery' ? bakeryTables : fruitTables) as TableState[])
              .filter(t => t.status === 'occupied' || t.status === 'billing').length === 0 && (
                <div className="col-span-full p-16 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
                  🍳 No hay comandas en preparación en este momento.
                </div>
              )}
          </div>
        </div>
      )}

      {/* SPECIAL ORDER FORM MODAL */}
      {showSpecialOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Check className="w-5 h-5 text-amber-600 animate-pulse" />
              <span>Registrar Pedido / Encargo Especial</span>
            </h3>

            <div className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    required
                    value={specialOrderForm.clientName}
                    onChange={(e) => setSpecialOrderForm(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                    placeholder="Ej. Carolina Herrera"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={specialOrderForm.phone}
                    onChange={(e) => setSpecialOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                    placeholder="Ej. 312 999 8888"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detalles del Encargo (Receta, Adiciones)</label>
                <textarea
                  required
                  rows={3}
                  value={specialOrderForm.details}
                  onChange={(e) => setSpecialOrderForm(prev => ({ ...prev, details: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none font-medium"
                  placeholder="Ej. Torta de vainilla sin azúcar con chispas de cacao oscuro y vela decorativa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    required
                    value={specialOrderForm.deliveryDate}
                    onChange={(e) => setSpecialOrderForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Precio Cotizado ({sym})</label>
                  <input
                    type="number"
                    required
                    value={specialOrderForm.price}
                    onChange={(e) => setSpecialOrderForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowSpecialOrderModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!specialOrderForm.clientName || !specialOrderForm.details || !specialOrderForm.deliveryDate) {
                    showToast('Complete todos los campos del pedido.', 'error');
                    return;
                  }
                  const priceNum = parseFloat(specialOrderForm.price) || 0;
                  const { addCustomOrder } = usePOSStore.getState();
                  addCustomOrder({
                    clientName: specialOrderForm.clientName,
                    phone: specialOrderForm.phone,
                    details: specialOrderForm.details,
                    deliveryDate: specialOrderForm.deliveryDate,
                    status: 'pending',
                    price: priceNum
                  });
                  showToast('¡Pedido especial agendado correctamente!', 'success');
                  setShowSpecialOrderModal(false);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Agendar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OTROS SERVICIOS (productos no listados) */}
      {showOtrosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151b27] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-amber-400" />
                Agregar producto o servicio no listado
              </h3>
              <button onClick={() => setShowOtrosModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tipo */}
              <div className="flex gap-3">
                {['Unidad', 'A Granel (Decimal)'].map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setOtrosForm(f => ({ ...f, isBulk: tipo.includes('Granel') }))}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      (tipo.includes('Granel') ? otrosForm.isBulk : !otrosForm.isBulk)
                        ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Nombre del Producto / Servicio</label>
                <input
                  value={otrosForm.name}
                  onChange={e => setOtrosForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 text-sm transition-all"
                  placeholder="Ej. Servicio de instalación"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">
                    {otrosForm.isBulk ? 'Cantidad (kg/lt)' : 'Cantidad'}
                  </label>
                  <input
                    type="number"
                    value={otrosForm.qty}
                    onChange={e => setOtrosForm(f => ({ ...f, qty: e.target.value }))}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-400 text-sm transition-all"
                    min="0" step={otrosForm.isBulk ? '0.01' : '1'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Precio de Venta</label>
                  <input
                    type="number"
                    value={otrosForm.price}
                    onChange={e => setOtrosForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-400 text-sm transition-all"
                    placeholder="0.00" min="0" step="0.01"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!otrosForm.name || !otrosForm.price) return;
                  const tempProduct = {
                    id: `otros-${Date.now()}`,
                    name: otrosForm.name,
                    category: 'Otros',
                    barcode: '',
                    sku: 'OTROS-LIBRE',
                    costPrice: 0,
                    salePrice: parseFloat(otrosForm.price) || 0,
                    stock: 999,
                    minStock: 0,
                    description: 'Producto/servicio libre',
                    storeType: currentModule as any,
                    isBulk: otrosForm.isBulk,
                    trackInventory: false,
                    active: true,
                  };
                  const qty = parseFloat(otrosForm.qty) || 1;
                  addToCart({
                    product: tempProduct,
                    quantity: otrosForm.isBulk ? 1 : qty,
                    weight: otrosForm.isBulk ? qty : undefined,
                    discountPercentage: 0,
                  });
                  setShowOtrosModal(false);
                  setOtrosForm({ name: '', qty: '1', price: '', isBulk: false });
                  showToast(`✓ "${otrosForm.name}" agregado al carrito`, 'success');
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Agregar al detalle [F1]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AYUDA AL USUARIO */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle size={22} className="text-emerald-400" />
                Centro de Ayuda y Guía del POS
              </h3>
              <button 
                onClick={() => {
                  setShowHelpModal(false);
                  setHelpTab('shortcuts');
                }} 
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-4 text-xs font-semibold">
              {[
                { id: 'shortcuts', label: '⌨️ Teclado y Atajos' },
                { id: 'faq', label: '❓ Preguntas Frecuentes' },
                { id: 'support', label: '📞 Soporte y Licencia' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setHelpTab(tab.id as any)}
                  className={`flex-1 py-2 rounded-lg transition-all ${
                    helpTab === tab.id 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-white/60 hover:text-white border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-4 text-sm font-medium text-white/80">
              {helpTab === 'shortcuts' && (
                <div className="space-y-3">
                  <p className="text-xs text-white/40 mb-2">Use estos atajos desde la pantalla de Ventas para operar de forma eficiente:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'F1', desc: 'Agregar Producto Libre / Otros' },
                      { key: 'F2', desc: 'Enfocar buscador de productos' },
                      { key: 'F4', desc: 'Vaciar Carrito de Ventas' },
                      { key: 'F8', desc: 'Alternar Método de Pago' },
                      { key: 'F9', desc: 'Procesar Venta (Checkout)' },
                      { key: 'F10', desc: 'Registrar Nuevo Cliente' },
                      { key: 'ALT + S', desc: 'Otros Servicios / Conceptos' },
                      { key: 'ESC', desc: 'Cerrar cualquier modal activo' }
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl">
                        <span className="font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">{s.key}</span>
                        <span className="text-xs text-white/70 text-right">{s.desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">Manual del Operador</h4>
                      <p className="text-[10px] text-white/40">Guía completa de configuración y ventas.</p>
                    </div>
                    <button 
                      onClick={() => window.open('https://wa.me/59177777777', '_blank')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Descargar PDF
                    </button>
                  </div>
                </div>
              )}

              {helpTab === 'faq' && (
                <div className="space-y-3">
                  {[
                    { q: '¿Cómo funciona la venta de productos a granel?', a: 'Para productos como frutas, verduras u otros vendidos por peso, al agregarlos se abrirá el modal de balanza. Puede ingresar el peso manualmente o conectar una balanza digital real mediante el botón "Conectar Balanza".' },
                    { q: '¿Cómo aplicar un descuento global?', a: 'En el panel inferior derecho, debajo de los totales, puede ingresar un porcentaje en "Descuento General". Esto descontará de forma proporcional sobre la base de todos los ítems.' },
                    { q: '¿Cómo se registran las devoluciones de stock?', a: 'Si cancela una venta o elimina ítems antes de facturar, el inventario se mantiene intacto. Si realiza una venta, el stock se reduce automáticamente y registra un movimiento de tipo Salida en el Kardex.' },
                    { q: '¿Es posible usar el sistema sin conexión a internet?', a: 'Sí, la aplicación está diseñada para funcionar localmente. Las bases de datos se guardan directamente en el equipo del comercio.' }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                      <h4 className="font-bold text-xs text-emerald-300 font-semibold">Q: {item.q}</h4>
                      <p className="text-xs text-white/60 leading-relaxed font-normal">{item.a}</p>
                    </div>
                  ))}
                </div>
              )}

              {helpTab === 'support' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => window.open('https://wa.me/59177777777', '_blank')}
                      className="p-4 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-center transition-all group cursor-pointer"
                    >
                      <span className="block text-lg mb-1 group-hover:scale-110 transition-transform">💬</span>
                      <strong className="block text-xs text-white">Soporte WhatsApp</strong>
                      <span className="text-[10px] text-white/40">+591 777 777 77</span>
                    </button>

                    <button 
                      onClick={() => window.open('mailto:soporte@pos.com', '_blank')}
                      className="p-4 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl text-center transition-all group cursor-pointer"
                    >
                      <span className="block text-lg mb-1 group-hover:scale-110 transition-transform">🛠️</span>
                      <strong className="block text-xs text-white">Correo Técnico</strong>
                      <span className="text-[10px] text-white/40">soporte@pos.com</span>
                    </button>
                  </div>

                  {/* ABOUT & LICENSE INFO */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Award size={14} className="text-amber-400" />
                      Información de Licencia del Sistema
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed font-normal">
                      Este software está licenciado para uso comercial. Todos los derechos reservados. Queda prohibida la redistribución o copia no autorizada.
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-white/40 font-mono pt-1">
                      <span>Versión: 2.0 (Build 2026.06)</span>
                      <span>Licencia: Activa y Validada</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center text-[10px] text-white/30">
              <span>Desarrollado para gestión eficiente de comercios.</span>
              <span>POS v2.0 © 2026</span>
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

