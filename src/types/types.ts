export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number; // Precio de mayoreo
  stock: number;
  minStock: number;
  maxStock?: number;
  description: string;
  variants?: string[];
  storeType: 'restaurant' | 'pharmacy' | 'bakery' | 'fruit' | 'business';
  isControlled?: boolean; // For Pharmacy
  genericEquivalent?: string; // For Pharmacy brand name -> generic equivalent
  isGeneric?: boolean; // For Pharmacy
  expirationDate?: string; // For Pharmacy & Heladería/Panadería
  lotNumber?: string; // For Pharmacy & Heladería
  ingredients?: { ingredientId: string; name: string; qtyNeeded: number; unit: string }[]; // For Recipes (Restaurante/Panadería)
  brand?: string; // For Almacén
  isBulk?: boolean; // Si se vende a granel (decimal)
  trackInventory?: boolean; // Si controla inventario
  imageUrl?: string; // URL o base64 de imagen del producto
  supplierId?: string; // Proveedor asociado
  active?: boolean; // Si el producto está activo
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercentage: number;
  weight?: number; // For Fruit Shop (in kg)
  selectedVariant?: string;
  isGenericEquivalent?: boolean; // Pharmacy flag
  selectedSize?: string; // For Almacén
  selectedColor?: string; // For Almacén
  flavors?: string[]; // For Heladería scoop selections
  toppings?: string[]; // For Heladería toppings
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalSpent: number;
  visitsCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  representative?: string; // Representante comercial
  website?: string; // Página web
  comments?: string; // Notas adicionales
  totalPurchases: number;
  isAgro?: boolean; // For agricultural providers
}

export interface Quote {
  id: string;
  code: string;
  date: string;
  clientName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'converted';
  isElectronicInvoice?: boolean; // Simulated invoice flag
  cufe?: string; // DIAN electronic validation ID
}

export interface CashMovement {
  id: string;
  type: 'in' | 'out';
  amount: number;
  concept: string;
  timestamp: string;
  user: string;
  registerId?: string; // Multicaja support
}

export interface CashSession {
  id: string;
  openingDate: string;
  closingDate?: string;
  status: 'open' | 'closed';
  openingCash: number;
  closingCash?: number;
  calculatedCash?: number;
  difference?: number;
  transactionsCount: number;
  user: string;
  registerId: string; // Multicaja support
}

export interface Sale {
  id: string;
  ticketNumber: string;
  timestamp: string;
  storeType: 'restaurant' | 'pharmacy' | 'bakery' | 'fruit' | 'business';
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'credit' | 'datafono';
  cashReceived: number;
  changeGiven: number;
  cashier: string;
  tableName?: string; // If sold to a table
  tipAmount?: number; // Restaurant support
  orderType?: 'mesa' | 'llevar' | 'domicilio'; // Restaurant support
  branchId?: string; // Multisucursal support
  registerId?: string; // Multicaja support
  invoiceName?: string; // For billing
  invoiceNit?: string; // For billing
}

export interface TableState {
  id: string;
  name: string;
  status: 'free' | 'occupied' | 'billing' | 'reserved'; // Added reserved status
  guestsCount: number;
  cart: CartItem[];
  reservationName?: string;
  reservationTime?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
}

export interface CompanyConfig {
  name: string;
  socialReason: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  taxRate: number;
  allowDiscounts: boolean;
  maxDiscount: number;
  requireDiscountAuth: boolean;
  allowReturns: boolean;
  autoPrint: boolean;
  negativeInventoryAllowed: boolean;
  stockMinDefault: number;
  alertReposition: boolean;
  autoBackup: boolean;
  backupFrequency: 'diario' | 'semanal' | 'mensual';
  backupLocation: string;
}

export interface DianConfig {
  resolution: string;
  prefix: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
}

export interface BranchState {
  id: string;
  name: string;
  address: string;
  code: string;
}

export interface CustomOrder {
  id: string;
  clientName: string;
  phone: string;
  details: string;
  deliveryDate: string;
  status: 'pending' | 'completed';
  price: number;
}

export interface IngredientStock {
  id: string;
  name: string;
  stock: number;
  unit: string;
  costPrice: number;
}

export interface ProductionBatch {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  cost: number;
  status: 'scheduled' | 'done';
}

export interface MermaLog {
  id: string;
  date: string;
  productName: string;
  qty: number;
  unit: string;
  concept: string; // "dañado", "vencido", "desperdicio"
  cost: number;
}

export interface WarehouseTransfer {
  id: string;
  date: string;
  productName: string;
  qty: number;
  fromWarehouse: string;
  toWarehouse: string;
  status: string;
}

export type StoreType = 'hub' | 'restaurant' | 'pharmacy' | 'bakery' | 'fruit' | 'business';
export type UserRole = 'Admin' | 'Cajero' | 'Mozo';

// ============================================================
// NEW TYPES FOR ADVANCED POS SYSTEM
// ============================================================

export interface UserPermissions {
  ventas: { access: boolean; nuevo: boolean; cobrar: boolean; descuentos: boolean; cotizaciones: boolean };
  inventario: { access: boolean; entradas: boolean; salidas: boolean; ajustes: boolean; exportar: boolean };
  caja: { access: boolean; apertura: boolean; cierre: boolean; movimientos: boolean; reportes: boolean };
  kardex: { access: boolean };
  corte: { access: boolean };
  reporteVentas: { access: boolean };
  usuarios: { access: boolean };
  compras: { access: boolean };
  otros: { access: boolean };
}

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string; // Stored as simple hash for local storage
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: string;
}

export interface AppConfig {
  isConfigured: boolean; // If onboarding has been completed
  companyName: string;
  tagLine: string;
  address: string;
  email: string;
  phone: string;
  taxId: string; // NIT / RUC / CI
  taxIdType: string; // Tipo de Identificador
  currency: string;
  currencySymbol: string;
  country: string;
  taxEnabled: boolean;
  taxRate: number;
  logoBase64?: string; // Logo as base64 image
  cashierName: string; // Nombre de la caja
  ticketPrinter?: string; // Nombre de la impresora termica

  printFormat: '80mm' | 'A4' | '58mm';
  // Ticket template settings
  ticketFont: string;
  ticketShowLogo: boolean;
  ticketCustomText: string;
  ticketShowBusinessData: boolean;
  onboardingDate?: string; // Fecha de finalización del onboarding
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  concept: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  receivedAt?: string;
  status: 'pending' | 'received' | 'cancelled';
  items: { productId: string; productName: string; quantity: number; costPrice: number }[];
  total: number;
  userId: string;
}
