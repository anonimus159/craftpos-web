import React, { useState, useRef } from 'react';
import { usePOSStore } from '../store/store';
import { Product } from '../types/types';
import { 
  Plus, ArrowDown, ArrowUp, AlertCircle, Edit, Trash2, 
  Search, ShieldAlert, TrendingUp, Package, RefreshCw, Layers,
  Upload, Download, FileSpreadsheet, AlertTriangle, Check, X
} from 'lucide-react';

export default function InventarioModule() {
  const {
    currentModule,
    products,
    suppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    purchaseFromSupplier,
    addLog,
    ingredientsStock,
    productionBatches,
    mermaLogs,
    warehouseTransfers,
    addMermaLog,
    addWarehouseTransfer,
    addProductionBatch,
    executeProductionBatch,
    adjustIngredientStock,
    categories: storeCategories,
    addCategory,
    deleteCategory,
    renameCategory,
    appConfig
  } = usePOSStore();

  const sym = appConfig.currencySymbol || "S/";

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'ingredients' | 'production' | 'mermas' | 'transfers' | 'lots' | 'categories' | 'bulk-edit'>('products');

  // Barcode Generator Modal State
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Category Renaming Local State
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renamingCatValue, setRenamingCatValue] = useState('');
  
  // Category Deleting Local Confirmation State
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // Bulk Edit State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkEditFields, setBulkEditFields] = useState({
    costPrice: '',
    salePrice: '',
    wholesalePrice: '',
    stock: '',
    category: ''
  });
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Modals
  const [showAddMermaModal, setShowAddMermaModal] = useState(false);
  const [showAddProductionModal, setShowAddProductionModal] = useState(false);
  const [showAddTransferModal, setShowAddTransferModal] = useState(false);
  const [showAdjustIngredientModal, setShowAdjustIngredientModal] = useState(false);

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResults, setImportResults] = useState<{
    imported: number;
    errors: { row: number; sku: string; reason: string }[];
    preview: any[];
  } | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const importFileRef = useRef<HTMLInputElement>(null);

  // Ingredient Adjustment State
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null);
  const [adjustIngredientQty, setAdjustIngredientQty] = useState('1000');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    barcode: '',
    sku: '',
    costPrice: 0.0,
    salePrice: 0.0,
    wholesalePrice: 0.0,
    stock: 0,
    minStock: 5,
    maxStock: 100,
    description: '',
    isControlled: false,
    genericEquivalent: '',
    expirationDate: '',
    lotNumber: '',
    isBulk: false,
    trackInventory: true,
    imageUrl: '',
    supplierId: ''
  });

  const [adjustData, setAdjustData] = useState({
    qty: 1,
    type: 'in' as 'in' | 'out',
    concept: 'Ajuste manual de inventario'
  });

  const [restockData, setRestockData] = useState({
    supplierId: '',
    qty: 10,
    costPrice: 0.0
  });

  // Merma Form State
  const [mermaForm, setMermaForm] = useState({
    productName: '',
    qty: 1,
    unit: 'u',
    concept: 'dañado',
    cost: 1.00
  });

  // Production Form State
  const [productionForm, setProductionForm] = useState({
    productName: '',
    quantity: 10,
    cost: 5.00
  });

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    productName: '',
    qty: 5,
    fromWarehouse: 'Bodega Central',
    toWarehouse: 'Bodega Auxiliar'
  });

  // Filter products by current active vertical
  const filteredProducts = products
    .filter(p => p.storeType === currentModule)
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });

  // Categories list
  const activeCategories = Array.from(new Set([
    ...(storeCategories[currentModule] || []),
    ...products.filter(p => p.storeType === currentModule).map(p => p.category)
  ])).filter(Boolean);
  const categories = ['All', ...activeCategories];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;
    
    addProduct({
      ...newProduct,
      storeType: currentModule as any,
      isControlled: currentModule === 'pharmacy' ? newProduct.isControlled : undefined,
      genericEquivalent: currentModule === 'pharmacy' && newProduct.genericEquivalent ? newProduct.genericEquivalent : undefined,
    });

    setNewProduct({
      name: '',
      category: '',
      barcode: '',
      sku: '',
      costPrice: 0.0,
      salePrice: 0.0,
      wholesalePrice: 0.0,
      stock: 0,
      minStock: 5,
      maxStock: 100,
      description: '',
      isControlled: false,
      genericEquivalent: '',
      expirationDate: '',
      lotNumber: '',
      isBulk: false,
      trackInventory: true,
      imageUrl: '',
      supplierId: ''
    });
    setShowAddModal(false);
    showToast('Producto creado con éxito.');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditingProduct(prev => prev ? ({ ...prev, imageUrl: base64String }) : null);
      } else {
        setNewProduct(prev => ({ ...prev, imageUrl: base64String }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.sku) return;
    updateProduct(editingProduct);
    setShowEditModal(false);
    setEditingProduct(null);
    showToast('Producto actualizado con éxito.');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    adjustStock(selectedProduct.id, adjustData.qty, adjustData.type, adjustData.concept);
    setShowAdjustModal(false);
    setSelectedProduct(null);
    showToast('Stock ajustado con éxito.');
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !restockData.supplierId) return;
    purchaseFromSupplier(restockData.supplierId, selectedProduct.id, restockData.qty, restockData.costPrice);
    setShowRestockModal(false);
    setSelectedProduct(null);
    showToast('Compra registrada y stock actualizado.');
  };

  // ============================================================
  // EXCEL IMPORT HANDLER with SKU duplicate validation
  // ============================================================
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        showToast('El archivo no tiene datos suficientes.', 'error');
        return;
      }

      // Parse CSV header (support comma or semicolon)
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/["']/g, ''));

      // Find column indices
      const colIdx = (names: string[]) => {
        for (const n of names) {
          const i = headers.indexOf(n);
          if (i >= 0) return i;
        }
        return -1;
      };

      const skuCol = colIdx(['sku', 'codigo', 'código', 'code', 'ref', 'referencia']);
      const nameCol = colIdx(['nombre', 'name', 'producto', 'descripcion', 'descripción']);
      const priceCol = colIdx(['precio', 'price', 'precioventa', 'precio_venta', 'saleprice', 'pvp']);
      const costCol = colIdx(['costo', 'cost', 'costoprecio', 'costo_precio', 'costprice']);
      const stockCol = colIdx(['stock', 'cantidad', 'qty', 'quantity', 'existencia']);
      const categoryCol = colIdx(['categoria', 'categoría', 'category', 'cat']);
      const barcodeCol = colIdx(['barcode', 'codigobarra', 'codigo_barra', 'barra', 'ean']);
      const minStockCol = colIdx(['stockmin', 'stock_min', 'minstock', 'min_stock', 'minimo']);

      if (skuCol === -1 || nameCol === -1 || priceCol === -1) {
        showToast('El archivo debe tener columnas: SKU, Nombre/Producto, Precio', 'error');
        return;
      }

      const rows = lines.slice(1).map((line, idx) => {
        const cells = line.split(separator).map(c => c.trim().replace(/["']/g, ''));
        return {
          row: idx + 2,
          sku: cells[skuCol] || '',
          name: cells[nameCol] || '',
          salePrice: parseFloat(cells[priceCol]) || 0,
          costPrice: parseFloat(costCol >= 0 ? cells[costCol] : '0') || 0,
          stock: parseInt(stockCol >= 0 ? cells[stockCol] : '0') || 0,
          category: categoryCol >= 0 ? cells[categoryCol] : 'General',
          barcode: barcodeCol >= 0 ? cells[barcodeCol] : '',
          minStock: parseInt(minStockCol >= 0 ? cells[minStockCol] : '5') || 5,
        };
      });

      setImportPreviewData(rows);
      setImportStep('preview');
      setShowImportModal(true);
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleConfirmImport = () => {
    const errors: { row: number; sku: string; reason: string }[] = [];
    let imported = 0;

    for (const row of importPreviewData) {
      // Validation 1: SKU required
      if (!row.sku || row.sku.trim() === '') {
        errors.push({
          row: row.row,
          sku: '(vacío)',
          reason: 'El campo SKU/Código está vacío. Cada producto debe tener un código único.',
        });
        continue;
      }

      // Validation 2: SKU already exists in system
      const existingProduct = products.find(
        p => p.sku.toLowerCase().trim() === row.sku.toLowerCase().trim()
      );
      if (existingProduct) {
        errors.push({
          row: row.row,
          sku: row.sku,
          reason: `⚠️ El código SKU "${row.sku}" ya existe en el sistema (Producto: "${existingProduct.name}"). Se ignoró esta fila para no sobreescribir datos existentes.`,
        });
        continue;
      }

      // Validation 3: Name required
      if (!row.name || row.name.trim() === '') {
        errors.push({
          row: row.row,
          sku: row.sku,
          reason: 'El campo Nombre/Producto está vacío.',
        });
        continue;
      }

      // Validation 4: Price must be positive
      if (row.salePrice <= 0) {
        errors.push({
          row: row.row,
          sku: row.sku,
          reason: `El precio de venta es 0 o inválido (${row.salePrice}). Debe ser mayor a 0.`,
        });
        continue;
      }

      // All validations passed - add product
      addProduct({
        name: row.name.trim(),
        category: row.category || 'General',
        barcode: row.barcode || '',
        sku: row.sku.trim().toUpperCase(),
        costPrice: row.costPrice,
        salePrice: row.salePrice,
        stock: row.stock,
        minStock: row.minStock,
        description: '',
        storeType: currentModule as any,
        trackInventory: true,
        active: true,
      });
      imported++;
    }

    setImportResults({ imported, errors, preview: importPreviewData });
    setImportStep('done');
    if (imported > 0) showToast(`✓ ${imported} producto(s) importado(s) correctamente.`, 'success');
  };

  const handleDownloadTemplate = () => {
    const csv = 'SKU,Nombre,Categoria,Barcode,Precio,Costo,Stock,StockMin\nPROD-001,Ejemplo Producto,General,1234567890123,15.00,10.00,50,5\nPROD-002,Otro Producto,Bebidas,9876543210987,8.50,5.00,100,10';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_importar_productos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white border border-slate-200 shadow-sm border border-slate-200 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU, barra..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-zinc-500 outline-none w-[240px]"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer font-bold"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'Todas las Categorías' : cat}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {activeSubTab === 'mermas' && (
            <button
              onClick={() => {
                setMermaForm({ productName: filteredProducts[0]?.name || '', qty: 1, unit: 'u', concept: 'dañado', cost: 1.00 });
                setShowAddMermaModal(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-red-950/20"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Merma</span>
            </button>
          )}

          {activeSubTab === 'production' && (
            <button
              onClick={() => {
                setProductionForm({ productName: filteredProducts[0]?.name || '', quantity: 10, cost: 5.00 });
                setShowAddProductionModal(true);
              }}
              className="px-4 py-2 bg-indigo-65 hover:bg-indigo-70 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/20"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Producción</span>
            </button>
          )}

          {activeSubTab === 'transfers' && (
            <button
              onClick={() => {
                setTransferForm({ productName: filteredProducts[0]?.name || '', qty: 5, fromWarehouse: 'Bodega Central', toWarehouse: 'Bodega Auxiliar' });
                setShowAddTransferModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Transferencia</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-650 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto [ALT+A]</span>
          </button>

          {/* IMPORTAR EXCEL */}
          <button
            onClick={() => { setImportStep('upload'); setImportResults(null); setImportPreviewData([]); setShowImportModal(true); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel/CSV</span>
          </button>
          <input ref={importFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleExcelFileSelect} />
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 w-full overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveSubTab('products')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'products'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📦 Catálogo de Productos
        </button>
        
        {(currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit') && (
          <button
            onClick={() => setActiveSubTab('ingredients')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'ingredients'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🌾 Recetas e Insumos
          </button>
        )}

        {(currentModule === 'bakery' || currentModule === 'restaurant') && (
          <button
            onClick={() => setActiveSubTab('production')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'production'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Planificación Diaria
          </button>
        )}

        {(currentModule === 'fruit' || currentModule === 'restaurant' || currentModule === 'bakery') && (
          <button
            onClick={() => setActiveSubTab('mermas')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'mermas'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🗑️ Registro de Mermas
          </button>
        )}

        {(currentModule === 'business' || currentModule === 'pharmacy') && (
          <button
            onClick={() => setActiveSubTab('transfers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'transfers'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🏢 Transferencias y Kardex
          </button>
        )}

        {(currentModule === 'pharmacy' || currentModule === 'fruit') && (
          <button
            onClick={() => setActiveSubTab('lots')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'lots'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚠️ Lotes y Vencimientos
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'categories'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🏷️ Categorías
        </button>

        <button
          onClick={() => setActiveSubTab('bulk-edit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'bulk-edit'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          ✏️ Edición Masiva
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}
      <div className="bg-white border border-slate-200 shadow-sm border border-slate-200 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
        
        {activeSubTab === 'products' && (
          <>
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <Package className="w-4 h-4 text-emerald-500" />
              <span>Administración de Stock ({currentModule.toUpperCase()})</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">SKU / Ref</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">C. Compra</th>
                    <th className="p-3 text-right">P. Venta</th>
                    <th className="p-3 text-right">Margen</th>
                    <th className="p-3 text-center">Stock Actual</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Operaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-mono">
                        No se registran productos en este módulo. Haz clic en "Agregar Producto" para comenzar.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const margin = p.salePrice - p.costPrice;
                      const marginPct = (margin / p.salePrice) * 100;
                      
                      let stockStatus = 'Normal';
                      let statusColor = 'text-green-600 bg-green-50 border-green-200';

                      if (p.stock === 0) {
                        stockStatus = 'Agotado';
                        statusColor = 'text-red-650 bg-red-50 border-red-200 animate-pulse';
                      } else if (p.stock <= p.minStock) {
                        stockStatus = 'Bajo Stock';
                        statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono text-slate-500">{p.sku}</td>
                          <td className="p-3">
                            <div>
                              <div className="font-semibold text-slate-800">{p.name}</div>
                              {p.barcode && <div className="text-[10px] text-slate-400 font-mono">Cod: {p.barcode}</div>}
                              {p.isControlled && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-red-55 border border-red-200 text-[9px] text-red-600 rounded font-bold">
                                  Receta Archivada
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-slate-500">{p.category}</td>
                          <td className="p-3 text-right font-mono text-slate-700">{sym} {p.costPrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-slate-850">{sym} {p.salePrice.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono">
                            <div className="text-slate-800">{sym} {margin.toFixed(2)}</div>
                            <div className="text-[10px] text-emerald-600 flex items-center justify-end gap-0.5 font-bold">
                              <TrendingUp className="w-2.5 h-2.5" />
                              <span>{marginPct.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-850">{p.stock}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                              {stockStatus}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setAdjustData({ qty: 1, type: 'in', concept: 'Ajuste manual de inventario' });
                                  setShowAdjustModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-white border border-slate-250 text-slate-600 hover:text-slate-850 hover:bg-slate-50 cursor-pointer text-[10px] font-bold"
                                title="Entrada / Salida de mercancía"
                              >
                                Ajustar Stock
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setRestockData({ supplierId: suppliers[0]?.id || '', qty: 20, costPrice: p.costPrice });
                                  setShowRestockModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-250 text-[10px] text-emerald-700 hover:bg-emerald-100 cursor-pointer font-bold"
                                title="Comprar restock a Proveedor"
                              >
                                Abastecer
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBarcodeProduct(p);
                                  setShowBarcodeModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] text-slate-750 hover:bg-slate-200 cursor-pointer font-bold"
                                title="Generar código de barras"
                              >
                                Barcode
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setShowEditModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 text-[10px] text-indigo-700 hover:bg-indigo-100 cursor-pointer font-bold"
                                title="Editar detalles de producto"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-[10px] text-rose-700 hover:bg-rose-100 cursor-pointer font-bold"
                                title="Eliminar producto"
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
          </>
        )}

        {activeSubTab === 'ingredients' && (
          <>
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <Package className="w-4 h-4 text-indigo-500" />
              <span>Insumos y Recetarios de Producción</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Insumo</th>
                    <th className="p-3 text-center">Unidad</th>
                    <th className="p-3 text-right">Costo Unitario</th>
                    <th className="p-3 text-center">Stock Disponible</th>
                    <th className="p-3 text-center">Operaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                  {ingredientsStock.map((ing) => (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <strong className="text-slate-800">{ing.name}</strong>
                        <p className="text-[10px] text-slate-400">ID Insumo: {ing.id}</p>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">{ing.unit}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{sym} {ing.costPrice.toFixed(4)}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-800">{ing.stock}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1.5">
                           <button
                             onClick={() => {
                               setSelectedIngredient(ing);
                               setAdjustIngredientQty('1000');
                               setShowAdjustIngredientModal(true);
                             }}
                             className="px-2.5 py-1 rounded bg-white border border-slate-250 text-[10px] text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                           >
                             Ajustar Cantidad
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSubTab === 'production' && (
          <>
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin-slow" />
              <span>Planificador de Lotes de Producción y Cocina</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Lote ID</th>
                    <th className="p-3">Fecha Planificada</th>
                    <th className="p-3">Producto Destino</th>
                    <th className="p-3 text-center">Cantidad Programada</th>
                    <th className="p-3 text-right">Costo Estimado</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                  {productionBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono text-slate-400 font-bold">{batch.id}</td>
                      <td className="p-3">{batch.date}</td>
                      <td className="p-3">
                        <strong className="text-slate-800">{batch.productName}</strong>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-850">{batch.quantity}</td>
                      <td className="p-3 text-right font-mono">{sym} {batch.cost.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          batch.status === 'done' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {batch.status === 'done' ? 'Ejecutado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {batch.status === 'scheduled' && (
                          <button
                            onClick={() => {
                              executeProductionBatch(batch.id);
                              showToast('Lote de producción procesado con éxito. Se han descontado los insumos del inventario.');
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-[10px] cursor-pointer"
                          >
                            ✓ Procesar Batch
                          </button>
                        )}
                        {batch.status === 'done' && (
                          <span className="text-[10px] text-slate-400 font-bold font-mono">Completado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSubTab === 'mermas' && (
          <>
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Libro Registro de Mermas y Desechos</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">ID Registro</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Producto / Fruta</th>
                    <th className="p-3 text-center">Cant. Desechada</th>
                    <th className="p-3 text-center">Motivo / Concepto</th>
                    <th className="p-3 text-right">Pérdida Económica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                  {mermaLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{log.id}</td>
                      <td className="p-3">{log.date}</td>
                      <td className="p-3 text-slate-800 font-bold">{log.productName}</td>
                      <td className="p-3 text-center font-mono font-bold">{log.qty} {log.unit}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.concept === 'vencido' 
                            ? 'bg-red-50 border-red-200 text-red-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {log.concept.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-red-650 font-bold">{sym} {log.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSubTab === 'transfers' && (
          <>
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              <span>Kardex: Transferencias entre Bodegas y Sucursales</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3 text-center">Cantidad</th>
                    <th className="p-3">Origen</th>
                    <th className="p-3">Destino</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                  {warehouseTransfers.map((wt) => (
                    <tr key={wt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{wt.id}</td>
                      <td className="p-3">{wt.date}</td>
                      <td className="p-3 text-slate-800 font-bold">{wt.productName}</td>
                      <td className="p-3 text-center font-mono font-bold">{wt.qty}</td>
                      <td className="p-3">{wt.fromWarehouse}</td>
                      <td className="p-3">{wt.toWarehouse}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-green-50 border-green-200 text-green-700">
                          {wt.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSubTab === 'lots' && (
          <>
            <h3 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Semáforo de Vencimiento de Lotes</span>
            </h3>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Lote Nro</th>
                    <th className="p-3">Nombre Producto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-center">Vencimiento</th>
                    <th className="p-3 text-center font-bold">Estado Crítico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium">
                  {filteredProducts
                    .filter(p => p.expirationDate || p.lotNumber)
                    .map((p) => {
                      const expDate = p.expirationDate ? new Date(p.expirationDate) : null;
                      const today = new Date();
                      
                      let lotState = 'Válido';
                      let lotColor = 'text-green-600 bg-green-50 border-green-200';
                      
                      if (expDate) {
                        const diffTime = expDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 0) {
                          lotState = 'VENCIDO';
                          lotColor = 'text-red-650 bg-red-50 border-red-200 font-black animate-pulse';
                        } else if (diffDays <= 30) {
                          lotState = `Próximo a Vencer (${diffDays} días)`;
                          lotColor = 'text-amber-700 bg-amber-50 border-amber-200 font-bold';
                        }
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-800">{p.lotNumber || 'SIN LOTE'}</td>
                          <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                          <td className="p-3 text-slate-500">{p.category}</td>
                          <td className="p-3 text-center font-mono text-slate-600 font-bold">{p.expirationDate || 'S/F'}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-xl text-[10px] border ${lotColor}`}>
                              {lotState}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {filteredProducts.filter(p => p.expirationDate || p.lotNumber).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-mono">
                        No hay productos registrados con lotes o fechas de vencimiento activos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSubTab === 'categories' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Gestión de Categorías ({currentModule.toUpperCase()})</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Crea y modifica las categorías que agrupan tus productos.</p>
              </div>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const input = target.elements.namedItem('newCatInput') as HTMLInputElement;
                  const name = input.value.trim();
                  if (name) {
                    addCategory(currentModule, name);
                    input.value = '';
                    showToast(`Categoría "${name}" agregada.`);
                  }
                }}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <input
                  type="text"
                  name="newCatInput"
                  required
                  placeholder="Ej. Bebidas Frías"
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none w-full sm:w-48 text-slate-800 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
                >
                  Agregar
                </button>
              </form>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Nombre Categoría</th>
                    <th className="p-3 text-center">Productos Asociados</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeCategories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-medium">
                        No hay categorías registradas para este rubro.
                      </td>
                    </tr>
                  ) : (
                    activeCategories.map((catName) => {
                      const count = products.filter(p => p.storeType === currentModule && p.category === catName).length;
                      return (
                        <tr key={catName} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            {renamingCat === catName ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={renamingCatValue}
                                  onChange={(e) => setRenamingCatValue(e.target.value)}
                                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-850 font-bold focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => {
                                    if (renamingCatValue.trim() && renamingCatValue.trim() !== catName) {
                                      renameCategory(currentModule, catName, renamingCatValue.trim());
                                      showToast(`Categoría renombrada.`);
                                    }
                                    setRenamingCat(null);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-emerald-700"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setRenamingCat(null)}
                                  className="px-2.5 py-1.5 bg-slate-200 text-slate-650 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-350"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-slate-900">{catName}</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500">{count}</td>
                          <td className="p-3 text-center">
                            {catToDelete === catName ? (
                              <div className="flex justify-center items-center gap-2">
                                <span className="text-rose-600 font-bold text-[10px]">¿Confirmar eliminación?</span>
                                <button
                                  onClick={() => {
                                    deleteCategory(currentModule, catName);
                                    setCatToDelete(null);
                                    showToast(`Categoría eliminada.`, 'error');
                                  }}
                                  className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={() => setCatToDelete(null)}
                                  className="px-2 py-1 bg-slate-200 text-slate-650 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setRenamingCat(catName);
                                    setRenamingCatValue(catName);
                                  }}
                                  className="px-2.5 py-1 text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold cursor-pointer"
                                >
                                  Renombrar
                                </button>
                                <button
                                  onClick={() => setCatToDelete(catName)}
                                  className="px-2.5 py-1 text-[10px] bg-rose-50 border border-rose-250 text-rose-700 rounded-lg hover:bg-rose-100 font-bold cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
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

        {activeSubTab === 'bulk-edit' && (
          <div className="flex flex-col gap-4">
            
            {/* BULK EDIT CONTROLS */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">✏️ Edición Masiva de Productos</h4>
                <span className="text-[10px] text-slate-500 font-mono font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-sm">
                  {selectedProductIds.length} productos seleccionados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Costo ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sin cambios"
                    value={bulkEditFields.costPrice}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, costPrice: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Precio Venta ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sin cambios"
                    value={bulkEditFields.salePrice}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, salePrice: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Precio Mayoreo ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sin cambios"
                    value={bulkEditFields.wholesalePrice}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, wholesalePrice: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ajustar Stock (Absoluto)</label>
                  <input
                    type="number"
                    placeholder="Sin cambios"
                    value={bulkEditFields.stock}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Cambiar Categoría</label>
                  <select
                    value={bulkEditFields.category}
                    onChange={(e) => setBulkEditFields(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold cursor-pointer"
                  >
                    <option value="">Sin cambios</option>
                    {activeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductIds([]);
                    setBulkEditFields({ costPrice: '', salePrice: '', wholesalePrice: '', stock: '', category: '' });
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-550 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Deseleccionar Todos
                </button>
                <button
                  type="button"
                  disabled={selectedProductIds.length === 0}
                  onClick={() => {
                    const cost = parseFloat(bulkEditFields.costPrice);
                    const sale = parseFloat(bulkEditFields.salePrice);
                    const wholesale = parseFloat(bulkEditFields.wholesalePrice);
                    const stockVal = parseInt(bulkEditFields.stock);
                    const category = bulkEditFields.category;

                    selectedProductIds.forEach(id => {
                      const prod = products.find(p => p.id === id);
                      if (prod) {
                        const updated: Product = {
                          ...prod,
                          costPrice: !isNaN(cost) ? cost : prod.costPrice,
                          salePrice: !isNaN(sale) ? sale : prod.salePrice,
                          wholesalePrice: !isNaN(wholesale) ? wholesale : prod.wholesalePrice,
                          stock: !isNaN(stockVal) ? stockVal : prod.stock,
                          category: category ? category : prod.category
                        };
                        updateProduct(updated);
                      }
                    });

                    setSelectedProductIds([]);
                    setBulkEditFields({ costPrice: '', salePrice: '', wholesalePrice: '', stock: '', category: '' });
                    showToast(`Cambios masivos aplicados con éxito.`);
                  }}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar Cambios Masivos
                </button>
              </div>
            </div>

            {/* SELECTION PRODUCT TABLE */}
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === products.filter(p => p.storeType === currentModule).length && products.filter(p => p.storeType === currentModule).length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(products.filter(p => p.storeType === currentModule).map(p => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="w-4 h-4 cursor-pointer accent-indigo-600"
                      />
                    </th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">SKU / Ref</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Costo</th>
                    <th className="p-3 text-right">Precio Venta</th>
                    <th className="p-3 text-right">Precio Mayoreo</th>
                    <th className="p-3 text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {products.filter(p => p.storeType === currentModule).map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${isChecked ? 'bg-indigo-50/15' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds(prev => [...prev, p.id]);
                              } else {
                                setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 cursor-pointer accent-indigo-600"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-850">{p.name}</td>
                        <td className="p-3 font-mono font-bold text-slate-450">{p.sku}</td>
                        <td className="p-3 text-slate-500 font-semibold">{p.category}</td>
                        <td className="p-3 text-right font-mono">{sym} {p.costPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{sym} {p.salePrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-mono text-slate-500">{sym} {(p.wholesalePrice || p.salePrice).toFixed(2)}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">{p.stock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: ADD PRODUCT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Package className="w-5 h-5 text-emerald-500" />
              <span>Nuevo Producto ({currentModule.toUpperCase()})</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-700 max-h-[85vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                    placeholder="Ej. Medialunas de dulce"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Categoría</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  >
                    <option value="">-- Seleccionar --</option>
                    {activeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Escribir nueva categoría..."
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-800 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">SKU / Referencia</label>
                  <input
                    type="text"
                    required
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                    placeholder="Ej. B-FAC-03"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                    placeholder="Ej. 3007"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Costo ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.costPrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0.0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Precio Venta ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.salePrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0.0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Precio Mayoreo ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProduct.wholesalePrice}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, wholesalePrice: parseFloat(e.target.value) || 0.0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Min Stock</label>
                  <input
                    type="number"
                    required
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Max Stock</label>
                  <input
                    type="number"
                    value={newProduct.maxStock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 100 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 py-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addIsBulk"
                    checked={newProduct.isBulk}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, isBulk: e.target.checked }))}
                    className="w-4 h-4 cursor-pointer accent-indigo-650"
                  />
                  <label htmlFor="addIsBulk" className="text-slate-700 cursor-pointer font-bold select-none">¿Venta a Granel?</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addTrackInventory"
                    checked={newProduct.trackInventory}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, trackInventory: e.target.checked }))}
                    className="w-4 h-4 cursor-pointer accent-indigo-650"
                  />
                  <label htmlFor="addTrackInventory" className="text-slate-700 cursor-pointer font-bold select-none">Controlar Stock</label>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer"
                />
                {newProduct.imageUrl && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden">
                    <img src={newProduct.imageUrl} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Pharmacy Special Rules */}
              {currentModule === 'pharmacy' && (
                <div className="border-t border-slate-200 pt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-semibold">¿Requiere Receta Médica?</label>
                    <input
                      type="checkbox"
                      checked={newProduct.isControlled}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, isControlled: e.target.checked }))}
                      className="w-4 h-4 cursor-pointer accent-red-650"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Equivalente Genérico (Nombre)</label>
                    <input
                      type="text"
                      value={newProduct.genericEquivalent}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, genericEquivalent: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                      placeholder="Ej. Paracetamol 500mg"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-emerald-950/20"
                >
                  Crear Producto
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUST (IN/OUT) */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              <span>Ajuste de Stock Manual</span>
            </h3>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex justify-between items-center font-semibold">
              <span className="text-slate-500">Producto:</span>
              <span className="text-slate-800 font-bold">{selectedProduct.name} (Stock: {selectedProduct.stock})</span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Tipo de Ajuste</label>
                  <select
                    value={adjustData.type}
                    onChange={(e) => setAdjustData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="in">⬆ Entrada (+) </option>
                    <option value="out">⬇ Salida (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={adjustData.qty}
                    onChange={(e) => setAdjustData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Concepto / Motivo</label>
                <input
                  type="text"
                  required
                  value={adjustData.concept}
                  onChange={(e) => setAdjustData(prev => ({ ...prev, concept: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  placeholder="Ej. Devolución de mercadería / Rotura"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-amber-950/20"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: RESTOCK FROM SUPPLIER */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <ArrowDown className="w-5 h-5 text-emerald-500 animate-bounce" />
              <span>Orden de Compra / Abastecimiento</span>
            </h3>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex justify-between items-center font-semibold">
              <span className="text-slate-500">Abastecer:</span>
              <span className="text-slate-800 font-bold">{selectedProduct.name}</span>
            </div>

            <form onSubmit={handleRestockSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-700">
              
              <div>
                <label className="block text-slate-400 mb-1">Proveedor Autorizado</label>
                <select
                  required
                  value={restockData.supplierId}
                  onChange={(e) => setRestockData(prev => ({ ...prev, supplierId: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                >
                  <option value="" disabled>Seleccione Proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.companyName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad a Comprar</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={restockData.qty}
                    onChange={(e) => setRestockData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Costo Unitario Compra ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={restockData.costPrice}
                    onChange={(e) => setRestockData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0.0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-850 font-mono outline-none font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Total a Facturar:</span>
                <strong className="text-slate-900 font-mono text-sm font-black">{sym} {(restockData.qty * restockData.costPrice).toFixed(2)}</strong>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRestockModal(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Registrar Compra y Recibir
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: ADD MERMA */}
      {showAddMermaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              <span>Registrar Desperdicio o Merma de Stock</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!mermaForm.productName) {
                  showToast('Por favor ingrese el nombre del producto.', 'error');
                  return;
                }
                addMermaLog({
                  date: new Date().toISOString().split('T')[0],
                  productName: mermaForm.productName,
                  qty: mermaForm.qty,
                  unit: mermaForm.unit,
                  concept: mermaForm.concept,
                  cost: mermaForm.cost
                });
                setMermaForm({
                  productName: '',
                  qty: 1,
                  unit: 'u',
                  concept: 'dañado',
                  cost: 1.00
                });
                showToast('Merma registrada y stock descontado con éxito.');
                setShowAddMermaModal(false);
              }}
              className="flex flex-col gap-3 font-semibold text-xs text-slate-700"
            >
              <div>
                <label className="block text-slate-400 mb-1">Seleccionar Producto del Rubro</label>
                <select
                  required
                  value={mermaForm.productName}
                  onChange={(e) => {
                    const prodName = e.target.value;
                    const p = products.find(prod => prod.name === prodName);
                    setMermaForm(prev => ({ 
                      ...prev, 
                      productName: prodName,
                      cost: p ? p.costPrice * prev.qty : prev.cost
                    }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.name}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad Merma</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={mermaForm.qty}
                    onChange={(e) => {
                      const qtyVal = parseInt(e.target.value) || 1;
                      const p = products.find(prod => prod.name === mermaForm.productName);
                      setMermaForm(prev => ({ 
                        ...prev, 
                        qty: qtyVal,
                        cost: p ? p.costPrice * qtyVal : prev.cost
                      }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Unidad</label>
                  <input
                    type="text"
                    required
                    value={mermaForm.unit}
                    onChange={(e) => setMermaForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                    placeholder="u, kg, g, ml"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pérdida ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={mermaForm.cost}
                    onChange={(e) => setMermaForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0.0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Motivo / Concepto</label>
                <select
                  value={mermaForm.concept}
                  onChange={(e) => setMermaForm(prev => ({ ...prev, concept: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="dañado">Dañado / Roto</option>
                  <option value="vencido">Vencido / Caducado</option>
                  <option value="desperdicio">Desperdicio de Preparación</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end mt-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMermaModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-655 hover:bg-red-750 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20"
                >
                  Confirmar Merma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCTION BATCH */}
      {showAddProductionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin-slow" />
              <span>Programar Lote de Producción Diaria</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!productionForm.productName) {
                  showToast('Por favor ingrese el nombre del producto.', 'error');
                  return;
                }
                addProductionBatch({
                  date: new Date().toISOString().split('T')[0],
                  productName: productionForm.productName,
                  quantity: productionForm.quantity,
                  cost: productionForm.cost,
                  status: 'scheduled'
                });
                setProductionForm({
                  productName: '',
                  quantity: 10,
                  cost: 5.00
                });
                showToast('Lote de producción agendado con éxito.');
                setShowAddProductionModal(false);
              }}
              className="flex flex-col gap-3 font-semibold text-xs text-slate-700"
            >
              <div>
                <label className="block text-slate-400 mb-1">Seleccionar Producto a Fabricar</label>
                <select
                  required
                  value={productionForm.productName}
                  onChange={(e) => {
                    const prodName = e.target.value;
                    const p = products.find(prod => prod.name === prodName);
                    setProductionForm(prev => ({ 
                      ...prev, 
                      productName: prodName,
                      cost: p ? p.costPrice * prev.quantity : prev.cost
                    }));
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad a Producir</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productionForm.quantity}
                    onChange={(e) => {
                      const qtyVal = parseInt(e.target.value) || 1;
                      const p = products.find(prod => prod.name === productionForm.productName);
                      setProductionForm(prev => ({ 
                        ...prev, 
                        quantity: qtyVal,
                        cost: p ? p.costPrice * qtyVal : prev.cost
                      }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-805 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Costo Estimado Producción ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productionForm.cost}
                    onChange={(e) => setProductionForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0.0 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-xl text-[10px] leading-relaxed font-medium">
                ⚠️ Al ejecutar este lote en la tabla de planificación, el sistema deducirá automáticamente las materias primas/ingredientes proporcionales de tu inventario base de insumos.
              </div>

              <div className="flex gap-3 justify-end mt-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductionModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-indigo-950/20"
                >
                  Agendar Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TRANSFER */}
      {showAddTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Transferencia de Stock entre Bodegas / Kardex</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!transferForm.productName || transferForm.fromWarehouse === transferForm.toWarehouse) {
                  showToast('La bodega origen y destino deben ser distintas.', 'error');
                  return;
                }
                
                const qtyVal = transferForm.qty;
                const p = products.find(prod => prod.name === transferForm.productName);
                if (!p || p.stock < qtyVal) {
                  showToast('El stock global es insuficiente para realizar el traslado.', 'error');
                  return;
                }

                addWarehouseTransfer({
                  date: new Date().toISOString().split('T')[0],
                  productName: transferForm.productName,
                  qty: qtyVal,
                  fromWarehouse: transferForm.fromWarehouse,
                  toWarehouse: transferForm.toWarehouse,
                  status: 'completado'
                });
                
                adjustStock(p.id, qtyVal, 'out', `Traslado de ${transferForm.fromWarehouse} a ${transferForm.toWarehouse}`);
                
                setTransferForm({
                  productName: '',
                  qty: 5,
                  fromWarehouse: 'Bodega Central',
                  toWarehouse: 'Bodega Auxiliar'
                });
                showToast('Transferencia de stock registrada y Kardex actualizado.');
                setShowAddTransferModal(false);
              }}
              className="flex flex-col gap-3 font-semibold text-xs text-slate-700"
            >
              <div>
                <label className="block text-slate-400 mb-1">Seleccionar Producto a Transferir</label>
                <select
                  required
                  value={transferForm.productName}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, productName: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                >
                  <option value="" disabled>Seleccione producto...</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.name}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Cantidad</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={transferForm.qty}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Origen</label>
                  <select
                    value={transferForm.fromWarehouse}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, fromWarehouse: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                  >
                    <option value="Bodega Central">Bodega Central</option>
                    <option value="Bodega Auxiliar">Bodega Auxiliar</option>
                    <option value="Bodega Exhibición">Bodega Exhibición</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Destino</label>
                  <select
                    value={transferForm.toWarehouse}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, toWarehouse: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer font-bold"
                  >
                    <option value="Bodega Auxiliar">Bodega Auxiliar</option>
                    <option value="Bodega Central">Bodega Central</option>
                    <option value="Bodega Exhibición">Bodega Exhibición</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
                >
                  Ejecutar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: EDIT PRODUCT */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Package className="w-5 h-5 text-indigo-500" />
              <span>Editar Producto ({currentModule.toUpperCase()})</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3 font-semibold text-xs text-slate-700 max-h-[85vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  >
                    <option value="">-- Seleccionar --</option>
                    {activeCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Escribir nueva categoría..."
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-800 mt-1 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SKU / Referencia</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, sku: e.target.value }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={editingProduct.barcode || ''}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, barcode: e.target.value }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Costo ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.costPrice}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, costPrice: parseFloat(e.target.value) || 0.0 }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Precio Venta ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.salePrice}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, salePrice: parseFloat(e.target.value) || 0.0 }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-450 mb-1">Precio Mayoreo ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.wholesalePrice || 0.0}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, wholesalePrice: parseFloat(e.target.value) || 0.0 }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, stock: parseInt(e.target.value) || 0 }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Min Stock</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, minStock: parseInt(e.target.value) || 0 }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-450 mb-1">Max Stock</label>
                  <input
                    type="number"
                    value={editingProduct.maxStock || 100}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, maxStock: parseInt(e.target.value) || 100 }) : null)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-4 py-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsBulk"
                    checked={editingProduct.isBulk || false}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, isBulk: e.target.checked }) : null)}
                    className="w-4 h-4 cursor-pointer accent-indigo-650"
                  />
                  <label htmlFor="editIsBulk" className="text-slate-700 cursor-pointer font-bold select-none">¿Venta a Granel?</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editTrackInventory"
                    checked={editingProduct.trackInventory ?? true}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, trackInventory: e.target.checked }) : null)}
                    className="w-4 h-4 cursor-pointer accent-indigo-650"
                  />
                  <label htmlFor="editTrackInventory" className="text-slate-700 cursor-pointer font-bold select-none">Controlar Stock</label>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Imagen del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer"
                />
                {editingProduct.imageUrl && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden">
                    <img src={editingProduct.imageUrl} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Pharmacy Special Rules */}
              {currentModule === 'pharmacy' && (
                <div className="border-t border-slate-200 pt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-500 font-semibold">¿Requiere Receta Médica?</label>
                    <input
                      type="checkbox"
                      checked={editingProduct.isControlled || false}
                      onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, isControlled: e.target.checked }) : null)}
                      className="w-4 h-4 cursor-pointer accent-red-650"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Equivalente Genérico (Nombre)</label>
                    <input
                      type="text"
                      value={editingProduct.genericEquivalent || ''}
                      onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, genericEquivalent: e.target.value }) : null)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-indigo-950/20"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: ADJUST INGREDIENT QUANTITY */}
      {showAdjustIngredientModal && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-4">
            
            <h3 className="text-sm font-bold text-slate-850 flex items-center gap-2 border-b border-slate-200 pb-3">
              <Package className="w-5 h-5 text-indigo-600" />
              <span>Ajustar Cantidad de Insumo / Ingr.</span>
            </h3>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs flex justify-between items-center font-semibold">
              <span className="text-slate-500 font-bold">Insumo:</span>
              <span className="text-slate-850 font-bold">{selectedIngredient.name} (Stock actual: {selectedIngredient.stock} {selectedIngredient.unit})</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = parseInt(adjustIngredientQty);
                if (isNaN(val)) {
                  showToast('Ingrese un número entero válido.', 'error');
                  return;
                }
                adjustIngredientStock(selectedIngredient.id, val);
                setShowAdjustIngredientModal(false);
                setSelectedIngredient(null);
                showToast('Stock de insumo ajustado con éxito.');
              }}
              className="flex flex-col gap-3 font-semibold text-xs text-slate-700"
            >
              <div>
                <label className="block text-slate-400 mb-1">Cantidad a ajustar (sumar o restar con signo -)</label>
                <input
                  type="number"
                  required
                  value={adjustIngredientQty}
                  onChange={(e) => setAdjustIngredientQty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none font-bold"
                  placeholder="Ej: 1000 o -500"
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustIngredientModal(false);
                    setSelectedIngredient(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-indigo-950/20"
                >
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR EXCEL / CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151b27] border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-blue-400" />
                Importar Productos desde Excel / CSV
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* STEP: UPLOAD */}
            {importStep === 'upload' && (
              <div className="space-y-5">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-blue-300 text-sm font-medium mb-2">📋 Requisitos del archivo:</p>
                  <ul className="text-blue-300/70 text-xs space-y-1">
                    <li>• Formato CSV o TXT separado por comas (,) o punto y coma (;)</li>
                    <li>• La primera fila debe ser el encabezado con los nombres de columnas</li>
                    <li>• <strong>Columnas obligatorias:</strong> SKU, Nombre/Producto, Precio</li>
                    <li>• <strong>Columnas opcionales:</strong> Categoria, Barcode, Costo, Stock, StockMin</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => importFileRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 hover:border-blue-400/50 rounded-2xl p-8 transition-all cursor-pointer group"
                  >
                    <Upload size={32} className="text-white/30 group-hover:text-blue-400 transition-colors" />
                    <div className="text-center">
                      <p className="text-white/60 text-sm font-medium group-hover:text-white">Seleccionar archivo CSV</p>
                      <p className="text-white/30 text-xs mt-0.5">Haz clic para examinar</p>
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex flex-col items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-2xl px-6 py-4 transition-all"
                  >
                    <Download size={20} className="text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-medium text-center">Descargar<br/>Plantilla</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP: PREVIEW */}
            {importStep === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-sm">
                    Se detectaron <strong className="text-white">{importPreviewData.length} filas</strong> para importar. Revisa antes de confirmar:
                  </p>
                </div>
                
                {/* Preview table */}
                <div className="overflow-x-auto rounded-xl border border-white/10 max-h-64">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-white/40 uppercase tracking-wider">
                        <th className="px-3 py-2">Fila</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Precio</th>
                        <th className="px-3 py-2">Stock</th>
                        <th className="px-3 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewData.slice(0, 20).map(row => {
                        const hasConflict = products.some(p => p.sku.toLowerCase() === row.sku.toLowerCase());
                        const isEmpty = !row.sku || !row.name;
                        return (
                          <tr key={row.row} className="border-b border-white/5">
                            <td className="px-3 py-2 text-white/40">{row.row}</td>
                            <td className="px-3 py-2 font-mono text-white">{row.sku || '—'}</td>
                            <td className="px-3 py-2 text-white/80">{row.name || '—'}</td>
                            <td className="px-3 py-2 font-mono text-emerald-400">{row.salePrice?.toFixed(2)}</td>
                            <td className="px-3 py-2 font-mono text-white/60">{row.stock}</td>
                            <td className="px-3 py-2">
                              {hasConflict ? (
                                <span className="text-amber-400 text-[10px] font-medium">⚠️ SKU duplicado</span>
                              ) : isEmpty ? (
                                <span className="text-red-400 text-[10px] font-medium">❌ Datos inválidos</span>
                              ) : (
                                <span className="text-emerald-400 text-[10px] font-medium">✓ OK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {importPreviewData.length > 20 && (
                    <p className="text-white/30 text-xs text-center py-2">... y {importPreviewData.length - 20} más</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setImportStep('upload')}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl text-sm transition-all">
                    ← Volver
                  </button>
                  <button onClick={handleConfirmImport}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                    <Check size={15} /> Confirmar e Importar
                  </button>
                </div>
              </div>
            )}

            {/* STEP: DONE - RESULTS */}
            {importStep === 'done' && importResults && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-emerald-400">{importResults.imported}</p>
                    <p className="text-emerald-300/70 text-xs mt-1">Importados correctamente</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-black text-red-400">{importResults.errors.length}</p>
                    <p className="text-red-300/70 text-xs mt-1">Errores / Ignorados</p>
                  </div>
                </div>

                {/* Errors list */}
                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Detalle de errores:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {importResults.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-3 bg-red-500/10 border border-red-500/15 rounded-xl px-4 py-3">
                          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-white/70 text-xs font-medium">Fila {err.row} — SKU: <span className="text-white font-mono">{err.sku}</span></p>
                            <p className="text-red-300/80 text-xs mt-0.5">{err.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setShowImportModal(false)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 rounded-xl text-sm transition-all">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GENERATE BARCODE */}
      {showBarcodeModal && selectedBarcodeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-1.5">
              <span>Etiqueta de Código de Barras</span>
            </h3>
            
            <div className="flex flex-col items-center gap-3">
              <span className="text-slate-800 font-extrabold text-center text-sm">{selectedBarcodeProduct.name}</span>
              
              {/* Barcode SVG Rendering */}
              <div className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm w-full">
                <svg width={220} height={60} className="max-w-full">
                  {(() => {
                    const value = selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku;
                    let result = '11010010110';
                    for (let i = 0; i < value.length; i++) {
                      const code = value.charCodeAt(i);
                      const binary = (code * 17).toString(2).padStart(11, '0');
                      result += binary;
                    }
                    result += '1100011101011';
                    
                    return result.split('').map((char, index) => {
                      if (char === '1') {
                        return (
                          <rect
                            key={index}
                            x={index * 1.5}
                            y={0}
                            width={1.5}
                            height={60}
                            fill="black"
                          />
                        );
                      }
                      return null;
                    });
                  })()}
                </svg>
                <span className="font-mono text-[10px] font-black tracking-widest text-slate-800">
                  {selectedBarcodeProduct.barcode || selectedBarcodeProduct.sku}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Imprimir Etiqueta
              </button>
              <button
                onClick={() => {
                  setShowBarcodeModal(false);
                  setSelectedBarcodeProduct(null);
                }}
                className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111622]/95 border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-md font-bold text-rose-450 flex items-center gap-2 border-b border-white/5 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Confirmar Eliminación</span>
            </h3>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              ¿Está seguro de que desea eliminar el producto <strong className="text-white font-bold">"{productToDelete.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end mt-2 border-t border-white/5 pt-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/60 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  showToast(`Producto "${productToDelete.name}" eliminado.`, 'success');
                  setProductToDelete(null);
                }}
                className="px-5 py-2 bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-red-950/20 transition-all"
              >
                Eliminar Producto
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
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
