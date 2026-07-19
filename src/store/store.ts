import { create } from 'zustand';
import { MockBackend } from '../lib/mockBackend';
import { generateTicketHtml } from '../lib/ticketPrinter';
import { 
  Product, CartItem, Client, Supplier, Quote, 
  CashMovement, CashSession, Sale, TableState, LogEntry, 
  StoreType, UserRole, CompanyConfig, DianConfig, BranchState,
  CustomOrder, IngredientStock, ProductionBatch, MermaLog, WarehouseTransfer,
  AppUser, AppConfig, StockMovement, PurchaseOrder, UserPermissions
} from '../types/types';

interface POSState {
  currentModule: StoreType;
  userRole: UserRole;
  operatorName: string;
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  quotes: Quote[];
  sales: Sale[];
  activeCarts: Record<StoreType, CartItem[]>;
  cartDiscounts: Record<StoreType, number>;
  restaurantTables: TableState[];
  bakeryTables: TableState[];
  fruitTables: TableState[];
  selectedTableId: string | null; // Currently active table in Restaurant, Bakery or Fruit
  cashSession: CashSession | null;
  cashMovements: CashMovement[];
  auditLogs: LogEntry[];
  purchaseOrders: PurchaseOrder[];
  categories: Record<StoreType, string[]>;
  stockMovements: StockMovement[];
  
  // Category Actions
  addCategory: (module: StoreType, category: string) => void;
  deleteCategory: (module: StoreType, category: string) => void;
  renameCategory: (module: StoreType, oldName: string, newName: string) => void;
  
  // Authentication & Users
  appConfig: AppConfig;
  appUsers: AppUser[];
  activeSession: AppUser | null; // Currently logged in user
  
  // Auth Actions
  completeOnboarding: (config: AppConfig, adminUser: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateAppConfig: (config: Partial<AppConfig>) => void;
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isDemoMode: boolean;
  exitDemoMode: () => void;
  resetPassword: (username: string, email: string, taxId: string, newPassword: string) => { success: boolean; message: string };
  recoverUsername: (email: string, taxId: string) => { success: boolean; message: string; usernames?: string[] };
  initStore: () => Promise<void>;
  addUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (user: AppUser) => void;
  deleteUser: (userId: string) => void;
  
  // Stock Movements (Kardex)
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
  
  // Purchase Orders
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt'>) => void;
  receivePurchaseOrder: (orderId: string) => void;
  cancelPurchaseOrder: (orderId: string) => void;

  // Licensing
  isLicensed: boolean;
  licenseKey: string;
  activateLicense: (key: string, machineId: string) => Promise<{ success: boolean; message: string }>;
  deactivateLicense: () => void;
  
  // Per-module licensing
  licensedModules: Record<StoreType, boolean>;
  moduleLicenseKeys: Record<StoreType, string>;
  activateModuleLicense: (module: StoreType, key: string, machineId: string) => Promise<{ success: boolean; message: string }>;
  
  // Settings & Corporate Configs
  companyConfig: CompanyConfig;
  dianConfig: DianConfig;
  branches: BranchState[];
  activeBranchId: string;
  activeRegisterId: string;
  customOrders: CustomOrder[];
  ingredientsStock: IngredientStock[];
  productionBatches: ProductionBatch[];
  mermaLogs: MermaLog[];
  warehouseTransfers: WarehouseTransfer[];
  clientCredits: Record<string, number>;
  
  // Settings & Branch Actions
  updateCompanyConfig: (config: Partial<CompanyConfig>) => void;
  updateDianConfig: (config: Partial<DianConfig>) => void;
  setActiveBranch: (branchId: string) => void;
  setActiveRegister: (registerId: string) => void;
  addCustomOrder: (order: Omit<CustomOrder, 'id'>) => void;
  updateCustomOrderStatus: (id: string, status: 'pending' | 'completed') => void;
  addProductionBatch: (batch: Omit<ProductionBatch, 'id'>) => void;
  executeProductionBatch: (id: string) => void;
  addMermaLog: (merma: Omit<MermaLog, 'id'>) => void;
  addWarehouseTransfer: (transfer: Omit<WarehouseTransfer, 'id'>) => void;
  payClientCredit: (clientId: string, amount: number) => void;
  adjustIngredientStock: (id: string, qty: number) => void;

  // Actions
  setModule: (module: StoreType) => void;
  setUserRole: (role: UserRole) => void;
  setOperatorName: (name: string) => void;
  addLog: (action: string, module: string) => void;
  addTable: (module: StoreType, tableName: string) => void;
  
  // Cart Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number, weight?: number) => void;
  applyDiscount: (percentage: number) => void;
  clearCart: () => void;
  
  // Seating / Table Actions
  selectTable: (tableId: string | null) => void;
  updateTableStatus: (tableId: string, status: 'free' | 'occupied' | 'billing' | 'reserved') => void;
  updateTableGuests: (tableId: string, guests: number) => void;
  saveCartToTable: (tableId: string) => void;
  loadCartFromTable: (tableId: string) => void;
  
  // Checkout Actions
  processCheckout: (paymentMethod: 'cash' | 'card' | 'transfer' | 'credit', cashReceived: number, tipAmount?: number, orderType?: 'mesa' | 'llevar' | 'domicilio', clientId?: string) => { success: boolean; change: number; sale?: Sale };
  
  // Inventory Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (productId: string, quantity: number, type: 'in' | 'out', concept: string) => void;
  addIngredient: (ingredient: Omit<IngredientStock, 'id'>) => void;
  
  // Caja (Cash Register) Actions
  openCaja: (openingCash: number, user: string) => void;
  closeCaja: (closingCash: number) => void;
  addCashMovement: (type: 'in' | 'out', amount: number, concept: string) => void;
  
  // Clients & Suppliers Actions
  addClient: (client: Omit<Client, 'id' | 'totalSpent' | 'visitsCount'>) => void;
  updateClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  purchaseFromSupplier: (supplierId: string, productId: string, qty: number, costPrice: number) => void;
  
  // Quotes Actions
  addQuote: (clientName: string, items: CartItem[], isElectronicInvoice?: boolean) => void;
  convertQuoteToSale: (quoteId: string) => void;
  deleteQuote: (quoteId: string) => void;
  
  // Barcode / Scanner
  scanBarcode: (barcode: string) => boolean;
  
  // Backup / Restore
  backupData: () => string;
  restoreData: (jsonData: string) => boolean;
}


// Initial Mock Products
const initialProducts: Product[] = [
  // --- Restaurant ---
  { 
    id: 'r1', 
    name: 'Pizza Muzarella', 
    category: 'Platos', 
    barcode: '1001', 
    sku: 'R-PIZ-01', 
    costPrice: 4.5, 
    salePrice: 12.0, 
    stock: 40, 
    minStock: 5, 
    description: 'Pizza grande de muzarella artesanal', 
    storeType: 'restaurant', 
    variants: ['Familiar', 'Individual'],
    ingredients: [
      { ingredientId: 'ing2', name: 'Queso Mozzarella', qtyNeeded: 200, unit: 'g' },
      { ingredientId: 'ing1', name: 'Harina de Trigo', qtyNeeded: 300, unit: 'g' },
      { ingredientId: 'ing3', name: 'Salsa de Tomate', qtyNeeded: 100, unit: 'g' }
    ]
  },
  { 
    id: 'r2', 
    name: 'Pasta Fileto', 
    category: 'Platos', 
    barcode: '1002', 
    sku: 'R-PAS-02', 
    costPrice: 3.0, 
    salePrice: 9.50, 
    stock: 30, 
    minStock: 5, 
    description: 'Tallarines con salsa fileto clásica', 
    storeType: 'restaurant',
    ingredients: [
      { ingredientId: 'ing1', name: 'Harina de Trigo', qtyNeeded: 150, unit: 'g' },
      { ingredientId: 'ing3', name: 'Salsa de Tomate', qtyNeeded: 120, unit: 'g' }
    ]
  },
  { 
    id: 'r3', 
    name: 'Hamburguesa Completa', 
    category: 'Platos', 
    barcode: '1003', 
    sku: 'R-HAM-03', 
    costPrice: 5.0, 
    salePrice: 11.50, 
    stock: 50, 
    minStock: 8, 
    description: 'Hamburguesa con queso, lechuga, tomate y papas fritas', 
    storeType: 'restaurant',
    ingredients: [
      { ingredientId: 'ing4', name: 'Jamón de Pavo', qtyNeeded: 100, unit: 'g' },
      { ingredientId: 'ing2', name: 'Queso Mozzarella', qtyNeeded: 50, unit: 'g' }
    ]
  },
  { id: 'r4', name: 'Ensalada César', category: 'Platos', barcode: '1004', sku: 'R-ENS-04', costPrice: 2.5, salePrice: 8.0, stock: 25, minStock: 4, description: 'Lechuga, pollo grillado, croutones y aderezo césar', storeType: 'restaurant' },
  { id: 'r5', name: 'Coca Cola 500ml', category: 'Bebidas', barcode: '1005', sku: 'R-BEB-01', costPrice: 0.8, salePrice: 2.5, stock: 120, minStock: 20, description: 'Gaseosa sabor original fría', storeType: 'restaurant' },
  { id: 'r6', name: 'Cerveza Corona 355ml', category: 'Bebidas', barcode: '1006', sku: 'R-BEB-02', costPrice: 1.5, salePrice: 4.0, stock: 80, minStock: 15, description: 'Cerveza rubia Corona', storeType: 'restaurant' },
  { id: 'r7', name: 'Flan con Dulce de Leche', category: 'Postres', barcode: '1007', sku: 'R-POS-01', costPrice: 1.2, salePrice: 5.0, stock: 20, minStock: 3, description: 'Flan casero con dulce de leche premium', storeType: 'restaurant' },
  
  // --- Pharmacy ---
  { id: 'p1', name: 'Paracetamol 500mg', category: 'Analgésicos', barcode: '2001', sku: 'P-ANA-01', costPrice: 0.5, salePrice: 2.50, stock: 200, minStock: 30, description: 'Analgésico y antipirético clásico. Caja de 20 comprimidos.', storeType: 'pharmacy', isGeneric: true, expirationDate: '2027-10-15', lotNumber: 'L-PARA-24' },
  { id: 'p2', name: 'Tempra Infantil', category: 'Analgésicos', barcode: '2002', sku: 'P-ANA-02', costPrice: 2.0, salePrice: 6.50, stock: 60, minStock: 10, description: 'Paracetamol para niños sabor cereza.', storeType: 'pharmacy', genericEquivalent: 'Paracetamol 500mg', expirationDate: '2026-11-20', lotNumber: 'L-TEMP-11' },
  { id: 'p3', name: 'Ibuprofeno 600mg', category: 'Antiinflamatorios', barcode: '2003', sku: 'P-ANT-01', costPrice: 0.7, salePrice: 3.20, stock: 150, minStock: 25, description: 'Antiinflamatorio y analgésico. Caja de 10 capsulas blandas.', storeType: 'pharmacy', isGeneric: true, expirationDate: '2027-04-05', lotNumber: 'L-IBUP-90' },
  { id: 'p4', name: 'Clonazepam 2mg', category: 'Controlados', barcode: '2004', sku: 'P-CON-01', costPrice: 1.5, salePrice: 9.80, stock: 45, minStock: 5, description: 'Anticonvulsivo y ansiolítico. Venta bajo receta archivada.', storeType: 'pharmacy', isControlled: true, expirationDate: '2027-02-18', lotNumber: 'L-CLON-08' },
  { id: 'p5', name: 'Morfina Jarabe 10mg/ml', category: 'Controlados', barcode: '2005', sku: 'P-CON-02', costPrice: 5.0, salePrice: 24.00, stock: 15, minStock: 3, description: 'Analgésico opioide potente. Venta restringida.', storeType: 'pharmacy', isControlled: true, expirationDate: '2026-08-30', lotNumber: 'L-MORF-02' },
  { id: 'p6', name: 'Aspirina 100mg', category: 'Cardiología', barcode: '2006', sku: 'P-CAR-01', costPrice: 0.3, salePrice: 1.80, stock: 300, minStock: 40, description: 'Ácido acetilsalicílico protector cardíaco.', storeType: 'pharmacy', genericEquivalent: 'Ácido Acetilsalicílico', expirationDate: '2026-07-10', lotNumber: 'L-ASPI-32' },
  
  // --- Bakery ---
  { id: 'b1', name: 'Medialunas de Grasa', category: 'Facturas', barcode: '3001', sku: 'B-FAC-01', costPrice: 0.15, salePrice: 0.60, stock: 300, minStock: 50, description: 'Medialunas saladas tradicionales de grasa', storeType: 'bakery' },
  { id: 'b2', name: 'Medialunas de Manteca', category: 'Facturas', barcode: '3002', sku: 'B-FAC-02', costPrice: 0.18, salePrice: 0.70, stock: 250, minStock: 50, description: 'Medialunas dulces esponjosas de manteca', storeType: 'bakery' },
  { id: 'b3', name: 'Pan Felipe', category: 'Panes', barcode: '3003', sku: 'B-PAN-01', costPrice: 0.80, salePrice: 2.20, stock: 100, minStock: 20, description: 'Tiras de pan Felipe fresco crocante', storeType: 'bakery' },
  { id: 'b4', name: 'Criollos de Hojaldre', category: 'Panes', barcode: '3004', sku: 'B-PAN-02', costPrice: 0.20, salePrice: 0.80, stock: 180, minStock: 30, description: 'Criollitos hojaldrados ideales para mate', storeType: 'bakery' },
  { id: 'b5', name: 'Café Espresso', category: 'Cafetería', barcode: '3005', sku: 'B-CAF-01', costPrice: 0.50, salePrice: 2.80, stock: 500, minStock: 10, description: 'Café espresso intenso de grano seleccionado', storeType: 'bakery', variants: ['Chico', 'Doble'] },
  { id: 'b6', name: 'Cappuccino Italiano', category: 'Cafetería', barcode: '3006', sku: 'B-CAF-02', costPrice: 0.75, salePrice: 3.50, stock: 300, minStock: 10, description: 'Espresso con leche espumada y cacao en polvo', storeType: 'bakery' },
  
  // --- Fruit / Dessert Shop (Heladería, Ensaladas de Frutas, Gelatinas, Waffles) ---
  { id: 'f1', name: 'Ensalada de Frutas Especial', category: 'Ensaladas', barcode: '4001', sku: 'F-ENS-01', costPrice: 3.50, salePrice: 9.50, stock: 80, minStock: 10, description: 'Ensalada de frutas con helado, queso rallado y chantilly', storeType: 'fruit' },
  { id: 'f2', name: 'Waffle con Nutella y Fresas', category: 'Waffles', barcode: '4002', sku: 'F-WAF-01', costPrice: 2.20, salePrice: 7.80, stock: 60, minStock: 8, description: 'Waffle belga caliente con fresas frescas y crema de chocolate', storeType: 'fruit' },
  { id: 'f3', name: 'Copa Helada Suprema', category: 'Helados', barcode: '4003', sku: 'F-HEL-01', costPrice: 2.50, salePrice: 8.00, stock: 120, minStock: 15, description: 'Copa de helado de 3 sabores con frutas picadas y barquillo', storeType: 'fruit', variants: ['Vaso Pequeño', 'Copa Grande'] },
  { id: 'f4', name: 'Gelatina con Leche Condensada', category: 'Gelatinas', barcode: '4004', sku: 'F-GEL-01', costPrice: 0.80, salePrice: 3.00, stock: 90, minStock: 10, description: 'Gelatina multicolor con un generoso hilo de leche condensada', storeType: 'fruit' },
  { id: 'f5', name: 'Toppings Surtidos por Gramo', category: 'Toppings', barcode: '4005', sku: 'F-TOP-01', costPrice: 0.01, salePrice: 0.04, stock: 5000, minStock: 500, description: 'Toppings y adiciones de dulces pesados (precio por gramo)', storeType: 'fruit' },
  
  // --- Retail Business ---
  { id: 'g1', name: 'Detergente Líquido 1L', category: 'Limpieza', barcode: '75001', sku: 'G-LIM-01', costPrice: 1.50, salePrice: 4.50, stock: 60, minStock: 8, description: 'Detergente biodegradable multiuso concentrado', storeType: 'business', brand: 'LimpiaMax' },
  { id: 'g2', name: 'Arroz Largo Fino 1Kg', category: 'Almacén', barcode: '75002', sku: 'G-ALM-01', costPrice: 0.40, salePrice: 1.20, stock: 180, minStock: 20, description: 'Arroz blanco largo fino grado 1', storeType: 'business', brand: 'Diana' },
  { id: 'g3', name: 'Leche Entera Larga Vida 1L', category: 'Lácteos', barcode: '75003', sku: 'G-LAC-01', costPrice: 0.65, salePrice: 1.50, stock: 120, minStock: 15, description: 'Leche entera ultrapasteurizada enriquecida con calcio', storeType: 'business', brand: 'Alquería' },
  { id: 'g4', name: 'Cuaderno Universitario A4', category: 'Librería', barcode: '75004', sku: 'G-LIB-01', costPrice: 1.10, salePrice: 3.20, stock: 45, minStock: 10, description: 'Cuaderno de 80 hojas cuadriculado', storeType: 'business', variants: ['Rallado', 'Cuadriculado'], brand: 'Norma' },
  { id: 'g5', name: 'Fideos Spaguetti 500g', category: 'Almacén', barcode: '75005', sku: 'G-ALM-02', costPrice: 0.35, salePrice: 1.10, stock: 150, minStock: 20, description: 'Fideos secos de sémola de trigo candeal', storeType: 'business', brand: 'Doria' },
];

const initialClients: Client[] = [
  { id: 'c-gen', name: 'Cliente General', email: '-', phone: '-', address: '-', totalSpent: 0, visitsCount: 0 },
  { id: 'c1', name: 'Juan Pérez', email: 'juan.perez@gmail.com', phone: '3123456789', address: 'Av. Siempre Viva 742', totalSpent: 120.50, visitsCount: 5 },
  { id: 'c2', name: 'María Gómez', email: 'maria.gomez@hotmail.com', phone: '3157654321', address: 'Paseo de la Reforma 45', totalSpent: 345.00, visitsCount: 12 },
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Droguería Central S.A.', email: 'ventas@drogueriacentral.com', phone: '0800-444-1234', companyName: 'Droguería Central', totalPurchases: 1500.00 },
  { id: 's2', name: 'Distribuidora Alimentos Globales', email: 'pedidos@alimentosglobales.com', phone: '555-9090', companyName: 'Alimentos Globales SRL', totalPurchases: 2300.00 },
  { id: 's3', name: 'Panificadora Industrial del Sur', email: 'panificados@sur.com', phone: '555-1122', companyName: 'Panificadora Sur S.A.', totalPurchases: 800.00 },
  { id: 's4', name: 'Distribuidora Frutícola de la Sabana', email: 'contacto@frutisabana.com', phone: '3109998877', companyName: 'Sabana Agro S.A.S.', totalPurchases: 1200.00, isAgro: true },
];

const initialRestaurantTables = (): TableState[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pos_restaurant_tables');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
  }
  return Array.from({ length: 8 }, (_, i) => ({
    id: `rt-${i + 1}`,
    name: `Mesa ${i + 1}`,
    status: 'free',
    guestsCount: 0,
    cart: [],
  }));
};

const initialBakeryTables = (): TableState[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pos_bakery_tables');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
  }
  return Array.from({ length: 6 }, (_, i) => ({
    id: `bt-${i + 1}`,
    name: `Mesa Café ${i + 1}`,
    status: 'free',
    guestsCount: 0,
    cart: [],
  }));
};

const initialFruitTables = (): TableState[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pos_fruit_tables');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
  }
  return Array.from({ length: 6 }, (_, i) => ({
    id: `ft-${i + 1}`,
    name: `Mesa Heladería ${i + 1}`,
    status: 'free',
    guestsCount: 0,
    cart: [],
  }));
};

// Offline License Cryptographic Checksum Helpers
export const validateLicenseKey = (key: string): boolean => {
  const regex = /^POS-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;
  const match = key.toUpperCase().trim().match(regex);
  if (!match) return false;
  
  const [, s1, s2, s3, s4, s5] = match;
  const combined = s1 + s2 + s3 + s4;
  let sum = 0;
  for (let i = 0; i < combined.length; i++) {
    sum += combined.charCodeAt(i) * (i + 1);
  }
  const expectedS5 = (sum % 1679616).toString(36).toUpperCase().padStart(4, '0');
  return s5 === expectedS5;
};

export const validateLicenseKeyForModule = (key: string, module: StoreType): boolean => {
  const regex = /^POS-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/;
  const match = key.toUpperCase().trim().match(regex);
  if (!match) return false;

  const [, s1, s2, s3, s4, s5] = match;
  
  // Verify the module prefix in block 1 (s1)
  let expectedPrefix = '';
  switch (module) {
    case 'restaurant': expectedPrefix = 'REST'; break;
    case 'pharmacy': expectedPrefix = 'PHAR'; break;
    case 'bakery': expectedPrefix = 'BAKE'; break;
    case 'fruit': expectedPrefix = 'FRUT'; break;
    case 'business': expectedPrefix = 'BUSI'; break;
    default: return false;
  }
  if (s1 !== expectedPrefix) return false;

  const combined = s1 + s2 + s3 + s4;
  let sum = 0;
  for (let i = 0; i < combined.length; i++) {
    sum += combined.charCodeAt(i) * (i + 1);
  }
  const expectedS5 = (sum % 1679616).toString(36).toUpperCase().padStart(4, '0');
  return s5 === expectedS5;
};

export const generateLicenseKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomSeg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const s1 = randomSeg();
  const s2 = randomSeg();
  const s3 = randomSeg();
  const s4 = randomSeg();
  const combined = s1 + s2 + s3 + s4;
  let sum = 0;
  for (let i = 0; i < combined.length; i++) {
    sum += combined.charCodeAt(i) * (i + 1);
  }
  const s5 = (sum % 1679616).toString(36).toUpperCase().padStart(4, '0');
  return `POS-${s1}-${s2}-${s3}-${s4}-${s5}`;
};

export const usePOSStore = create<POSState>((set, get) => ({
  isLicensed: (typeof window !== 'undefined' && window.location.search.includes('demo=true')) ? true : (typeof window !== 'undefined' ? localStorage.getItem('pos_is_licensed') === 'true' : false),
  licenseKey: typeof window !== 'undefined' ? localStorage.getItem('pos_license_key') || '' : '',
  isDemoMode: typeof window !== 'undefined' ? window.location.search.includes('demo=true') : false,

  licensedModules: (() => {
    if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) {
      return { restaurant: true, pharmacy: true, bakery: true, fruit: true, business: true, hub: true };
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pos_licensed_modules');
      if (stored) {
        try { return JSON.parse(stored) as Record<StoreType, boolean>; } catch { /* ignore */ }
      }
    }
    return {
      restaurant: false,
      pharmacy: false,
      bakery: false,
      fruit: false,
      business: false,
      hub: true,
    } as Record<StoreType, boolean>;
  })(),

  moduleLicenseKeys: (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pos_module_license_keys');
      if (stored) {
        try { return JSON.parse(stored) as Record<StoreType, string>; } catch { /* ignore */ }
      }
    }
    return {
      restaurant: '',
      pharmacy: '',
      bakery: '',
      fruit: '',
      business: '',
      hub: '',
    } as Record<StoreType, string>;
  })(),

  activateLicense: async (key, machineId) => {
    try {
      // 1. Try local offline master key or old checksum for backward compatibility (optional)
      const isMasterKey = key.toUpperCase().trim() === 'PRO-ADMIN-LICENSE-2026';
      
      // 2. Query Central Server (MockBackend)
      const res = await MockBackend.activateLicense(key.toUpperCase().trim(), machineId);
      
      if (res.success || isMasterKey) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_is_licensed', 'true');
          localStorage.setItem('pos_license_key', key.toUpperCase().trim());
        }
        set({ isLicensed: true, licenseKey: key.toUpperCase().trim() });
        get().addLog(`Sistema Licenciado con Éxito. Clave: ${key.toUpperCase().trim()}`, 'Seguridad');
        return { success: true, message: isMasterKey ? 'Licencia Maestra activada con éxito.' : res.message };
      } else {
        return { success: false, message: res.message || 'Licencia inválida.' };
      }
    } catch (e) {
      return { success: false, message: 'Error de red al validar la licencia.' };
    }
  },

  activateModuleLicense: async (module, key, machineId) => {
    try {
      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key.toUpperCase().trim(), machine_id: machineId })
      });
      
      const res = await response.json();
      
      if (response.ok && res.valid) {
        const licensed = { ...get().licensedModules, [module]: true };
        const keys = { ...get().moduleLicenseKeys, [module]: key.toUpperCase().trim() };
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_licensed_modules', JSON.stringify(licensed));
          localStorage.setItem('pos_module_license_keys', JSON.stringify(keys));
        }
        set({ licensedModules: licensed, moduleLicenseKeys: keys });
        get().addLog(`Licencia activada para módulo ${module}. Clave: ${key.toUpperCase().trim()}`, 'Seguridad');
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message };
      }
    } catch (e) {
      return { success: false, message: 'Error de red al validar la licencia.' };
    }
  },

  deactivateLicense: () => {
    const defaultLicensed = {
      restaurant: false,
      pharmacy: false,
      bakery: false,
      fruit: false,
      business: false,
      hub: true,
    } as Record<StoreType, boolean>;
    const defaultKeys = {
      restaurant: '',
      pharmacy: '',
      bakery: '',
      fruit: '',
      business: '',
      hub: '',
    } as Record<StoreType, string>;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_is_licensed');
      localStorage.removeItem('pos_license_key');
      localStorage.removeItem('pos_licensed_modules');
      localStorage.removeItem('pos_module_license_keys');
    }
    set({ 
      isLicensed: false, 
      licenseKey: '',
      licensedModules: defaultLicensed,
      moduleLicenseKeys: defaultKeys
    });
    get().addLog(`Todas las licencias han sido desactivadas del sistema`, 'Seguridad');
  },

  currentModule: 'hub',
  userRole: 'Admin',
  operatorName: typeof window !== 'undefined' ? localStorage.getItem('pos_operator_name') || 'Vendedor1' : 'Vendedor1',
  products: initialProducts,
  clients: initialClients,
  suppliers: initialSuppliers,
  quotes: [],
  sales: [],
  stockMovements: [],
  purchaseOrders: [],
  categories: {
    hub: [],
    restaurant: ['Platos', 'Bebidas', 'Postres', 'Entradas'],
    pharmacy: ['Medicamentos', 'Cuidado Personal', 'Belleza', 'Suplementos'],
    bakery: ['Facturas', 'Panes', 'Cafetería', 'Pasteles'],
    fruit: ['Frutas', 'Verduras', 'Orgánicos', 'Frutos Secos'],
    business: ['Abarrotes', 'Limpieza', 'Lácteos', 'Bebidas']
  },

  // App Configuration (Onboarding state)
  appConfig: (() => {
    if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) {
      return {
        isConfigured: true,
        companyName: "Demo CraftPOS",
        taxIdType: "NIT",
        taxId: "123456789-0",
        tagLine: "Entorno de Prueba",
        phone: "+1 234 567 890",
        email: "demo@craftpos.com",
        address: "Av. Principal #123, Ciudad",
        currency: "USD",
        currencySymbol: "$",
        country: "CO",
        taxEnabled: true,
        taxRate: 19,
        cashierName: "Caja Principal",
        printFormat: "80mm",
        ticketFont: "monospace",
        ticketShowLogo: false,
        ticketCustomText: "Gracias por su compra",
        ticketShowBusinessData: true,
        onboardingDate: new Date().toISOString(),
      };
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pos_app_config');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AppConfig;
          if (parsed.isConfigured && !parsed.onboardingDate) {
            parsed.onboardingDate = new Date().toISOString();
            localStorage.setItem('pos_app_config', JSON.stringify(parsed));
          }
          return parsed;
        } catch { /* ignore */ }
      }
    }
    return {
      isConfigured: false,
      companyName: '',
      tagLine: '',
      address: '',
      email: '',
      phone: '',
      taxId: '',
      taxIdType: 'NIT',
      currency: 'BOB',
      currencySymbol: 'Bs.',
      country: 'Bolivia',
      taxEnabled: false,
      taxRate: 13,
      logoBase64: undefined,
      cashierName: 'Caja Principal',
      printFormat: '80mm',
      ticketFont: 'HELVETICA',
      ticketShowLogo: true,
      ticketCustomText: '',
      ticketShowBusinessData: true,
    } as AppConfig;
  })(),

  // App Users
  appUsers: (() => {
    const defaultPerms: UserPermissions = {
      ventas: { access: true, nuevo: true, cobrar: true, descuentos: true, cotizaciones: true },
      inventario: { access: true, entradas: true, salidas: true, ajustes: true, exportar: true },
      caja: { access: true, apertura: true, cierre: true, movimientos: true, reportes: true },
      kardex: { access: true },
      corte: { access: true },
      reporteVentas: { access: true },
      usuarios: { access: true },
      compras: { access: true },
      otros: { access: true },
    };
    const defaultAdmin: AppUser = {
      id: 'default-admin',
      username: 'admin',
      fullName: 'Administrador Principal',
      passwordHash: 'YWRtaW46YWRtaW4=',
      email: 'admin@craftpos.com',
      role: 'Admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: defaultPerms
    };
    const defaultVendedor: AppUser = {
      id: 'default-vendedor',
      username: 'Vendedor1',
      fullName: 'Vendedor Principal',
      passwordHash: 'dmVuZGVkb3IxOjEyMzQ1Ng==',
      email: 'vendedor1@craftpos.com',
      role: 'Admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: defaultPerms
    };

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pos_app_users');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AppUser[];
          if (parsed && parsed.length > 0) return parsed;
        } catch { /* ignore */ }
      }
    }
    return [defaultAdmin, defaultVendedor];
  })(),

  // Active Session
  activeSession: (typeof window !== 'undefined' && window.location.search.includes('demo=true')) ? {
    id: "demo_admin",
    username: "admin",
    passwordHash: "demo",
    email: "admin@demo.com",
    role: "Admin",
    fullName: "Administrador Demo",
    isActive: true,
    createdAt: new Date().toISOString(),
    permissions: {
      ventas: { access: true, nuevo: true, cobrar: true, descuentos: true, cotizaciones: true },
      inventario: { access: true, entradas: true, salidas: true, ajustes: true, exportar: true },
      caja: { access: true, apertura: true, cierre: true, movimientos: true, reportes: true },
      kardex: { access: true },
      corte: { access: true },
      reporteVentas: { access: true },
      usuarios: { access: true },
      compras: { access: true },
      otros: { access: true },
    }
  } : null,

  // Auth Actions
  completeOnboarding: (config, adminUser) => {
    const defaultPerms: UserPermissions = {
      ventas: { access: true, nuevo: true, cobrar: true, descuentos: true, cotizaciones: true },
      inventario: { access: true, entradas: true, salidas: true, ajustes: true, exportar: true },
      caja: { access: true, apertura: true, cierre: true, movimientos: true, reportes: true },
      kardex: { access: true },
      corte: { access: true },
      reporteVentas: { access: true },
      usuarios: { access: true },
      compras: { access: true },
      otros: { access: true },
    };
    const newAdmin: AppUser = {
      ...adminUser,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      role: 'Admin',
      permissions: adminUser.permissions || defaultPerms,
    };
    const newConfig = { ...config, isConfigured: true, onboardingDate: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_app_config', JSON.stringify(newConfig));
      localStorage.setItem('pos_app_users', JSON.stringify([newAdmin]));
    }
    set({ appConfig: newConfig, appUsers: [newAdmin] });
    get().addLog('Configuración inicial completada. Usuario Administrador creado.', 'Seguridad');
  },

  updateAppConfig: (config) => {
    set(state => {
      const newConfig = { ...state.appConfig, ...config };
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_app_config', JSON.stringify(newConfig));
      }
      return { appConfig: newConfig };
    });
    get().addLog('Configuración del negocio actualizada.', 'Seguridad');
  },

  login: (username, password) => {
    const users = get().appUsers;
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.isActive);

    // Foolproof fallback: If the database is empty or doesn't have these users, provide them dynamically
    if (!user) {
      const defaultPerms: UserPermissions = {
        ventas: { access: true, nuevo: true, cobrar: true, descuentos: true, cotizaciones: true },
        inventario: { access: true, entradas: true, salidas: true, ajustes: true, exportar: true },
        caja: { access: true, apertura: true, cierre: true, movimientos: true, reportes: true },
        kardex: { access: true },
        corte: { access: true },
        reporteVentas: { access: true },
        usuarios: { access: true },
        compras: { access: true },
        otros: { access: true },
      };
      if (username.toLowerCase() === 'admin' && password === 'admin') {
        user = {
          id: 'default-admin',
          username: 'admin',
          fullName: 'Administrador Principal',
          passwordHash: 'YWRtaW46YWRtaW4=',
          email: 'admin@craftpos.com',
          role: 'Admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          permissions: defaultPerms
        };
      } else if (username.toLowerCase() === 'vendedor1' && password === '123456') {
        user = {
          id: 'default-vendedor',
          username: 'Vendedor1',
          fullName: 'Vendedor Principal',
          passwordHash: 'dmVuZGVkb3IxOjEyMzQ1Ng==',
          email: 'vendedor1@craftpos.com',
          role: 'Admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          permissions: defaultPerms
        };
      }
    }

    if (!user) {
      return { success: false, message: 'Usuario no encontrado o inactivo.' };
    }
    // Simple hash comparison: stored as btoa of "username:password"
    const expectedHash = btoa(`${username.toLowerCase()}:${password}`);
    if (user.passwordHash !== expectedHash) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }
    set({ activeSession: user, operatorName: user.fullName, userRole: user.role });
    get().addLog(`Inicio de sesión: ${user.fullName} (${user.username})`, 'Seguridad');
    return { success: true, message: `¡Bienvenido, ${user.fullName}!` };
  },

  initStore: async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const dbProducts = await (window as any).electronAPI.dbGetAllProducts();
        if (dbProducts && dbProducts.length > 0) set({ products: dbProducts });
        
        const dbSales = await (window as any).electronAPI.dbGetSales();
        if (dbSales && dbSales.length > 0) set({ sales: dbSales });
        
        const dbRegisters = await (window as any).electronAPI.dbGetRegisters();
        if (dbRegisters && dbRegisters.length > 0) {
          // set({ cashRegisters: dbRegisters }); // TODO: Add cashRegisters to POSState
        }
      } catch (e) {
        console.error('Error hydrating store from DB', e);
      }
    }
  },

  logout: () => {
    const user = get().activeSession;
    get().addLog(`Cierre de sesión: ${user?.fullName || 'Usuario'}`, 'Seguridad');
    set({ activeSession: null });
  },

  exitDemoMode: () => {
    set({ activeSession: null, isDemoMode: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/promo';
    }
  },

  resetPassword: (username, email, taxId, newPassword) => {
    const users = get().appUsers;
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (userIndex === -1) {
      return { success: false, message: 'Usuario no encontrado.' };
    }
    const user = users[userIndex];
    
    // Validate registration email
    const isEmailCorrect = user.email.toLowerCase().trim() === email.toLowerCase().trim();
    
    // Validate company Tax ID / NIT
    const companyTaxId = get().appConfig.taxId || '';
    const isTaxIdCorrect = companyTaxId.toLowerCase().trim() === taxId.toLowerCase().trim();
    
    if (isEmailCorrect && isTaxIdCorrect) {
      const updatedUser = {
        ...user,
        passwordHash: btoa(`${username.toLowerCase()}:${newPassword}`)
      };
      const updatedUsers = users.map((u, idx) => idx === userIndex ? updatedUser : u);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_app_users', JSON.stringify(updatedUsers));
      }
      
      set({ appUsers: updatedUsers });
      get().addLog(`Contraseña restablecida para el usuario: ${username}`, 'Seguridad');
      return { success: true, message: 'Contraseña restablecida con éxito.' };
    } else {
      let errorMsg = 'Los datos ingresados son incorrectos. ';
      if (!isEmailCorrect) errorMsg += 'El correo electrónico no coincide. ';
      if (!isTaxIdCorrect) errorMsg += 'El NIT/RUC de la empresa no coincide.';
      return { success: false, message: errorMsg };
    }
  },

  recoverUsername: (email, taxId) => {
    const users = get().appUsers;
    
    // Validate company Tax ID / NIT
    const companyTaxId = get().appConfig.taxId || '';
    const isTaxIdCorrect = companyTaxId.toLowerCase().trim() === taxId.toLowerCase().trim();
    
    if (!isTaxIdCorrect) {
      return { success: false, message: 'El NIT/RUC de la empresa no coincide.' };
    }
    
    // Find users with this email
    const matchingUsers = users.filter(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (matchingUsers.length === 0) {
      return { success: false, message: 'No se encontraron usuarios asociados a este correo.' };
    }
    
    const usernames = matchingUsers.map(u => u.username);
    get().addLog(`Recuperación de usuario solicitada para el correo: ${email}`, 'Seguridad');
    return { 
      success: true, 
      message: 'Usuarios encontrados con éxito.', 
      usernames 
    };
  },

  addUser: (userInput) => {
    const newUser: AppUser = {
      ...userInput,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const newUsers = [...state.appUsers, newUser];
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_app_users', JSON.stringify(newUsers));
      }
      return { appUsers: newUsers };
    });
    get().addLog(`Usuario creado: ${newUser.fullName} (${newUser.username})`, 'Usuarios');
  },

  updateUser: (user) => {
    set(state => {
      const newUsers = state.appUsers.map(u => u.id === user.id ? user : u);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_app_users', JSON.stringify(newUsers));
      }
      return { appUsers: newUsers };
    });
    get().addLog(`Usuario actualizado: ${user.fullName}`, 'Usuarios');
  },

  deleteUser: (userId) => {
    set(state => {
      const newUsers = state.appUsers.filter(u => u.id !== userId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_app_users', JSON.stringify(newUsers));
      }
      return { appUsers: newUsers };
    });
    get().addLog(`Usuario eliminado: ID ${userId}`, 'Usuarios');
  },

  // Stock Movements (Kardex)
  addStockMovement: (movement) => {
    const newMovement: StockMovement = {
      ...movement,
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    set(state => ({ stockMovements: [newMovement, ...state.stockMovements] }));
  },

  // Purchase Orders
  addPurchaseOrder: (order) => {
    const newOrder: PurchaseOrder = {
      ...order,
      id: `po-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set(state => ({ purchaseOrders: [newOrder, ...state.purchaseOrders] }));
    get().addLog(`Orden de compra creada: ${newOrder.supplierName} - Total: ${newOrder.total}`, 'Compras');
  },

  receivePurchaseOrder: (orderId) => {
    const order = get().purchaseOrders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return;
    const activeUser = get().activeSession;
    // Update stock for each item
    order.items.forEach(item => {
      get().adjustStock(item.productId, item.quantity, 'in', `Recepción de OC: ${order.id}`);
    });
    set(state => ({
      purchaseOrders: state.purchaseOrders.map(o =>
        o.id === orderId ? { ...o, status: 'received' as const, receivedAt: new Date().toISOString() } : o
      )
    }));
    get().addLog(`Orden de compra ${orderId} recibida y stock actualizado.`, 'Compras');
  },

  cancelPurchaseOrder: (orderId) => {
    set(state => ({
      purchaseOrders: state.purchaseOrders.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as const } : o
      )
    }));
    get().addLog(`Orden de compra ${orderId} cancelada.`, 'Compras');
  },

  // Settings & Corporate Configs States
  companyConfig: {
    name: 'CodeCraft POS',
    socialReason: 'Nelson Paez Soluciones S.A.S.',
    nit: '900.323.231-7',
    address: 'Calle 100 #15-30, Bogotá',
    phone: '3232313781',
    email: 'nelsonpaez@codecraft.com',
    currency: 'COP',
    taxRate: 19,
    allowDiscounts: true,
    maxDiscount: 30,
    requireDiscountAuth: true,
    allowReturns: true,
    autoPrint: true,
    negativeInventoryAllowed: false,
    stockMinDefault: 10,
    alertReposition: true,
    autoBackup: true,
    backupFrequency: 'diario',
    backupLocation: 'C:\\Backups\\POS'
  },
  dianConfig: {
    resolution: 'Resolución DIAN No. 187640000123 de 2026',
    prefix: 'FE',
    startNumber: 1000,
    endNumber: 9999,
    currentNumber: 1024
  },
  branches: [
    { id: 'b-bog', name: 'Sucursal Bogotá Norte', address: 'Calle 100 #15-30', code: 'BOG01' },
    { id: 'b-cal', name: 'Sucursal Cali Sur', address: 'Avenida 5 #10-22', code: 'CAL01' },
    { id: 'b-med', name: 'Sucursal Medellín Centro', address: 'Carrera 45 #30-10', code: 'MED01' }
  ],
  activeBranchId: 'b-bog',
  activeRegisterId: 'caja-1',
  customOrders: [
    { id: 'co-1', clientName: 'Carlos Mendoza', phone: '3104567890', details: 'Torta Tres Leches de cumpleaños', deliveryDate: '2026-06-26', status: 'pending', price: 45.00 },
    { id: 'co-2', clientName: 'Ana Silva', phone: '3158901234', details: '50 croissants especiales para evento corporativo', deliveryDate: '2026-06-27', status: 'pending', price: 35.00 }
  ],
  ingredientsStock: [
    { id: 'ing1', name: 'Harina de Trigo', stock: 50000, unit: 'g', costPrice: 0.002 },
    { id: 'ing2', name: 'Queso Mozzarella', stock: 20000, unit: 'g', costPrice: 0.008 },
    { id: 'ing3', name: 'Salsa de Tomate', stock: 15000, unit: 'g', costPrice: 0.004 },
    { id: 'ing4', name: 'Jamón de Pavo', stock: 10000, unit: 'g', costPrice: 0.006 },
    { id: 'ing5', name: 'Fresas Frescas', stock: 8000, unit: 'g', costPrice: 0.005 },
    { id: 'ing6', name: 'Base para Waffles', stock: 12000, unit: 'ml', costPrice: 0.003 },
    { id: 'ing7', name: 'Helado Chocolate', stock: 15000, unit: 'g', costPrice: 0.005 },
    { id: 'ing8', name: 'Helado Vainilla', stock: 15000, unit: 'g', costPrice: 0.005 }
  ],
  productionBatches: [
    { id: 'pb-1', date: '2026-06-25', productName: 'Medialunas de Manteca', quantity: 120, cost: 15.60, status: 'done' },
    { id: 'pb-2', date: '2026-06-25', productName: 'Pan Felipe', quantity: 80, cost: 22.40, status: 'done' }
  ],
  mermaLogs: [
    { id: 'm-1', date: '2026-06-25', productName: 'Fresas Frescas', qty: 500, unit: 'g', concept: 'dañado', cost: 2.50 },
    { id: 'm-2', date: '2026-06-24', productName: 'Medialunas de Manteca', qty: 10, unit: 'u', concept: 'vencido', cost: 1.50 }
  ],
  warehouseTransfers: [
    { id: 'wt-1', date: '2026-06-25', productName: 'Detergente Líquido 1L', qty: 20, fromWarehouse: 'Bodega Central', toWarehouse: 'Bodega Auxiliar', status: 'completado' }
  ],
  clientCredits: {
    'c1': 150.00,
    'c2': 0.00
  },

  // Settings Actions
  updateCompanyConfig: (config) => {
    set(state => ({ companyConfig: { ...state.companyConfig, ...config } }));
    get().addLog('Configuración de la empresa actualizada.', 'Seguridad');
  },
  updateDianConfig: (config) => {
    set(state => ({ dianConfig: { ...state.dianConfig, ...config } }));
    get().addLog('Configuración DIAN de facturación electrónica actualizada.', 'Seguridad');
  },
  setActiveBranch: (branchId) => {
    const branch = get().branches.find(b => b.id === branchId);
    set({ activeBranchId: branchId });
    get().addLog(`Cambio de sede activa a: ${branch?.name || branchId}`, 'Seguridad');
  },
  setActiveRegister: (registerId) => {
    set({ activeRegisterId: registerId });
    get().addLog(`Caja activa asignada: ${registerId.toUpperCase()}`, 'Caja');
  },
  addCustomOrder: (order) => {
    const newOrder = {
      ...order,
      id: `co-${Date.now()}`
    };
    set(state => ({ customOrders: [newOrder, ...state.customOrders] }));
    get().addLog(`Pedido especial agendado para ${order.clientName}`, 'Ventas');
  },
  updateCustomOrderStatus: (id, status) => {
    set(state => ({
      customOrders: state.customOrders.map(o => o.id === id ? { ...o, status } : o)
    }));
    get().addLog(`Estado de pedido especial ${id} cambiado a ${status.toUpperCase()}`, 'Ventas');
  },
  addProductionBatch: (batch) => {
    const newBatch = {
      ...batch,
      id: `pb-${Date.now()}`
    };
    set(state => ({ productionBatches: [newBatch, ...state.productionBatches] }));
    get().addLog(`Lote de producción agendado: ${batch.productName}`, 'Producción');
  },
  executeProductionBatch: (id) => {
    const batch = get().productionBatches.find(b => b.id === id);
    if (!batch || batch.status === 'done') return;
    
    const factor = batch.quantity;
    set(state => ({
      ingredientsStock: state.ingredientsStock.map(ing => {
        if (ing.id === 'ing1') return { ...ing, stock: Math.max(0, ing.stock - (100 * factor)) }; // Harina
        if (ing.id === 'ing2') return { ...ing, stock: Math.max(0, ing.stock - (20 * factor)) }; // Queso/Muzarella
        if (ing.id === 'ing3') return { ...ing, stock: Math.max(0, ing.stock - (5 * factor)) }; // Levadura
        return ing;
      }),
      productionBatches: state.productionBatches.map(b => b.id === id ? { ...b, status: 'done' as const } : b),
      products: state.products.map(p => {
        if (p.name.toLowerCase() === batch.productName.toLowerCase()) {
          return { ...p, stock: p.stock + batch.quantity };
        }
        return p;
      })
    }));
    get().addLog(`Producción ejecutada: ${batch.quantity}x ${batch.productName}`, 'Producción');
  },
  addMermaLog: (merma) => {
    const newLog = { ...merma, id: `ml-${Date.now()}` };
    set(state => ({
      mermaLogs: [newLog, ...state.mermaLogs],
      products: state.products.map(p => {
        if (p.name.toLowerCase() === merma.productName.toLowerCase()) {
          return { ...p, stock: Math.max(0, p.stock - merma.qty) };
        }
        return p;
      })
    }));
    get().addLog(`Merma registrada: ${merma.qty} de ${merma.productName} por ${merma.concept}`, 'Inventario');
  },
  addWarehouseTransfer: (transfer) => {
    const newTransfer = { ...transfer, id: `wt-${Date.now()}` };
    set(state => ({
      warehouseTransfers: [newTransfer, ...state.warehouseTransfers]
    }));
    get().addLog(`Transferencia de stock: ${transfer.qty} de ${transfer.productName} desde ${transfer.fromWarehouse} a ${transfer.toWarehouse}`, 'Inventario');
  },
  payClientCredit: (clientId, amount) => {
    set(state => {
      const currentDebt = state.clientCredits[clientId] || 0;
      const updatedDebt = Math.max(0, currentDebt - amount);
      
      const newMovement = {
        id: `mov-credit-${Date.now()}`,
        type: 'in' as const,
        amount,
        concept: `Abono a Crédito / Cartera - Cliente: ${state.clients.find(c => c.id === clientId)?.name || clientId}`,
        timestamp: new Date().toISOString(),
        user: state.userRole,
        registerId: state.activeRegisterId
      };
      
      return {
        clientCredits: { ...state.clientCredits, [clientId]: updatedDebt },
        cashMovements: [...state.cashMovements, newMovement]
      };
    });
    get().addLog(`Abono de ${get().appConfig.currencySymbol || 'S/'} ${amount} registrado para cliente ${clientId}`, 'Caja');
  },
  adjustIngredientStock: (id, qty) => {
    set(state => ({
      ingredientsStock: state.ingredientsStock.map(ing => ing.id === id ? { ...ing, stock: Math.max(0, ing.stock + qty) } : ing)
    }));
    get().addLog(`Stock de insumo ajustado. ID: ${id}, cambio: ${qty}`, 'Inventario');
  },

  addCategory: (module, category) => {
    set(state => {
      const currentCats = state.categories[module] || [];
      if (currentCats.includes(category)) return {};
      return {
        categories: {
          ...state.categories,
          [module]: [...currentCats, category]
        }
      };
    });
    get().addLog(`Categoría agregada: ${category} en ${module}`, 'Inventario');
  },

  deleteCategory: (module, category) => {
    set(state => {
      const currentCats = state.categories[module] || [];
      return {
        categories: {
          ...state.categories,
          [module]: currentCats.filter(c => c !== category)
        }
      };
    });
    get().addLog(`Categoría eliminada: ${category} en ${module}`, 'Inventario');
  },

  renameCategory: (module, oldName, newName) => {
    set(state => {
      const currentCats = state.categories[module] || [];
      const updatedCats = currentCats.map(c => c === oldName ? newName : c);
      
      // Update all products belonging to this old category
      const updatedProducts = state.products.map(p => {
        if (p.storeType === module && p.category === oldName) {
          return { ...p, category: newName };
        }
        return p;
      });

      return {
        categories: {
          ...state.categories,
          [module]: updatedCats
        },
        products: updatedProducts
      };
    });
    get().addLog(`Categoría renombrada de ${oldName} a ${newName} en ${module}`, 'Inventario');
  },

  activeCarts: {
    hub: [],
    restaurant: [],
    pharmacy: [],
    bakery: [],
    fruit: [],
    business: [],
  },
  cartDiscounts: {
    hub: 0,
    restaurant: 0,
    pharmacy: 0,
    bakery: 0,
    fruit: 0,
    business: 0,
  },
  restaurantTables: initialRestaurantTables(),
  bakeryTables: initialBakeryTables(),
  fruitTables: initialFruitTables(),
  selectedTableId: null,
  cashSession: {
    id: 'session-init',
    openingDate: new Date().toISOString(),
    status: 'open',
    openingCash: 500,
    transactionsCount: 0,
    user: 'Admin',
    registerId: 'caja-1'
  }, // Opened by default for convenience
  cashMovements: [
    { id: 'm-init', type: 'in', amount: 500, concept: 'Saldo Inicial Apertura', timestamp: new Date().toISOString(), user: 'Admin', registerId: 'caja-1' }
  ],
  auditLogs: [
    { id: 'l-init', timestamp: new Date().toISOString(), user: 'Admin', action: 'Sistema Iniciado - Caja Abierta con 500.00', module: 'Seguridad' }
  ],

  // Global Actions
  setModule: (module) => {
    set({ currentModule: module });
    get().addLog(`Cambio a módulo ${module.toUpperCase()}`, 'Navegación');
  },
  
  setUserRole: (role) => {
    set({ userRole: role });
    get().addLog(`Rol de usuario cambiado a: ${role}`, 'Seguridad');
  },
  
  setOperatorName: (name) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_operator_name', name);
    }
    set({ operatorName: name });
  },
  
  addLog: (action, module) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user: get().userRole,
      action,
      module
    };
    set(state => ({ auditLogs: [newLog, ...state.auditLogs].slice(0, 100) }));
  },

  addTable: (module, tableName) => {
    const { restaurantTables, bakeryTables, fruitTables } = get();
    const newTableId = `${module === 'restaurant' ? 'rt' : module === 'bakery' ? 'bt' : 'ft'}-${Date.now()}`;
    const newTable: TableState = {
      id: newTableId,
      name: tableName,
      status: 'free',
      guestsCount: 0,
      cart: [],
    };
    
    if (module === 'restaurant') {
      const updated = [...restaurantTables, newTable];
      set({ restaurantTables: updated });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_restaurant_tables', JSON.stringify(updated));
      }
    } else if (module === 'bakery') {
      const updated = [...bakeryTables, newTable];
      set({ bakeryTables: updated });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_bakery_tables', JSON.stringify(updated));
      }
    } else if (module === 'fruit') {
      const updated = [...fruitTables, newTable];
      set({ fruitTables: updated });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_fruit_tables', JSON.stringify(updated));
      }
    }
    
    get().addLog(`Nueva mesa '${tableName}' agregada al módulo ${module.toUpperCase()}`, 'Navegación');
  },

  // Cart Actions
  addToCart: (item) => {
    const { currentModule, selectedTableId, restaurantTables, bakeryTables, fruitTables } = get();
    
    // Check if adding to table cart instead of direct module cart
    if ((currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit') && selectedTableId) {
      const isRestaurant = currentModule === 'restaurant';
      const isBakery = currentModule === 'bakery';
      const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
      
      const updatedTables = tablesList.map(table => {
        if (table.id === selectedTableId) {
          const existingItemIndex = table.cart.findIndex(i => 
            i.product.id === item.product.id && 
            i.selectedVariant === item.selectedVariant &&
            i.isGenericEquivalent === item.isGenericEquivalent
          );
          
          let updatedCart = [...table.cart];
          if (existingItemIndex > -1) {
            updatedCart[existingItemIndex].quantity += item.quantity;
          } else {
            updatedCart.push(item);
          }
          
          return {
            ...table,
            status: table.status === 'free' ? 'occupied' : table.status,
            cart: updatedCart
          };
        }
        return table;
      }) as TableState[];
      
      if (currentModule === 'restaurant') {
        set({ restaurantTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
        }
      } else if (currentModule === 'bakery') {
        set({ bakeryTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
        }
      } else {
        set({ fruitTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
        }
      }
      
      get().addLog(`Producto '${item.product.name}' añadido a la ${isRestaurant ? 'Mesa' : isBakery ? 'Mesa Café' : 'Mesa Heladería'}`, currentModule);
      return;
    }

    // Direct module checkout cart
    set(state => {
      const currentCart = state.activeCarts[currentModule] || [];
      const existingItemIndex = currentCart.findIndex(i => 
        i.product.id === item.product.id && 
        i.selectedVariant === item.selectedVariant &&
        i.isGenericEquivalent === item.isGenericEquivalent
      );
      
      let updatedCart = [...currentCart];
      if (existingItemIndex > -1) {
        updatedCart[existingItemIndex].quantity += item.quantity;
      } else {
        updatedCart.push(item);
      }
      
      return {
        activeCarts: {
          ...state.activeCarts,
          [currentModule]: updatedCart
        }
      };
    });
    
    get().addLog(`Producto '${item.product.name}' añadido al carrito`, currentModule);
  },

  removeFromCart: (productId) => {
    const { currentModule, selectedTableId, restaurantTables, bakeryTables, fruitTables } = get();

    if ((currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit') && selectedTableId) {
      const isRestaurant = currentModule === 'restaurant';
      const isBakery = currentModule === 'bakery';
      const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
      
      const updatedTables = tablesList.map(table => {
        if (table.id === selectedTableId) {
          const updatedCart = table.cart.filter(item => item.product.id !== productId);
          return {
            ...table,
            cart: updatedCart,
            status: updatedCart.length === 0 ? 'free' : table.status
          };
        }
        return table;
      }) as TableState[];

      if (currentModule === 'restaurant') {
        set({ restaurantTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
        }
      } else if (currentModule === 'bakery') {
        set({ bakeryTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
        }
      } else {
        set({ fruitTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
        }
      }
      return;
    }

    set(state => {
      const currentCart = state.activeCarts[currentModule] || [];
      return {
        activeCarts: {
          ...state.activeCarts,
          [currentModule]: currentCart.filter(item => item.product.id !== productId)
        }
      };
    });
  },

  updateCartQty: (productId, qty, weight) => {
    const { currentModule, selectedTableId, restaurantTables, bakeryTables, fruitTables } = get();

    if ((currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit') && selectedTableId) {
      const isRestaurant = currentModule === 'restaurant';
      const isBakery = currentModule === 'bakery';
      const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
      
      const updatedTables = tablesList.map(table => {
        if (table.id === selectedTableId) {
          const updatedCart = table.cart.map(item => {
            if (item.product.id === productId) {
              return { ...item, quantity: qty };
            }
            return item;
          });
          return { ...table, cart: updatedCart };
        }
        return table;
      }) as TableState[];

      if (currentModule === 'restaurant') {
        set({ restaurantTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
        }
      } else if (currentModule === 'bakery') {
        set({ bakeryTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
        }
      } else {
        set({ fruitTables: updatedTables });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
        }
      }
      return;
    }

    set(state => {
      const currentCart = state.activeCarts[currentModule] || [];
      const updatedCart = currentCart.map(item => {
        if (item.product.id === productId) {
          return { 
            ...item, 
            quantity: qty, 
            weight: weight !== undefined ? weight : item.weight 
          };
        }
        return item;
      });
      
      return {
        activeCarts: {
          ...state.activeCarts,
          [currentModule]: updatedCart
        }
      };
    });
  },

  applyDiscount: (percentage) => {
    const { currentModule } = get();
    set(state => ({
      cartDiscounts: {
        ...state.cartDiscounts,
        [currentModule]: percentage
      }
    }));
    get().addLog(`Descuento de ${percentage}% aplicado al carrito`, currentModule);
  },

  clearCart: () => {
    const { currentModule, selectedTableId, restaurantTables, bakeryTables, fruitTables } = get();

    if ((currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit') && selectedTableId) {
      const isRestaurant = currentModule === 'restaurant';
      const isBakery = currentModule === 'bakery';
      const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
      
      const updatedTables = tablesList.map(table => {
        if (table.id === selectedTableId) {
          return { ...table, cart: [], status: 'free' as const, guestsCount: 0 };
        }
        return table;
      }) as TableState[];

      if (currentModule === 'restaurant') {
        set({ restaurantTables: updatedTables, selectedTableId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
        }
      } else if (currentModule === 'bakery') {
        set({ bakeryTables: updatedTables, selectedTableId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
        }
      } else {
        set({ fruitTables: updatedTables, selectedTableId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
        }
      }
      return;
    }

    set(state => ({
      activeCarts: {
        ...state.activeCarts,
        [currentModule]: []
      },
      cartDiscounts: {
        ...state.cartDiscounts,
        [currentModule]: 0
      }
    }));
  },

  // Table Seating Actions
  selectTable: (tableId) => {
    set({ selectedTableId: tableId });
  },

  updateTableStatus: (tableId, status) => {
    const { currentModule, restaurantTables, bakeryTables, fruitTables } = get();
    const isRestaurant = currentModule === 'restaurant';
    const isBakery = currentModule === 'bakery';
    const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
    
    const updatedTables = tablesList.map(t => {
      if (t.id === tableId) {
        return { 
          ...t, 
          status,
          cart: status === 'free' ? [] : t.cart 
        };
      }
      return t;
    }) as TableState[];

    if (currentModule === 'restaurant') {
      set({ restaurantTables: updatedTables });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
      }
    } else if (currentModule === 'bakery') {
      set({ bakeryTables: updatedTables });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
      }
    } else {
      set({ fruitTables: updatedTables });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
      }
    }
    get().addLog(`Mesa ${tableId.split('-')[1]} estado cambiado a ${status.toUpperCase()}`, currentModule);
  },

  updateTableGuests: (tableId, guests) => {
    const { currentModule, restaurantTables, bakeryTables, fruitTables } = get();
    const isRestaurant = currentModule === 'restaurant';
    const isBakery = currentModule === 'bakery';
    const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
    
    const updatedTables = tablesList.map(t => {
      if (t.id === tableId) {
        return { ...t, guestsCount: guests };
      }
      return t;
    }) as TableState[];

    if (currentModule === 'restaurant') {
      set({ restaurantTables: updatedTables });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
      }
    } else if (currentModule === 'bakery') {
      set({ bakeryTables: updatedTables });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
      }
    } else {
      set({ fruitTables: updatedTables });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
      }
    }
  },

  saveCartToTable: (tableId) => {
    // Already persistently saved reactive state in table.cart in `addToCart`
  },

  loadCartFromTable: (tableId) => {
    // Tables persistent cart resides inside `restaurantTables`/`bakeryTables` records
  },

  // Checkout Action
  processCheckout: (paymentMethod, cashReceived, tipAmount = 0, orderType = 'mesa', clientId = 'c-gen') => {
    const { 
      currentModule, activeCarts, cartDiscounts, selectedTableId, 
      restaurantTables, bakeryTables, fruitTables, cashSession, companyConfig, dianConfig, activeBranchId, activeRegisterId 
    } = get();
    
    if (!cashSession || cashSession.status === 'closed') {
      return { success: false, change: 0 };
    }

    const isTableSale = (currentModule === 'restaurant' || currentModule === 'bakery' || currentModule === 'fruit') && selectedTableId;
    let items: CartItem[] = [];
    let discountPercent = 0;
    let tableName = '';

    if (isTableSale) {
      const isRestaurant = currentModule === 'restaurant';
      const tablesList = isRestaurant ? restaurantTables : bakeryTables;
      const table = tablesList.find(t => t.id === selectedTableId);
      if (table) {
        items = table.cart;
        tableName = table.name;
      }
      discountPercent = cartDiscounts[currentModule]; // Get general discount
    } else {
      items = activeCarts[currentModule] || [];
      discountPercent = cartDiscounts[currentModule] || 0;
    }

    if (items.length === 0) {
      return { success: false, change: 0 };
    }

    // Calculations
    const subtotal = items.reduce((acc, item) => {
      const price = item.isGenericEquivalent ? (item.product.costPrice * 1.5) : item.product.salePrice; // Generic is cheaper
      const multiplier = item.weight || item.quantity;
      return acc + (price * multiplier);
    }, 0);

    const discountAmount = subtotal * (discountPercent / 100);
    const tax = (subtotal - discountAmount) * (companyConfig.taxRate / 100);
    const total = (subtotal - discountAmount) + tipAmount;

    if (paymentMethod === 'cash' && cashReceived < total) {
      return { success: false, change: 0 };
    }

    // Check negative inventory constraints
    if (!companyConfig.negativeInventoryAllowed) {
      const isOut = items.some(item => {
        const qtyToDeduct = item.weight ? Math.ceil(item.weight) : item.quantity;
        return item.product.stock < qtyToDeduct;
      });
      if (isOut) {
        get().addLog(`ERROR: Intento de checkout con stock insuficiente (Inventario Negativo bloqueado)`, 'Inventario');
        return { success: false, change: 0 };
      }
    }

    const change = paymentMethod === 'cash' ? (cashReceived - total) : 0;
    
    // Auto increment DIAN invoice number
    const currentInvoiceNum = dianConfig.currentNumber;
    const ticketNumber = `${dianConfig.prefix}-${currentInvoiceNum}`;
    const cufeHash = `CUFE-${Math.random().toString(16).substring(2, 10).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticketNumber,
      timestamp: new Date().toISOString(),
      storeType: currentModule as any,
      items,
      subtotal,
      tax,
      discount: discountAmount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashReceived : total,
      changeGiven: change,
      cashier: get().userRole,
      tableName: tableName || undefined,
      tipAmount,
      orderType,
      branchId: activeBranchId,
      registerId: activeRegisterId
    };

    // Deduct stock and check replenishment warnings, recording stock movements (Kardex)
    const activeUser = get().activeSession;
    const movementsToRegister: StockMovement[] = [];
    const updatedProducts = get().products.map(p => {
      const cartMatch = items.find(item => item.product.id === p.id);
      if (cartMatch) {
        const qtyToDeduct = cartMatch.weight ? Math.ceil(cartMatch.weight) : cartMatch.quantity;
        const prevStock = p.stock;
        const newStock = Math.max(0, p.stock - qtyToDeduct);
        
        movementsToRegister.push({
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          type: 'out',
          quantity: qtyToDeduct,
          previousStock: prevStock,
          newStock,
          concept: `Venta POS: ${ticketNumber}`,
          userId: activeUser?.id || 'admin',
          userName: activeUser?.fullName || get().operatorName || 'System',
          timestamp: new Date().toISOString()
        });

        if (newStock <= p.minStock) {
          // Log low stock alert
          setTimeout(() => {
            get().addLog(`ALERTA: Stock mínimo alcanzado para '${p.name}' (Stock actual: ${newStock})`, 'Inventario');
          }, 100);
        }
        return { ...p, stock: newStock };
      }
      return p;
    });

    // Deduct recipe raw ingredients from stock
    let updatedIngredients = [...get().ingredientsStock];
    items.forEach(item => {
      if (item.product.ingredients) {
        item.product.ingredients.forEach(ing => {
          const qtyNeededTotal = ing.qtyNeeded * item.quantity;
          updatedIngredients = updatedIngredients.map(ingStock => {
            if (ingStock.id === ing.ingredientId || ingStock.name === ing.name) {
              return { ...ingStock, stock: Math.max(0, ingStock.stock - qtyNeededTotal) };
            }
            return ingStock;
          });
        });
      }
    });

    // Handle Client Credit Sales
    let updatedCredits = { ...get().clientCredits };
    if (paymentMethod === 'credit' && clientId) {
      updatedCredits[clientId] = (updatedCredits[clientId] || 0) + total;
      get().addLog(`Crédito otorgado: ${get().appConfig.currencySymbol || 'S/'} ${total.toFixed(2)} cargado a la cartera de ${clientId}`, 'Caja');
    }

    // Update table states if table checkout
    if (isTableSale) {
      const isRestaurant = currentModule === 'restaurant';
      const isBakery = currentModule === 'bakery';
      const tablesList = isRestaurant ? restaurantTables : isBakery ? bakeryTables : fruitTables;
      const updatedTables = tablesList.map(t => {
        if (t.id === selectedTableId) {
          return { ...t, cart: [], status: 'free' as const, guestsCount: 0 };
        }
        return t;
      }) as TableState[];

      if (currentModule === 'restaurant') {
        set({ restaurantTables: updatedTables, selectedTableId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_restaurant_tables', JSON.stringify(updatedTables));
        }
      } else if (currentModule === 'bakery') {
        set({ bakeryTables: updatedTables, selectedTableId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_bakery_tables', JSON.stringify(updatedTables));
        }
      } else {
        set({ fruitTables: updatedTables, selectedTableId: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('pos_fruit_tables', JSON.stringify(updatedTables));
        }
      }
    } else {
      // Clear standard checkout cart
      set(state => ({
        activeCarts: {
          ...state.activeCarts,
          [currentModule]: []
        },
        cartDiscounts: {
          ...state.cartDiscounts,
          [currentModule]: 0
        }
      }));
    }

    // Register cash register session update
    const sessionUpdate: CashSession = {
      ...cashSession,
      transactionsCount: cashSession.transactionsCount + 1,
    };

    // Log cash movement if cash sale
    const cashMovements = [...get().cashMovements];
    if (paymentMethod === 'cash') {
      const movement: CashMovement = {
        id: `mov-${Date.now()}`,
        type: 'in',
        amount: total,
        concept: `Venta POS (${ticketNumber}) - ${currentModule.toUpperCase()}`,
        timestamp: new Date().toISOString(),
        user: get().userRole,
        registerId: activeRegisterId
      };
      cashMovements.push(movement);
    }

    // Increment DIAN numbering
    const nextInvoiceNum = currentInvoiceNum + 1;

    // Save to SQLite via IPC
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.dbSaveSale(newSale);
      
      // Print Ticket silently if configured
      if (get().appConfig.ticketPrinter) {
        const ticketHtml = generateTicketHtml(newSale, get().appConfig, get().companyConfig);
        (window as any).electronAPI.printTicket(ticketHtml, get().appConfig.ticketPrinter)
          .catch((err: any) => console.error("Error printing ticket:", err));
      }
    }

    set(state => ({
      products: updatedProducts,
      ingredientsStock: updatedIngredients,
      clientCredits: updatedCredits,
      sales: [newSale, ...state.sales],
      cashSession: sessionUpdate,
      cashMovements,
      dianConfig: { ...state.dianConfig, currentNumber: nextInvoiceNum },
      stockMovements: [...movementsToRegister, ...state.stockMovements]
    }));

    get().addLog(`Venta procesada exitosamente. Factura: ${ticketNumber}, Total: ${get().appConfig.currencySymbol || 'S/'} ${total.toFixed(2)} (CUFE: ${cufeHash.substring(0, 15)}...)`, currentModule);

    return { success: true, change, sale: newSale };
  },

  // Inventory Actions
  addProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: `p-new-${Date.now()}`,
    };
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.dbSaveProduct(newProduct);
    }
    set(state => ({ products: [...state.products, newProduct] }));
    get().addLog(`Producto creado: ${product.name} (SKU: ${product.sku})`, 'Inventario');
  },

  updateProduct: (product) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.dbSaveProduct(product);
    }
    set(state => ({
      products: state.products.map(p => p.id === product.id ? product : p)
    }));
    get().addLog(`Producto actualizado: ${product.name}`, 'Inventario');
  },

  adjustStock: (productId, quantity, type, concept) => {
    let prevStock = 0;
    let newStock = 0;
    let prodName = '';
    let prodSku = '';
    
    set(state => {
      const updatedProducts = state.products.map(p => {
        if (p.id === productId) {
          prevStock = p.stock;
          const netChange = type === 'in' ? quantity : -quantity;
          newStock = Math.max(0, p.stock + netChange);
          prodName = p.name;
          prodSku = p.sku;
          return { ...p, stock: newStock };
        }
        return p;
      });
      return { products: updatedProducts };
    });

    const activeUser = get().activeSession;
    get().addStockMovement({
      productId,
      productName: prodName || productId,
      productSku: prodSku || '',
      type: type === 'in' ? 'in' : 'out',
      quantity,
      previousStock: prevStock,
      newStock,
      concept,
      userId: activeUser?.id || 'admin',
      userName: activeUser?.fullName || get().operatorName || 'System',
    });

    get().addLog(`Ajuste de stock (${type.toUpperCase()}): ${prodName || productId} x${quantity} - Concepto: ${concept}`, 'Inventario');
  },

  deleteProduct: (productId) => {
    const prod = get().products.find(p => p.id === productId);
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.dbDeleteProduct(productId);
    }
    set(state => ({
      products: state.products.filter(p => p.id !== productId)
    }));
    if (prod) get().addLog(`Producto eliminado: ${prod.name}`, 'Inventario');
  },

  addIngredient: (ingredient) => {
    const newIngredient: IngredientStock = {
      ...ingredient,
      id: `ing-${Date.now()}`
    };
    set(state => ({
      ingredientsStock: [...state.ingredientsStock, newIngredient]
    }));
    get().addLog(`Ingrediente creado: ${ingredient.name}`, 'Inventario');
  },

  // Caja (Cash Register) Actions
  openCaja: (openingCash, user) => {
    const newSession: CashSession = {
      id: `session-${Date.now()}`,
      openingDate: new Date().toISOString(),
      status: 'open',
      openingCash,
      transactionsCount: 0,
      user,
      registerId: get().activeRegisterId
    };

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      type: 'in',
      amount: openingCash,
      concept: 'Apertura de Caja',
      timestamp: new Date().toISOString(),
      user,
      registerId: get().activeRegisterId
    };

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.dbSaveRegister(newSession);
    }

    set(state => ({
      cashSession: newSession,
      cashMovements: [...state.cashMovements, newMovement],
    }));
    get().addLog(`Caja Abierta por ${user} con ${get().appConfig.currencySymbol || 'S/'} ${openingCash}`, 'Caja');
  },

  closeCaja: (closingCash) => {
    const { cashSession, cashMovements, sales } = get();
    if (!cashSession) return;

    const sessionRegisterId = cashSession.registerId;

    // Calculate expected cash in drawer using session's own registerId
    const totalCashSales = sales
      .filter(s => s.paymentMethod === 'cash' && s.registerId === sessionRegisterId)
      .reduce((acc, s) => acc + s.total, 0);

    const cashIns = cashMovements
      .filter(m => m.type === 'in' && m.concept !== 'Apertura de Caja' && m.registerId === sessionRegisterId)
      .reduce((acc, m) => acc + m.amount, 0);

    const cashOuts = cashMovements
      .filter(m => m.type === 'out' && m.registerId === sessionRegisterId)
      .reduce((acc, m) => acc + m.amount, 0);

    const calculatedCash = cashSession.openingCash + totalCashSales + cashIns - cashOuts;
    const difference = closingCash - calculatedCash;

    const closedSession: CashSession = {
      ...cashSession,
      status: 'closed',
      closingDate: new Date().toISOString(),
      closingCash,
      calculatedCash,
      difference
    };

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.dbSaveRegister(closedSession);
    }

    set({ cashSession: closedSession });
    get().addLog(`Caja Cerrada. Diferencia: ${get().appConfig.currencySymbol || 'S/'} ${difference.toFixed(2)} (Arqueo: ${get().appConfig.currencySymbol || 'S/'} ${closingCash.toFixed(2)}, Esperado: ${get().appConfig.currencySymbol || 'S/'} ${calculatedCash.toFixed(2)})`, 'Caja');
  },

  addCashMovement: (type, amount, concept) => {
    const { cashSession, userRole, activeRegisterId } = get();
    if (!cashSession || cashSession.status === 'closed') return;

    const movement: CashMovement = {
      id: `mov-${Date.now()}`,
      type,
      amount,
      concept,
      timestamp: new Date().toISOString(),
      user: userRole,
      registerId: activeRegisterId
    };

    set(state => ({
      cashMovements: [...state.cashMovements, movement]
    }));
    get().addLog(`Movimiento de Caja (${type.toUpperCase()}): ${get().appConfig.currencySymbol || 'S/'} ${amount.toFixed(2)} - Concepto: ${concept}`, 'Caja');
  },

  // Clients & Suppliers Actions
  addClient: (client) => {
    const newClient: Client = {
      ...client,
      id: `c-new-${Date.now()}`,
      totalSpent: 0,
      visitsCount: 0,
    };
    set(state => ({ clients: [...state.clients, newClient] }));
    get().addLog(`Cliente registrado: ${client.name}`, 'Clientes');
  },

  updateClient: (client) => {
    set(state => ({
      clients: state.clients.map(c => c.id === client.id ? client : c)
    }));
    get().addLog(`Cliente actualizado: ${client.name}`, 'Clientes');
  },

  deleteClient: (clientId) => {
    const client = get().clients.find(c => c.id === clientId);
    set(state => ({
      clients: state.clients.filter(c => c.id !== clientId)
    }));
    get().addLog(`Cliente eliminado: ${client?.name || clientId}`, 'Clientes');
  },

  addSupplier: (supplier) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: `s-new-${Date.now()}`,
      totalPurchases: 0
    };
    set(state => ({ suppliers: [...state.suppliers, newSupplier] }));
    get().addLog(`Proveedor registrado: ${supplier.name}`, 'Proveedores');
  },

  updateSupplier: (supplier) => {
    set(state => ({
      suppliers: state.suppliers.map(s => s.id === supplier.id ? supplier : s)
    }));
    get().addLog(`Proveedor actualizado: ${supplier.name}`, 'Proveedores');
  },

  deleteSupplier: (supplierId) => {
    const supplier = get().suppliers.find(s => s.id === supplierId);
    set(state => ({
      suppliers: state.suppliers.filter(s => s.id !== supplierId)
    }));
    get().addLog(`Proveedor eliminado: ${supplier?.name || supplierId}`, 'Proveedores');
  },

  purchaseFromSupplier: (supplierId, productId, qty, costPrice) => {
    // Increase stock
    set(state => ({
      products: state.products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stock: p.stock + qty,
            costPrice // Update cost price
          };
        }
        return p;
      }),
      suppliers: state.suppliers.map(s => {
        if (s.id === supplierId) {
          return { ...s, totalPurchases: s.totalPurchases + (costPrice * qty) };
        }
        return s;
      })
    }));

    const prod = get().products.find(p => p.id === productId);
    const sup = get().suppliers.find(s => s.id === supplierId);
    get().addLog(`Compra registrada a ${sup?.name || supplierId}: ${prod?.name || productId} x${qty} a ${get().appConfig.currencySymbol || 'S/'} ${costPrice.toFixed(2)} c/u`, 'Proveedores');
  },

  // Quotes Actions
  addQuote: (clientName, items, isElectronicInvoice = false) => {
    const code = `COT-${Date.now().toString().substr(-6)}`;
    const subtotal = items.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
    const tax = subtotal * (get().companyConfig.taxRate / 100);
    const total = subtotal + tax;

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      code,
      date: new Date().toISOString(),
      clientName,
      items,
      subtotal,
      tax,
      discount: 0,
      total,
      status: 'pending',
      isElectronicInvoice,
      cufe: isElectronicInvoice ? `CUFE-${Math.random().toString(16).substring(2, 10).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}` : undefined
    };

    set(state => ({ quotes: [...state.quotes, newQuote] }));
    get().addLog(`Cotización creada: ${code} para ${clientName}`, 'Cotizaciones');
  },

  convertQuoteToSale: (quoteId) => {
    const { quotes, currentModule } = get();
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote || quote.status === 'converted') return;

    // Load items into active cart
    set(state => ({
      activeCarts: {
        ...state.activeCarts,
        [currentModule]: quote.items
      },
      quotes: state.quotes.map(q => q.id === quoteId ? { ...q, status: 'converted' as const } : q)
    }));

    get().addLog(`Cotización ${quote.code} cargada al carrito de venta`, 'Cotizaciones');
  },

  deleteQuote: (quoteId) => {
    const quote = get().quotes.find(q => q.id === quoteId);
    set(state => ({
      quotes: state.quotes.filter(q => q.id !== quoteId)
    }));
    get().addLog(`Cotización eliminada: ${quote?.code || quoteId}`, 'Cotizaciones');
  },

  // Barcode Scanning simulator
  scanBarcode: (barcode) => {
    const { currentModule, products } = get();
    // Search in inventory for matching barcode in active vertical
    const product = products.find(p => p.barcode === barcode && p.storeType === currentModule);
    if (product) {
      get().addToCart({
        product,
        quantity: 1,
        discountPercentage: 0
      });
      return true;
    }
    return false;
  },

  // Backup / Restore data simulation
  backupData: () => {
    const backupObj = {
      products: get().products,
      clients: get().clients,
      suppliers: get().suppliers,
      sales: get().sales,
      quotes: get().quotes,
      cashMovements: get().cashMovements,
      auditLogs: get().auditLogs,
      companyConfig: get().companyConfig,
      dianConfig: get().dianConfig,
      branches: get().branches,
      activeBranchId: get().activeBranchId,
      activeRegisterId: get().activeRegisterId,
      customOrders: get().customOrders,
      ingredientsStock: get().ingredientsStock,
      productionBatches: get().productionBatches,
      mermaLogs: get().mermaLogs,
      warehouseTransfers: get().warehouseTransfers,
      clientCredits: get().clientCredits
    };
    get().addLog('Respaldo de Base de Datos generado con éxito', 'Seguridad');
    return JSON.stringify(backupObj, null, 2);
  },

  restoreData: (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products && data.clients && data.suppliers) {
        set({
          products: data.products,
          clients: data.clients,
          suppliers: data.suppliers,
          sales: data.sales || [],
          quotes: data.quotes || [],
          cashMovements: data.cashMovements || [],
          auditLogs: data.auditLogs || [],
          companyConfig: data.companyConfig || get().companyConfig,
          dianConfig: data.dianConfig || get().dianConfig,
          branches: data.branches || get().branches,
          activeBranchId: data.activeBranchId || get().activeBranchId,
          activeRegisterId: data.activeRegisterId || get().activeRegisterId,
          customOrders: data.customOrders || get().customOrders,
          ingredientsStock: data.ingredientsStock || get().ingredientsStock,
          productionBatches: data.productionBatches || get().productionBatches,
          mermaLogs: data.mermaLogs || get().mermaLogs,
          warehouseTransfers: data.warehouseTransfers || get().warehouseTransfers,
          clientCredits: data.clientCredits || get().clientCredits
        });
        get().addLog('Base de Datos restaurada desde copia de seguridad', 'Seguridad');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}));
