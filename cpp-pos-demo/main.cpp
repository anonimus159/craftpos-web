#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <algorithm>
#include <iomanip>
#include <chrono>
#include <fstream>
#include <sstream>
#include <ctime>
#include <cmath>

#ifdef _WIN32
#include <windows.h>
#ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
#define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x0004
#endif
void enableColors() {
    HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
    if (hOut == INVALID_HANDLE_VALUE) return;
    DWORD dwMode = 0;
    if (!GetConsoleMode(hOut, &dwMode)) return;
    dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
    SetConsoleMode(hOut, dwMode);
}
#else
void enableColors() {}
#endif

using namespace std;

// ANSI Colors
#define RESET   "\033[0m"
#define RED     "\033[1;31m"
#define GREEN   "\033[1;32m"
#define YELLOW  "\033[1;33m"
#define BLUE    "\033[1;34m"
#define MAGENTA "\033[1;35m"
#define CYAN    "\033[1;36m"
#define WHITE   "\033[1;37m"
#define GRAY    "\033[90m"

// Structures
struct Product {
    string id;
    string name;
    string category;
    string barcode;
    string sku;
    double costPrice;
    double salePrice;
    int stock;
    string storeType; // "restaurant", "pharmacy", "bakery", "fruit", "business"
    bool isBulk;
};

struct CartItem {
    Product product;
    int quantity;
    double weight; // For bulk products
};

struct TableState {
    string id;
    string name;
    string status; // "free", "occupied", "billing", "reserved"
    int guestsCount;
    vector<CartItem> cart;
    string reservationName;
    string reservationTime;
};

struct AppConfig {
    string companyName = "CodeCraft POS";
    string currency = "COP";
    string currencySymbol = "$";
    double taxRate = 19.0;
};

struct UserPermissions {
    bool ventas = true;
    bool inventario = true;
    bool caja = true;
    bool compras = true;
    bool usuarios = true;
};

struct AppUser {
    string id;
    string username;
    string fullName;
    string password;
    string role; // "Admin" or "Cajero"
    UserPermissions permissions;
    bool isActive = true;
};

struct Supplier {
    string id;
    string name;
    string email;
    string phone;
    string companyName;
    double totalPurchases = 0.0;
};

struct PurchaseItem {
    string productId;
    string productName;
    int quantity;
    double costPrice;
};

struct PurchaseOrder {
    string id;
    string supplierId;
    string supplierName;
    string status; // "pending", "received", "cancelled"
    vector<PurchaseItem> items;
    double total = 0.0;
    string createdAt;
};

struct Quote {
    string id;
    string clientName;
    vector<CartItem> items;
    double subtotal = 0.0;
    double tax = 0.0;
    double total = 0.0;
    string status; // "pending", "converted", "deleted"
    string date;
    bool isElectronicInvoice = false;
    string code;
};

struct LicenseState {
    bool isGlobalLicensed = false;
    string globalLicenseKey = "";
    map<string, bool> licensedModules;
    map<string, string> moduleLicenseKeys;
    long long installationTime = 0; // Timestamp
    bool isTrialExpired = false;
};

struct CajaMovement {
    string type; // "IN", "OUT"
    double amount;
    string concept;
    string timestamp;
};

struct CajaState {
    bool isOpen = false;
    double openingCash = 0.0;
    double currentCash = 0.0;
    string openingDate = "";
    vector<CajaMovement> movements;
};

// Global Store State
string currentModule = "hub";
vector<Product> products;
vector<TableState> restaurantTables;
vector<TableState> bakeryTables;
vector<TableState> fruitTables;
string selectedTableId = "";
map<string, vector<CartItem>> activeCarts;
AppConfig config;
LicenseState license;
CajaState caja;
vector<string> auditLogs;

// Advanced modules global states
vector<AppUser> appUsers;
AppUser activeSession;
bool hasActiveSession = false;
vector<Supplier> suppliers;
vector<PurchaseOrder> purchaseOrders;
vector<Quote> quotes;

// License base36 helper
string toBase36(int num) {
    string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    string res = "";
    if (num == 0) return "0000";
    while (num > 0) {
        res += chars[num % 36];
        num /= 36;
    }
    reverse(res.begin(), res.end());
    while (res.length() < 4) {
        res = "0" + res;
    }
    return res;
}

// License Validators
bool validateLicenseKey(const string& rawKey) {
    string key = rawKey;
    key.erase(remove_if(key.begin(), key.end(), ::isspace), key.end());
    if (key.length() != 29) return false;
    if (key.substr(0, 4) != "POS-") return false;
    if (key[9] != '-' || key[14] != '-' || key[19] != '-' || key[24] != '-') return false;
    
    string s1 = key.substr(4, 4);
    string s2 = key.substr(10, 4);
    string s3 = key.substr(15, 4);
    string s4 = key.substr(20, 4);
    string s5 = key.substr(25, 4);
    
    auto uppercase = [](string s) {
        for (auto& c : s) c = toupper(c);
        return s;
    };
    s1 = uppercase(s1);
    s2 = uppercase(s2);
    s3 = uppercase(s3);
    s4 = uppercase(s4);
    s5 = uppercase(s5);
    
    string combined = s1 + s2 + s3 + s4;
    int sum = 0;
    for (int i = 0; i < (int)combined.length(); i++) {
        sum += (int)combined[i] * (i + 1);
    }
    
    int rem = sum % 1679616;
    string expectedS5 = toBase36(rem);
    
    return s5 == expectedS5;
}

bool validateLicenseKeyForModule(const string& rawKey, const string& module) {
    string key = rawKey;
    key.erase(remove_if(key.begin(), key.end(), ::isspace), key.end());
    if (key.length() != 29) return false;
    if (key.substr(0, 4) != "POS-") return false;
    if (key[9] != '-' || key[14] != '-' || key[19] != '-' || key[24] != '-') return false;
    
    string s1 = key.substr(4, 4);
    string s2 = key.substr(10, 4);
    string s3 = key.substr(15, 4);
    string s4 = key.substr(20, 4);
    string s5 = key.substr(25, 4);
    
    auto uppercase = [](string s) {
        for (auto& c : s) c = toupper(c);
        return s;
    };
    s1 = uppercase(s1);
    s2 = uppercase(s2);
    s3 = uppercase(s3);
    s4 = uppercase(s4);
    s5 = uppercase(s5);
    
    string expectedPrefix = "";
    if (module == "restaurant") expectedPrefix = "REST";
    else if (module == "pharmacy") expectedPrefix = "PHAR";
    else if (module == "bakery") expectedPrefix = "BAKE";
    else if (module == "fruit") expectedPrefix = "FRUT";
    else if (module == "business") expectedPrefix = "BUSI";
    else return false;
    
    if (s1 != expectedPrefix) return false;
    
    string combined = s1 + s2 + s3 + s4;
    int sum = 0;
    for (int i = 0; i < (int)combined.length(); i++) {
        sum += (int)combined[i] * (i + 1);
    }
    
    int rem = sum % 1679616;
    string expectedS5 = toBase36(rem);
    
    return s5 == expectedS5;
}

// Helpers
string getTimestamp() {
    time_t now = time(0);
    tm* ltm = localtime(&now);
    stringstream ss;
    ss << setfill('0') << setw(2) << ltm->tm_mday << "/"
       << setw(2) << 1 + ltm->tm_mon << "/"
       << 1900 + ltm->tm_year << " "
       << setw(2) << ltm->tm_hour << ":"
       << setw(2) << ltm->tm_min << ":"
       << setw(2) << ltm->tm_sec;
    return ss.str();
}

void addLog(const string& action, const string& modName) {
    string entry = "[" + getTimestamp() + "] [" + modName + "] " + action;
    auditLogs.push_back(entry);
}

// Disk Persistence
void saveConfig() {
    ofstream out("config.txt");
    if (out.is_open()) {
        out << config.companyName << "\n";
        out << config.currency << "\n";
        out << config.currencySymbol << "\n";
        out << config.taxRate << "\n";
        out.close();
    }
}

void loadConfig() {
    ifstream in("config.txt");
    if (in.is_open()) {
        getline(in, config.companyName);
        getline(in, config.currency);
        getline(in, config.currencySymbol);
        in >> config.taxRate;
        in.close();
    } else {
        saveConfig(); // Save defaults
    }
}

void saveLicense() {
    ofstream out("license.txt");
    if (out.is_open()) {
        out << license.isGlobalLicensed << "\n";
        out << license.globalLicenseKey << "\n";
        out << license.installationTime << "\n";
        out << license.isTrialExpired << "\n";
        for (const auto& pair : license.licensedModules) {
            out << pair.first << " " << pair.second << " " << license.moduleLicenseKeys[pair.first] << "\n";
        }
        out.close();
    }
}

void loadLicense() {
    ifstream in("license.txt");
    long long now = chrono::duration_cast<chrono::seconds>(chrono::system_clock::now().time_since_epoch()).count();
    
    // Initialize default states
    license.licensedModules["restaurant"] = false;
    license.licensedModules["pharmacy"] = false;
    license.licensedModules["bakery"] = false;
    license.licensedModules["fruit"] = false;
    license.licensedModules["business"] = false;
    
    license.moduleLicenseKeys["restaurant"] = "";
    license.moduleLicenseKeys["pharmacy"] = "";
    license.moduleLicenseKeys["bakery"] = "";
    license.moduleLicenseKeys["fruit"] = "";
    license.moduleLicenseKeys["business"] = "";

    if (in.is_open()) {
        in >> license.isGlobalLicensed;
        in.ignore();
        getline(in, license.globalLicenseKey);
        in >> license.installationTime;
        in >> license.isTrialExpired;
        
        string mod;
        bool status;
        string key;
        while (in >> mod >> status) {
            in.ignore();
            getline(in, key);
            license.licensedModules[mod] = status;
            license.moduleLicenseKeys[mod] = key;
        }
        in.close();
        
        // Expiration check
        long long elapsed = now - license.installationTime;
        long long thirtyDays = 30LL * 24LL * 60LL * 60LL;
        if (elapsed > thirtyDays && !license.isGlobalLicensed) {
            license.isTrialExpired = true;
        }
    } else {
        // First run
        license.installationTime = now;
        license.isGlobalLicensed = false;
        license.isTrialExpired = false;
        saveLicense();
    }
}

void saveCaja() {
    ofstream out("caja.txt");
    if (out.is_open()) {
        out << caja.isOpen << "\n";
        out << caja.openingCash << "\n";
        out << caja.currentCash << "\n";
        out << caja.openingDate << "\n";
        out << caja.movements.size() << "\n";
        for (const auto& m : caja.movements) {
            out << m.type << "|" << m.amount << "|" << m.concept << "|" << m.timestamp << "\n";
        }
        out.close();
    }
}

void loadCaja() {
    ifstream in("caja.txt");
    if (in.is_open()) {
        in >> caja.isOpen;
        in >> caja.openingCash;
        in >> caja.currentCash;
        in.ignore();
        getline(in, caja.openingDate);
        size_t count;
        in >> count;
        in.ignore();
        caja.movements.clear();
        for (size_t i = 0; i < count; i++) {
            string line;
            if (getline(in, line)) {
                stringstream ss(line);
                string type, amtStr, concept, ts;
                getline(ss, type, '|');
                getline(ss, amtStr, '|');
                getline(ss, concept, '|');
                getline(ss, ts, '|');
                caja.movements.push_back({type, stod(amtStr), concept, ts});
            }
        }
        in.close();
    }
}

void saveTables() {
    ofstream out("tables.txt");
    if (out.is_open()) {
        auto writeTables = [&](const vector<TableState>& tblList, const string& prefix) {
            out << tblList.size() << "\n";
            for (const auto& t : tblList) {
                out << t.id << "|" << t.name << "|" << t.status << "|" << t.guestsCount << "|" << t.reservationName << "|" << t.reservationTime << "\n";
            }
        };
        writeTables(restaurantTables, "restaurant");
        writeTables(bakeryTables, "bakery");
        writeTables(fruitTables, "fruit");
        out.close();
    }
}

void loadTables() {
    ifstream in("tables.txt");
    if (in.is_open()) {
        auto readTables = [&](vector<TableState>& tblList) {
            size_t count;
            in >> count;
            in.ignore();
            tblList.clear();
            for (size_t i = 0; i < count; i++) {
                string line;
                if (getline(in, line)) {
                    stringstream ss(line);
                    TableState t;
                    getline(ss, t.id, '|');
                    getline(ss, t.name, '|');
                    getline(ss, t.status, '|');
                    string guests;
                    getline(ss, guests, '|');
                    t.guestsCount = stoi(guests);
                    getline(ss, t.reservationName, '|');
                    getline(ss, t.reservationTime, '|');
                    tblList.push_back(t);
                }
            }
        };
        readTables(restaurantTables);
        readTables(bakeryTables);
        readTables(fruitTables);
        in.close();
    } else {
        // Default tables
        for (int i = 1; i <= 8; i++) restaurantTables.push_back({"rt-" + to_string(i), "Mesa " + to_string(i), "free", 0, {}, "", ""});
        for (int i = 1; i <= 6; i++) bakeryTables.push_back({"bt-" + to_string(i), "Mesa Cafe " + to_string(i), "free", 0, {}, "", ""});
        for (int i = 1; i <= 6; i++) fruitTables.push_back({"ft-" + to_string(i), "Mesa Fruteria " + to_string(i), "free", 0, {}, "", ""});
        saveTables();
    }
}

void saveUsers() {
    ofstream out("users.txt");
    if (out.is_open()) {
        out << appUsers.size() << "\n";
        for (const auto& u : appUsers) {
            out << u.id << "|" << u.username << "|" << u.fullName << "|" << u.password << "|" << u.role << "|" << u.isActive << "|"
                << u.permissions.ventas << "|" << u.permissions.inventario << "|" << u.permissions.caja << "|" << u.permissions.compras << "|" << u.permissions.usuarios << "\n";
        }
        out.close();
    }
}

void loadUsers() {
    ifstream in("users.txt");
    if (in.is_open()) {
        size_t count;
        in >> count;
        in.ignore();
        appUsers.clear();
        for (size_t i = 0; i < count; i++) {
            string line;
            if (getline(in, line)) {
                stringstream ss(line);
                AppUser u;
                string activeStr, pVentas, pInv, pCaja, pComp, pUser;
                getline(ss, u.id, '|');
                getline(ss, u.username, '|');
                getline(ss, u.fullName, '|');
                getline(ss, u.password, '|');
                getline(ss, u.role, '|');
                getline(ss, activeStr, '|');
                u.isActive = (activeStr == "1");
                
                getline(ss, pVentas, '|'); u.permissions.ventas = (pVentas == "1");
                getline(ss, pInv, '|'); u.permissions.inventario = (pInv == "1");
                getline(ss, pCaja, '|'); u.permissions.caja = (pCaja == "1");
                getline(ss, pComp, '|'); u.permissions.compras = (pComp == "1");
                getline(ss, pUser, '|'); u.permissions.usuarios = (pUser == "1");
                appUsers.push_back(u);
            }
        }
        in.close();
    } else {
        // Create default admin
        AppUser admin;
        admin.id = "u-admin";
        admin.username = "admin";
        admin.fullName = "Administrador del Sistema";
        admin.password = "admin";
        admin.role = "Admin";
        admin.permissions = {true, true, true, true, true};
        admin.isActive = true;
        appUsers.push_back(admin);
        saveUsers();
    }
}

void saveSuppliers() {
    ofstream out("suppliers.txt");
    if (out.is_open()) {
        out << suppliers.size() << "\n";
        for (const auto& s : suppliers) {
            out << s.id << "|" << s.name << "|" << s.email << "|" << s.phone << "|" << s.companyName << "|" << s.totalPurchases << "\n";
        }
        out.close();
    }
}

void loadSuppliers() {
    ifstream in("suppliers.txt");
    if (in.is_open()) {
        size_t count;
        in >> count;
        in.ignore();
        suppliers.clear();
        for (size_t i = 0; i < count; i++) {
            string line;
            if (getline(in, line)) {
                stringstream ss(line);
                Supplier s;
                string purchasesStr;
                getline(ss, s.id, '|');
                getline(ss, s.name, '|');
                getline(ss, s.email, '|');
                getline(ss, s.phone, '|');
                getline(ss, s.companyName, '|');
                getline(ss, purchasesStr, '|');
                s.totalPurchases = stod(purchasesStr);
                suppliers.push_back(s);
            }
        }
        in.close();
    }
}

void savePurchaseOrders() {
    ofstream out("purchase_orders.txt");
    if (out.is_open()) {
        out << purchaseOrders.size() << "\n";
        for (const auto& o : purchaseOrders) {
            out << o.id << "|" << o.supplierId << "|" << o.supplierName << "|" << o.status << "|" << o.total << "|" << o.createdAt << "|" << o.items.size() << "\n";
            for (const auto& item : o.items) {
                out << item.productId << "|" << item.productName << "|" << item.quantity << "|" << item.costPrice << "\n";
            }
        }
        out.close();
    }
}

void loadPurchaseOrders() {
    ifstream in("purchase_orders.txt");
    if (in.is_open()) {
        size_t count;
        in >> count;
        in.ignore();
        purchaseOrders.clear();
        for (size_t i = 0; i < count; i++) {
            string line;
            if (getline(in, line)) {
                stringstream ss(line);
                PurchaseOrder o;
                string totalStr, itemsCountStr;
                getline(ss, o.id, '|');
                getline(ss, o.supplierId, '|');
                getline(ss, o.supplierName, '|');
                getline(ss, o.status, '|');
                getline(ss, totalStr, '|');
                o.total = stod(totalStr);
                getline(ss, o.createdAt, '|');
                getline(ss, itemsCountStr, '|');
                size_t itemsCount = stoi(itemsCountStr);
                o.items.clear();
                for (size_t j = 0; j < itemsCount; j++) {
                    string itemLine;
                    if (getline(in, itemLine)) {
                        stringstream iss(itemLine);
                        PurchaseItem item;
                        string qtyStr, costStr;
                        getline(iss, item.productId, '|');
                        getline(iss, item.productName, '|');
                        getline(iss, qtyStr, '|');
                        item.quantity = stoi(qtyStr);
                        getline(iss, costStr, '|');
                        item.costPrice = stod(costStr);
                        o.items.push_back(item);
                    }
                }
                purchaseOrders.push_back(o);
            }
        }
        in.close();
    }
}

void saveQuotes() {
    ofstream out("quotes.txt");
    if (out.is_open()) {
        out << quotes.size() << "\n";
        for (const auto& q : quotes) {
            out << q.id << "|" << q.clientName << "|" << q.subtotal << "|" << q.tax << "|" << q.total << "|" << q.status << "|" << q.date << "|" << q.isElectronicInvoice << "|" << q.code << "|" << q.items.size() << "\n";
            for (const auto& item : q.items) {
                out << item.product.id << "|" << item.product.name << "|" << item.quantity << "|" << item.weight << "|" << item.product.salePrice << "|" << item.product.isBulk << "\n";
            }
        }
        out.close();
    }
}

void loadQuotes() {
    ifstream in("quotes.txt");
    if (in.is_open()) {
        size_t count;
        in >> count;
        in.ignore();
        quotes.clear();
        for (size_t i = 0; i < count; i++) {
            string line;
            if (getline(in, line)) {
                stringstream ss(line);
                Quote q;
                string subStr, taxStr, totStr, elecStr, countStr;
                getline(ss, q.id, '|');
                getline(ss, q.clientName, '|');
                getline(ss, subStr, '|'); q.subtotal = stod(subStr);
                getline(ss, taxStr, '|'); q.tax = stod(taxStr);
                getline(ss, totStr, '|'); q.total = stod(totStr);
                getline(ss, q.status, '|');
                getline(ss, q.date, '|');
                getline(ss, elecStr, '|'); q.isElectronicInvoice = (elecStr == "1");
                getline(ss, q.code, '|');
                getline(ss, countStr, '|');
                size_t itemsCount = stoi(countStr);
                q.items.clear();
                for (size_t j = 0; j < itemsCount; j++) {
                    string itemLine;
                    if (getline(in, itemLine)) {
                        stringstream iss(itemLine);
                        CartItem item;
                        string qtyStr, wStr, priceStr, bulkStr;
                        getline(iss, item.product.id, '|');
                        getline(iss, item.product.name, '|');
                        getline(iss, qtyStr, '|'); item.quantity = stoi(qtyStr);
                        getline(iss, wStr, '|'); item.weight = stod(wStr);
                        getline(iss, priceStr, '|'); item.product.salePrice = stod(priceStr);
                        getline(iss, bulkStr, '|'); item.product.isBulk = (bulkStr == "1");
                        q.items.push_back(item);
                    }
                }
                quotes.push_back(q);
            }
        }
        in.close();
    }
}

void initData() {
    // Restaurant Products
    products.push_back({"r1", "Pizza Muzarella", "Platos", "1001", "R-PIZ-01", 4.5, 12.0, 40, "restaurant", false});
    products.push_back({"r2", "Cerveza Club Colombia", "Bebidas", "1002", "R-CER-02", 1.8, 4.0, 120, "restaurant", false});
    
    // Pharmacy Products
    products.push_back({"p1", "Acetaminofén 500mg", "Analgésicos", "2001", "F-ACE-01", 0.3, 1.5, 300, "pharmacy", false});
    products.push_back({"p2", "Ibuprofeno 400mg", "Analgésicos", "2002", "F-IBU-02", 0.5, 2.2, 250, "pharmacy", false});

    // Bakery Products
    products.push_back({"b1", "Pan Blandito", "Panes", "3001", "P-BLA-01", 0.15, 0.5, 150, "bakery", false});
    products.push_back({"b2", "Croissant de Queso", "Panes", "3002", "P-CRO-02", 0.4, 1.2, 80, "bakery", false});

    // Fruit Products
    products.push_back({"f1", "Manzana Roja", "Frutas", "4001", "FR-MAN-01", 0.8, 1.8, 50, "fruit", true});
    products.push_back({"f2", "Banano Orgánico", "Frutas", "4002", "FR-BAN-02", 0.2, 0.6, 120, "fruit", true});

    // Business Products
    products.push_back({"g1", "Cuaderno Universitario", "Útiles", "5001", "N-CUA-01", 1.2, 3.5, 90, "business", false});
    products.push_back({"g2", "Lapicero Negro", "Útiles", "5002", "N-LAP-02", 0.2, 0.8, 200, "business", false});

    loadConfig();
    loadLicense();
    loadCaja();
    loadTables();
    loadUsers();
    loadSuppliers();
    loadPurchaseOrders();
    loadQuotes();
}

// Module Licensing Check helper
bool isModuleAccessible(const string& mod) {
    if (mod == "hub") return true;
    if (license.isGlobalLicensed) return true;
    if (!license.isTrialExpired) return true;
    
    // Check module-specific license
    auto it = license.licensedModules.find(mod);
    if (it != license.licensedModules.end()) {
        return it->second;
    }
    return false;
}

// Save to Table or Active Cart helper
void addProductToCart(const Product& product, double qtyOrWeight) {
    bool isTableEnv = (currentModule == "restaurant" || currentModule == "bakery" || currentModule == "fruit");
    
    if (isTableEnv && !selectedTableId.empty()) {
        vector<TableState>* tables = nullptr;
        if (currentModule == "restaurant") tables = &restaurantTables;
        else if (currentModule == "bakery") tables = &bakeryTables;
        else if (currentModule == "fruit") tables = &fruitTables;

        if (tables) {
            for (auto& table : *tables) {
                if (table.id == selectedTableId) {
                    table.status = "occupied";
                    // Check if already in table cart
                    bool found = false;
                    for (auto& item : table.cart) {
                        if (item.product.id == product.id) {
                            if (product.isBulk) item.weight += qtyOrWeight;
                            else item.quantity += (int)qtyOrWeight;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        CartItem item;
                        item.product = product;
                        if (product.isBulk) {
                            item.weight = qtyOrWeight;
                            item.quantity = 1;
                        } else {
                            item.quantity = (int)qtyOrWeight;
                            item.weight = 0.0;
                        }
                        table.cart.push_back(item);
                    }
                    cout << GREEN << ">>> Producto '" << product.name << "' agregado a la " << table.name << " (" << currentModule << ")" << RESET << "\n";
                    saveTables();
                    return;
                }
            }
        }
    } else {
        // Add to active carts of module
        auto& cart = activeCarts[currentModule];
        bool found = false;
        for (auto& item : cart) {
            if (item.product.id == product.id) {
                if (product.isBulk) item.weight += qtyOrWeight;
                else item.quantity += (int)qtyOrWeight;
                found = true;
                break;
            }
        }
        if (!found) {
            CartItem item;
            item.product = product;
            if (product.isBulk) {
                item.weight = qtyOrWeight;
                item.quantity = 1;
            } else {
                item.quantity = (int)qtyOrWeight;
                item.weight = 0.0;
            }
            cart.push_back(item);
        }
        cout << GREEN << ">>> Producto '" << product.name << "' agregado al carrito del modulo " << currentModule << RESET << "\n";
    }
}

// Global Barcode Scan handler
bool scanBarcodeGlobal(const string& barcode) {
    for (const auto& product : products) {
        if (product.barcode == barcode) {
            cout << YELLOW << "\n=========================================" << RESET << "\n";
            cout << CYAN << "ESCANEADOR GLOBAL DE CODIGOS DE BARRA" << RESET << "\n";
            cout << YELLOW << "=========================================" << RESET << "\n";
            cout << "Codigo detectado: " << barcode << " (" << product.name << ")\n";
            
            if (!isModuleAccessible(product.storeType)) {
                cout << RED << ">>> Error: El modulo " << product.storeType << " no esta habilitado por licencia." << RESET << "\n";
                cout << YELLOW << "=========================================" << RESET << "\n\n";
                return true; // Detected but blocked
            }

            // Switch module to product module
            currentModule = product.storeType;
            cout << "-> Cambiando al modulo: " << CYAN << currentModule << RESET << "\n";
            cout << "-> Redirigiendo a pantalla de Ventas\n";
            
            // Add to cart
            double qtyOrWeight = product.isBulk ? 1.0 : 1.0;
            addProductToCart(product, qtyOrWeight);
            cout << YELLOW << "=========================================" << RESET << "\n\n";
            return true;
        }
    }
    return false;
}

// Add custom table helper
void addCustomTable(const string& tableName) {
    TableState newTable;
    string prefix = (currentModule == "restaurant" ? "rt" : (currentModule == "bakery" ? "bt" : "ft"));
    
    vector<TableState>* tables = nullptr;
    if (currentModule == "restaurant") tables = &restaurantTables;
    else if (currentModule == "bakery") tables = &bakeryTables;
    else if (currentModule == "fruit") tables = &fruitTables;

    if (tables) {
        newTable.id = prefix + "-" + to_string(tables->size() + 1);
        newTable.name = tableName;
        newTable.status = "free";
        newTable.guestsCount = 0;
        tables->push_back(newTable);
        cout << GREEN << ">>> Mesa '" << tableName << "' agregada con exito en " << currentModule << " (ID: " << newTable.id << ")" << RESET << "\n";
        saveTables();
    } else {
        cout << RED << ">>> Error: El modulo actual no soporta mesas." << RESET << "\n";
    }
}

// Prints the active shopping cart
void printCart(const vector<CartItem>& cart) {
    if (cart.empty()) {
        cout << "  " << GRAY << "(Carrito vacio)" << RESET << "\n";
        return;
    }
    double total = 0.0;
    cout << left << setw(25) << "Producto" << setw(10) << "Cant/Peso" << setw(12) << "P. Unit" << setw(12) << "Subtotal" << "\n";
    cout << "------------------------------------------------------------\n";
    for (const auto& item : cart) {
        double subtotal = 0.0;
        string qtyStr;
        if (item.product.isBulk) {
            subtotal = item.product.salePrice * item.weight;
            qtyStr = to_string(item.weight).substr(0, 5) + " kg";
        } else {
            subtotal = item.product.salePrice * item.quantity;
            qtyStr = to_string(item.quantity);
        }
        total += subtotal;
        cout << left << setw(25) << item.product.name 
             << setw(10) << qtyStr 
             << config.currencySymbol << " " << setw(9) << fixed << setprecision(2) << item.product.salePrice 
             << config.currencySymbol << " " << setw(9) << subtotal << "\n";
    }
    cout << "------------------------------------------------------------\n";
    cout << right << setw(47) << "TOTAL A PAGAR: " << config.currencySymbol << " " << total << "\n";
}

// Renders the Sales Module Screen
void renderSalesView() {
    cout << MAGENTA << "\n=========================================" << RESET << "\n";
    cout << WHITE << "MODULO DE VENTAS · " << currentModule << " · " << config.companyName << RESET << "\n";
    cout << MAGENTA << "=========================================" << RESET << "\n";

    bool isTableEnv = (currentModule == "restaurant" || currentModule == "bakery" || currentModule == "fruit");
    if (isTableEnv) {
        cout << CYAN << "[Plan de Mesas y Salones]" << RESET << "\n";
        vector<TableState>* tables = (currentModule == "restaurant" ? &restaurantTables : (currentModule == "bakery" ? &bakeryTables : &fruitTables));
        for (const auto& table : *tables) {
            string statusStr = (table.status == "free" ? "Libre" : (table.status == "occupied" ? "Ocupada" : (table.status == "reserved" ? "Reservada" : "En Cobro")));
            string color = (table.status == "free" ? GREEN : (table.status == "occupied" ? RED : YELLOW));
            cout << "  - [" << table.id << "] " << table.name << " (" << color << statusStr << RESET << ")";
            if (selectedTableId == table.id) cout << WHITE << " <== SELECCIONADA" << RESET;
            if (!table.reservationName.empty()) {
                cout << GRAY << " [Res: " << table.reservationName << " - " << table.reservationTime << "]" << RESET;
            }
            cout << "\n";
        }
        cout << "-----------------------------------------\n";
    }

    // Active Cart
    vector<CartItem> cart;
    if (isTableEnv && !selectedTableId.empty()) {
        vector<TableState>* tables = (currentModule == "restaurant" ? &restaurantTables : (currentModule == "bakery" ? &bakeryTables : &fruitTables));
        for (const auto& t : *tables) {
            if (t.id == selectedTableId) {
                cart = t.cart;
                cout << "Articulos en " << CYAN << t.name << RESET << ":\n";
                break;
            }
        }
    } else {
        cart = activeCarts[currentModule];
        cout << "Articulos en Carrito de Caja:\n";
    }

    printCart(cart);
    cout << MAGENTA << "=========================================" << RESET << "\n";
    
    // Actions Menu
    cout << "1. Escanear Codigo de Barras\n";
    cout << "2. Agregar Mesa Dinamica\n";
    if (isTableEnv) {
        cout << "3. Seleccionar Mesa\n";
        cout << "4. Deseleccionar Mesa (Caja Directa)\n";
        cout << "5. Registrar Reserva en Mesa\n";
    }
    cout << "6. Procesar Cobro (Checkout)\n";
    cout << "7. Regresar al Hub Principal\n";
    cout << "Seleccione una opcion: ";
}

// Config Screen
void renderConfigView() {
    while (true) {
        cout << BLUE << "\n=========================================" << RESET << "\n";
        cout << WHITE << "CONFIGURACION DEL NEGOCIO" << RESET << "\n";
        cout << BLUE << "=========================================" << RESET << "\n";
        cout << "1. Editar Nombre de la Empresa (Actual: " << config.companyName << ")\n";
        cout << "2. Editar Moneda (Actual: " << config.currency << ")\n";
        cout << "3. Editar Símbolo de Moneda (Actual: " << config.currencySymbol << ")\n";
        cout << "4. Editar Tasa de Impuesto/IVA (Actual: " << config.taxRate << "%)\n";
        cout << "5. Regresar al Hub Principal\n";
        cout << BLUE << "=========================================" << RESET << "\n";
        cout << "Seleccione una opcion: ";
        
        string opt;
        cin >> opt;
        if (opt == "1") {
            cout << "Ingrese nuevo nombre: ";
            cin.ignore();
            getline(cin, config.companyName);
            saveConfig();
            addLog("Actualizó nombre a: " + config.companyName, "Config");
            cout << GREEN << ">>> Cambio guardado." << RESET << "\n";
        } else if (opt == "2") {
            cout << "Ingrese código de moneda (Ej: USD, EUR, COP): ";
            cin >> config.currency;
            saveConfig();
            addLog("Actualizó moneda a: " + config.currency, "Config");
            cout << GREEN << ">>> Cambio guardado." << RESET << "\n";
        } else if (opt == "3") {
            cout << "Ingrese símbolo de moneda (Ej: $, €, Bs.): ";
            cin >> config.currencySymbol;
            saveConfig();
            addLog("Actualizó símbolo de moneda a: " + config.currencySymbol, "Config");
            cout << GREEN << ">>> Cambio guardado." << RESET << "\n";
        } else if (opt == "4") {
            cout << "Ingrese porcentaje de impuesto (0 a 100): ";
            double tr;
            if (cin >> tr && tr >= 0 && tr <= 100) {
                config.taxRate = tr;
                saveConfig();
                addLog("Actualizó tasa de IVA a: " + to_string(tr) + "%", "Config");
                cout << GREEN << ">>> Cambio guardado." << RESET << "\n";
            } else {
                cout << RED << ">>> Error: Tasa inválida." << RESET << "\n";
                cin.clear();
                cin.ignore(10000, '\n');
            }
        } else if (opt == "5") {
            break;
        } else {
            cout << RED << ">>> Opcion invalida." << RESET << "\n";
        }
    }
}

// License Screen
void renderLicenseView() {
    while (true) {
        long long now = chrono::duration_cast<chrono::seconds>(chrono::system_clock::now().time_since_epoch()).count();
        long long elapsed = now - license.installationTime;
        long long thirtyDays = 30LL * 24LL * 60LL * 60LL;
        long long remSecs = max(0LL, thirtyDays - elapsed);
        int remDays = remSecs / (24 * 60 * 60);

        cout << YELLOW << "\n=========================================" << RESET << "\n";
        cout << WHITE << "LICENCIA Y ACTIVACION" << RESET << "\n";
        cout << YELLOW << "=========================================" << RESET << "\n";
        
        if (license.isGlobalLicensed) {
            cout << GREEN << "ESTADO: SISTEMA TOTALMENTE LICENCIADO" << RESET << "\n";
            cout << "Clave Activa: " << license.globalLicenseKey << "\n";
        } else {
            if (license.isTrialExpired) {
                cout << RED << "ESTADO: PERIODO DE PRUEBA EXPIRADO (30 DIAS)" << RESET << "\n";
            } else {
                cout << YELLOW << "ESTADO: PERIODO DE PRUEBA ACTIVO" << RESET << "\n";
                cout << "Tiempo restante: " << remDays << " dias (" << remSecs << " segundos)\n";
            }
        }
        cout << "-----------------------------------------\n";
        cout << CYAN << "Licencias por Módulo:" << RESET << "\n";
        for (const auto& pair : license.licensedModules) {
            string status = (pair.second || license.isGlobalLicensed) ? GREEN "Habilitado" RESET : RED "Bloqueado" RESET;
            cout << "  - Modulo " << left << setw(12) << pair.first << ": " << status;
            if (!license.moduleLicenseKeys[pair.first].empty()) {
                cout << GRAY << " (" << license.moduleLicenseKeys[pair.first] << ")" << RESET;
            }
            cout << "\n";
        }
        cout << "-----------------------------------------\n";
        cout << "1. Ingresar Licencia Global del Sistema\n";
        cout << "2. Ingresar Licencia de Módulo Comercial\n";
        cout << "3. [DEP] Simular Expiración de Prueba (Terminar 30 días)\n";
        cout << "4. [DEP] Resetear Licencias y Prueba a Cero\n";
        cout << "5. Regresar al Hub Principal\n";
        cout << YELLOW << "=========================================" << RESET << "\n";
        cout << "Seleccione una opcion: ";
        
        string opt;
        cin >> opt;
        if (opt == "1") {
            string key;
            cout << "Ingrese Clave de Licencia (POS-XXXX-XXXX-XXXX-XXXX-XXXX): ";
            cin >> key;
            if (validateLicenseKey(key)) {
                license.isGlobalLicensed = true;
                license.globalLicenseKey = key;
                license.isTrialExpired = false;
                saveLicense();
                addLog("Sistema Licenciado exitosamente con clave: " + key, "Seguridad");
                cout << GREEN << ">>> ¡Licencia Global Activada Exitosamente!" << RESET << "\n";
            } else {
                cout << RED << ">>> Error: Clave de licencia no valida para este sistema." << RESET << "\n";
            }
        } else if (opt == "2") {
            string mod, key;
            cout << "Módulo comercial (restaurant, pharmacy, bakery, fruit, business): ";
            cin >> mod;
            if (license.licensedModules.find(mod) == license.licensedModules.end()) {
                cout << RED << ">>> Error: Modulo invalido." << RESET << "\n";
                continue;
            }
            cout << "Ingrese Clave de Licencia de Modulo: ";
            cin >> key;
            if (validateLicenseKeyForModule(key, mod)) {
                license.licensedModules[mod] = true;
                license.moduleLicenseKeys[mod] = key;
                saveLicense();
                addLog("Módulo " + mod + " Licenciado con clave: " + key, "Seguridad");
                cout << GREEN << ">>> ¡Licencia de Modulo Activada!" << RESET << "\n";
            } else {
                cout << RED << ">>> Error: Clave no valida para el modulo " << mod << RESET << "\n";
            }
        } else if (opt == "3") {
            license.isTrialExpired = true;
            license.installationTime = now - thirtyDays - 10LL; // Shift back
            saveLicense();
            addLog("Simulación de expiración activada.", "Seguridad");
            cout << YELLOW << ">>> Prueba expirada para simulación. Vuelva a ingresar a los módulos." << RESET << "\n";
        } else if (opt == "4") {
            license.isGlobalLicensed = false;
            license.globalLicenseKey = "";
            license.isTrialExpired = false;
            license.installationTime = now;
            for (auto& pair : license.licensedModules) {
                pair.second = false;
                license.moduleLicenseKeys[pair.first] = "";
            }
            saveLicense();
            addLog("Reinicio de licencias realizado.", "Seguridad");
            cout << GREEN << ">>> Licencias y periodo de prueba restablecidos." << RESET << "\n";
        } else if (opt == "5") {
            break;
        } else {
            cout << RED << ">>> Opcion invalida." << RESET << "\n";
        }
    }
}

// Cash Drawer Module
void renderCajaView() {
    while (true) {
        cout << GREEN << "\n=========================================" << RESET << "\n";
        cout << WHITE << "CONTROL DE CAJA REGISTRADORA · " << config.companyName << RESET << "\n";
        cout << GREEN << "=========================================" << RESET << "\n";
        
        if (!caja.isOpen) {
            cout << RED << "ESTADO: CAJA CERRADA" << RESET << "\n";
            cout << "-----------------------------------------\n";
            cout << "1. Abrir Turno de Caja\n";
            cout << "2. Regresar al Hub Principal\n";
            cout << "Seleccione: ";
            string opt;
            cin >> opt;
            if (opt == "1") {
                double fund;
                cout << "Ingrese fondo de caja de apertura (" << config.currencySymbol << "): ";
                if (cin >> fund && fund >= 0) {
                    caja.isOpen = true;
                    caja.openingCash = fund;
                    caja.currentCash = fund;
                    caja.openingDate = getTimestamp();
                    caja.movements.clear();
                    caja.movements.push_back({"IN", fund, "Apertura de Caja", getTimestamp()});
                    saveCaja();
                    addLog("Abrió caja con " + to_string(fund), "Caja");
                    cout << GREEN << ">>> Turno de Caja Abierto." << RESET << "\n";
                } else {
                    cout << RED << ">>> Error: Monto invalido." << RESET << "\n";
                    cin.clear();
                    cin.ignore(10000, '\n');
                }
            } else if (opt == "2") {
                break;
            } else {
                cout << RED << ">>> Opcion invalida." << RESET << "\n";
            }
        } else {
            cout << GREEN << "ESTADO: CAJA ABIERTA (Desde: " << caja.openingDate << ")" << RESET << "\n";
            cout << "Efectivo estimado en cajon: " << GREEN << config.currencySymbol << " " << fixed << setprecision(2) << caja.currentCash << RESET << "\n";
            cout << "-----------------------------------------\n";
            cout << "1. Registrar Ingreso de Efectivo Auxiliar (IN)\n";
            cout << "2. Registrar Salida de Efectivo Auxiliar (OUT)\n";
            cout << "3. Cerrar Caja y Arqueo (Fin de Turno)\n";
            cout << "4. Ver Historial de Movimientos del Turno\n";
            cout << "5. Regresar al Hub Principal\n";
            cout << GREEN << "=========================================" << RESET << "\n";
            cout << "Seleccione: ";
            string opt;
            cin >> opt;
            if (opt == "1" || opt == "2") {
                double amt;
                string concept;
                cout << "Ingrese monto (" << config.currencySymbol << "): ";
                if (cin >> amt && amt > 0) {
                    cout << "Ingrese concepto/motivo: ";
                    cin.ignore();
                    getline(cin, concept);
                    
                    if (opt == "2" && amt > caja.currentCash) {
                        cout << RED << ">>> Error: No hay suficiente efectivo en caja." << RESET << "\n";
                        continue;
                    }

                    string type = (opt == "1" ? "IN" : "OUT");
                    caja.currentCash += (opt == "1" ? amt : -amt);
                    caja.movements.push_back({type, amt, concept, getTimestamp()});
                    saveCaja();
                    addLog("Movimiento Caja (" + type + "): " + to_string(amt) + " - Concepto: " + concept, "Caja");
                    cout << GREEN << ">>> Movimiento registrado." << RESET << "\n";
                } else {
                    cout << RED << ">>> Error: Monto invalido." << RESET << "\n";
                    cin.clear();
                    cin.ignore(10000, '\n');
                }
            } else if (opt == "3") {
                double counted;
                cout << "ARQUEO DE CAJA:\n";
                cout << "Ingrese efectivo fisico total contado en el cajon: ";
                if (cin >> counted && counted >= 0) {
                    double diff = counted - caja.currentCash;
                    cout << "\n=========================================\n";
                    cout << CYAN << "REPORTE DE ARQUEO Y CIERRE" << RESET << "\n";
                    cout << "=========================================\n";
                    cout << "Fondo de Apertura: " << config.currencySymbol << " " << caja.openingCash << "\n";
                    cout << "Saldo en Efectivo Esperado: " << config.currencySymbol << " " << caja.currentCash << "\n";
                    cout << "Efectivo Fisico Registrado: " << config.currencySymbol << " " << counted << "\n";
                    if (diff == 0.0) {
                        cout << GREEN << "DIFERENCIA: Sin descuadres (0.00)" << RESET << "\n";
                    } else if (diff > 0) {
                        cout << GREEN << "DIFERENCIA: Sobrante de " << config.currencySymbol << " " << diff << RESET << "\n";
                    } else {
                        cout << RED << "DIFERENCIA: Faltante de " << config.currencySymbol << " " << abs(diff) << RESET << "\n";
                    }
                    cout << "=========================================\n";
                    caja.isOpen = false;
                    caja.openingCash = 0.0;
                    caja.currentCash = 0.0;
                    caja.movements.clear();
                    saveCaja();
                    addLog("Cierre de caja. Arqueado: " + to_string(counted) + ", Diferencia: " + to_string(diff), "Caja");
                    cout << GREEN << ">>> Caja cerrada y turno finalizado." << RESET << "\n";
                } else {
                    cout << RED << ">>> Error: Monto invalido." << RESET << "\n";
                    cin.clear();
                    cin.ignore(10000, '\n');
                }
            } else if (opt == "4") {
                cout << "\n--- HISTORIAL DE MOVIMIENTOS DEL TURNO ---\n";
                for (const auto& m : caja.movements) {
                    string color = (m.type == "IN" ? GREEN : RED);
                    cout << "[" << m.timestamp << "] " << color << m.type << RESET << " "
                         << config.currencySymbol << " " << fixed << setprecision(2) << m.amount << " - " << m.concept << "\n";
                }
                cout << "------------------------------------------\n";
            } else if (opt == "5") {
                break;
            } else {
                cout << RED << ">>> Opcion invalida." << RESET << "\n";
            }
        }
    }
}

// User accounts management panel
void renderUsersView() {
    if (activeSession.role != "Admin") {
        cout << RED << ">>> Acceso Denegado: Solo el Administrador puede gestionar usuarios." << RESET << "\n";
        return;
    }
    while (true) {
        cout << CYAN << "\n=========================================" << RESET << "\n";
        cout << WHITE << "GESTION DE USUARIOS Y PERMISOS" << RESET << "\n";
        cout << CYAN << "=========================================" << RESET << "\n";
        cout << "1. Listar Usuarios Registrados\n";
        cout << "2. Crear Nuevo Usuario\n";
        cout << "3. Eliminar Usuario\n";
        cout << "4. Regresar al Hub Principal\n";
        cout << CYAN << "=========================================" << RESET << "\n";
        cout << "Seleccione: ";
        string opt;
        cin >> opt;
        if (opt == "1") {
            cout << "\n--- LISTA DE USUARIOS ---\n";
            for (const auto& u : appUsers) {
                string status = u.isActive ? GREEN "Activo" RESET : RED "Inactivo" RESET;
                cout << "ID: " << left << setw(10) << u.id 
                     << " | Usuario: " << setw(10) << u.username 
                     << " | Nombre: " << setw(20) << u.fullName 
                     << " | Rol: " << setw(8) << u.role 
                     << " | " << status << "\n";
                cout << "    Permisos -> Ventas: " << (u.permissions.ventas ? "SI" : "NO")
                     << " | Inventario: " << (u.permissions.inventario ? "SI" : "NO")
                     << " | Caja: " << (u.permissions.caja ? "SI" : "NO")
                     << " | Compras: " << (u.permissions.compras ? "SI" : "NO")
                     << " | Usuarios: " << (u.permissions.usuarios ? "SI" : "NO") << "\n";
            }
            cout << "-------------------------\n";
        } else if (opt == "2") {
            AppUser u;
            u.id = "u-" + to_string(time(0)).substr(5);
            cout << "Usuario (login): ";
            cin >> u.username;
            // Check duplicate
            auto it = find_if(appUsers.begin(), appUsers.end(), [&](const AppUser& usr) {
                return usr.username == u.username;
            });
            if (it != appUsers.end()) {
                cout << RED << ">>> Error: El nombre de usuario ya existe." << RESET << "\n";
                continue;
            }
            cout << "Contraseña: ";
            cin >> u.password;
            cout << "Nombre Completo: ";
            cin.ignore();
            getline(cin, u.fullName);
            cout << "Rol (Admin / Cajero): ";
            cin >> u.role;
            if (u.role != "Admin" && u.role != "Cajero") u.role = "Cajero";
            
            if (u.role == "Admin") {
                u.permissions = {true, true, true, true, true};
            } else {
                string ans;
                cout << "¿Permiso Ventas? (s/n): "; cin >> ans; u.permissions.ventas = (ans == "s");
                cout << "¿Permiso Inventario? (s/n): "; cin >> ans; u.permissions.inventario = (ans == "s");
                cout << "¿Permiso Caja? (s/n): "; cin >> ans; u.permissions.caja = (ans == "s");
                cout << "¿Permiso Compras? (s/n): "; cin >> ans; u.permissions.compras = (ans == "s");
                u.permissions.usuarios = false; // Cashiers cannot edit users
            }
            u.isActive = true;
            appUsers.push_back(u);
            saveUsers();
            addLog("Creó usuario: " + u.username, "Usuarios");
            cout << GREEN << ">>> Usuario creado correctamente." << RESET << "\n";
        } else if (opt == "3") {
            string uid;
            cout << "Ingrese ID del usuario a eliminar: ";
            cin >> uid;
            if (uid == "u-admin" || uid == activeSession.id) {
                cout << RED << ">>> Error: No se puede eliminar el administrador raiz o tu propio usuario." << RESET << "\n";
                continue;
            }
            auto it = remove_if(appUsers.begin(), appUsers.end(), [&](const AppUser& usr) {
                return usr.id == uid;
            });
            if (it != appUsers.end()) {
                appUsers.erase(it, appUsers.end());
                saveUsers();
                addLog("Eliminó usuario ID: " + uid, "Usuarios");
                cout << GREEN << ">>> Usuario eliminado." << RESET << "\n";
            } else {
                cout << RED << ">>> Error: Usuario no encontrado." << RESET << "\n";
            }
        } else if (opt == "4") {
            break;
        }
    }
}

// Supplier & Purchase Orders module
void renderComprasView() {
    while (true) {
        cout << BLUE << "\n=========================================" << RESET << "\n";
        cout << WHITE << "MODULO DE COMPRAS Y PROVEEDORES" << RESET << "\n";
        cout << BLUE << "=========================================" << RESET << "\n";
        cout << "1. Listar Proveedores\n";
        cout << "2. Registrar Nuevo Proveedor\n";
        cout << "3. Crear Orden de Compra (OC)\n";
        cout << "4. Listar Órdenes de Compra (OC)\n";
        cout << "5. Recibir/Cancelar Orden de Compra\n";
        cout << "6. Regresar al Hub Principal\n";
        cout << BLUE << "=========================================" << RESET << "\n";
        cout << "Seleccione: ";
        string opt;
        cin >> opt;
        if (opt == "1") {
            cout << "\n--- PROVEEDORES REGISTRADOS ---\n";
            if (suppliers.empty()) {
                cout << "  (No hay proveedores registrados)\n";
            } else {
                for (const auto& s : suppliers) {
                    cout << "ID: " << left << setw(8) << s.id 
                         << " | Empresa: " << setw(18) << s.companyName 
                         << " | Contacto: " << setw(15) << s.name 
                         << " | Tel: " << setw(12) << s.phone 
                         << " | Acumulado OC: " << config.currencySymbol << " " << fixed << setprecision(2) << s.totalPurchases << "\n";
                }
            }
            cout << "--------------------------------\n";
        } else if (opt == "2") {
            Supplier s;
            s.id = "sup-" + to_string(time(0)).substr(6);
            cout << "Nombre del Contacto: ";
            cin.ignore();
            getline(cin, s.name);
            cout << "Razón Social / Empresa: ";
            getline(cin, s.companyName);
            cout << "Correo Electrónico: ";
            cin >> s.email;
            cout << "Teléfono: ";
            cin >> s.phone;
            s.totalPurchases = 0.0;
            suppliers.push_back(s);
            saveSuppliers();
            addLog("Registró proveedor: " + s.companyName, "Compras");
            cout << GREEN << ">>> Proveedor registrado con éxito." << RESET << "\n";
        } else if (opt == "3") {
            if (suppliers.empty()) {
                cout << RED << ">>> Error: Debe registrar al menos un proveedor primero." << RESET << "\n";
                continue;
            }
            cout << "Seleccione el ID del proveedor de la lista:\n";
            for (const auto& s : suppliers) {
                cout << "  - [" << s.id << "] " << s.companyName << "\n";
            }
            string sid;
            cout << "ID: ";
            cin >> sid;
            auto supIt = find_if(suppliers.begin(), suppliers.end(), [&](const Supplier& s) { return s.id == sid; });
            if (supIt == suppliers.end()) {
                cout << RED << ">>> Error: Proveedor no encontrado." << RESET << "\n";
                continue;
            }

            PurchaseOrder o;
            o.id = "po-" + to_string(time(0)).substr(5);
            o.supplierId = sid;
            o.supplierName = supIt->companyName;
            o.status = "pending";
            o.createdAt = getTimestamp();
            o.total = 0.0;

            cout << "Agregue insumos al pedido. Ingrese 'fin' en el código de barras para terminar.\n";
            while (true) {
                cout << "Ingrese código de barras del producto (Ej: 1001, 2001, 3001, etc.): ";
                string bc;
                cin >> bc;
                if (bc == "fin") break;
                
                auto prodIt = find_if(products.begin(), products.end(), [&](const Product& p) { return p.barcode == bc; });
                if (prodIt == products.end()) {
                    cout << RED << ">>> Error: Producto no registrado." << RESET << "\n";
                    continue;
                }

                int qty;
                double cost;
                cout << "Cantidad a ordenar: ";
                cin >> qty;
                cout << "Costo Unitario de compra (" << config.currencySymbol << "): ";
                cin >> cost;
                if (qty <= 0 || cost <= 0.0) {
                    cout << RED << ">>> Error: Datos incorrectos." << RESET << "\n";
                    continue;
                }

                PurchaseItem item;
                item.productId = prodIt->id;
                item.productName = prodIt->name;
                item.quantity = qty;
                item.costPrice = cost;
                o.items.push_back(item);
                o.total += (cost * qty);
                cout << GREEN << ">>> Item agregado al borrador." << RESET << "\n";
            }

            if (o.items.empty()) {
                cout << RED << ">>> Orden cancelada: Carrito vacío." << RESET << "\n";
            } else {
                purchaseOrders.push_back(o);
                savePurchaseOrders();
                addLog("Creó Orden de Compra " + o.id + " por total: " + to_string(o.total), "Compras");
                cout << GREEN << ">>> Orden de Compra " << o.id << " creada como Pendiente." << RESET << "\n";
            }
        } else if (opt == "4") {
            cout << "\n--- HISTORIAL DE ORDENES DE COMPRA ---\n";
            if (purchaseOrders.empty()) {
                cout << "  (No hay órdenes creadas)\n";
            } else {
                for (const auto& o : purchaseOrders) {
                    string color = (o.status == "received" ? GREEN : (o.status == "cancelled" ? RED : YELLOW));
                    cout << "ID: " << left << setw(10) << o.id 
                         << " | Fecha: " << setw(18) << o.createdAt 
                         << " | Proveedor: " << setw(18) << o.supplierName 
                         << " | Total: " << config.currencySymbol << " " << setw(8) << fixed << setprecision(2) << o.total 
                         << " | Estado: " << color << o.status << RESET << "\n";
                }
            }
            cout << "--------------------------------------\n";
        } else if (opt == "5") {
            string poid;
            cout << "Ingrese ID de la orden a gestionar: ";
            cin >> poid;
            auto it = find_if(purchaseOrders.begin(), purchaseOrders.end(), [&](const PurchaseOrder& o) { return o.id == poid; });
            if (it == purchaseOrders.end()) {
                cout << RED << ">>> Error: Orden no encontrada." << RESET << "\n";
                continue;
            }
            if (it->status != "pending") {
                cout << RED << ">>> Error: Esta orden ya está " << it->status << "." << RESET << "\n";
                continue;
            }
            cout << "OC: " << it->id << " | Total: " << config.currencySymbol << " " << it->total << "\n";
            cout << "1. Recibir Orden (Incrementa stock y actualiza costo de compra)\n";
            cout << "2. Cancelar Orden\n";
            cout << "3. Regresar\n";
            cout << "Seleccione: ";
            string cmd;
            cin >> cmd;
            if (cmd == "1") {
                // Receive items
                for (const auto& item : it->items) {
                    for (auto& p : products) {
                        if (p.id == item.productId) {
                            p.stock += item.quantity;
                            p.costPrice = item.costPrice; // update average cost
                            break;
                        }
                    }
                }
                it->status = "received";
                
                // Update supplier total
                for (auto& s : suppliers) {
                    if (s.id == it->supplierId) {
                        s.totalPurchases += it->total;
                        break;
                    }
                }

                savePurchaseOrders();
                saveSuppliers();
                addLog("Recibió Orden de Compra " + it->id + ". Stock actualizado.", "Compras");
                cout << GREEN << ">>> Orden de compra recibida. Stock de productos actualizado." << RESET << "\n";
            } else if (cmd == "2") {
                it->status = "cancelled";
                savePurchaseOrders();
                addLog("Canceló Orden de Compra " + it->id, "Compras");
                cout << GREEN << ">>> Orden de compra cancelada." << RESET << "\n";
            }
        } else if (opt == "6") {
            break;
        }
    }
}

// Quotes & Billing module
void renderQuotesView() {
    while (true) {
        cout << MAGENTA << "\n=========================================" << RESET << "\n";
        cout << WHITE << "MODULO DE COTIZACIONES Y PRESUPUESTOS" << RESET << "\n";
        cout << MAGENTA << "=========================================" << RESET << "\n";
        cout << "1. Crear Nueva Cotización / Presupuesto\n";
        cout << "2. Listar Cotizaciones Registradas\n";
        cout << "3. Convertir Cotización a Venta (Facturar)\n";
        cout << "4. Regresar al Hub Principal\n";
        cout << MAGENTA << "=========================================" << RESET << "\n";
        cout << "Seleccione: ";
        string opt;
        cin >> opt;
        if (opt == "1") {
            Quote q;
            q.id = "cot-" + to_string(time(0)).substr(5);
            cout << "Nombre del Cliente: ";
            cin.ignore();
            getline(cin, q.clientName);
            q.status = "pending";
            q.date = getTimestamp();
            q.code = "COT-" + to_string(time(0)).substr(6);
            q.subtotal = 0.0;

            cout << "Agregue artículos. Ingrese 'fin' en el código de barras para terminar.\n";
            while (true) {
                cout << "Ingrese código de barras del producto: ";
                string bc;
                cin >> bc;
                if (bc == "fin") break;

                auto prodIt = find_if(products.begin(), products.end(), [&](const Product& p) { return p.barcode == bc; });
                if (prodIt == products.end()) {
                    cout << RED << ">>> Error: Producto no encontrado." << RESET << "\n";
                    continue;
                }

                double qtyOrWeight;
                if (prodIt->isBulk) {
                    cout << "Peso en Kg: ";
                    cin >> qtyOrWeight;
                } else {
                    double qty;
                    cout << "Cantidad: ";
                    cin >> qty;
                    qtyOrWeight = (int)qty;
                }

                if (qtyOrWeight <= 0.0) {
                    cout << RED << ">>> Error: Cantidad incorrecta." << RESET << "\n";
                    continue;
                }

                bool found = false;
                for (auto& item : q.items) {
                    if (item.product.id == prodIt->id) {
                        if (prodIt->isBulk) item.weight += qtyOrWeight;
                        else item.quantity += (int)qtyOrWeight;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    CartItem item;
                    item.product = *prodIt;
                    if (prodIt->isBulk) {
                        item.weight = qtyOrWeight;
                        item.quantity = 1;
                    } else {
                        item.quantity = (int)qtyOrWeight;
                        item.weight = 0.0;
                    }
                    q.items.push_back(item);
                }
                
                double rowTotal = prodIt->isBulk ? (prodIt->salePrice * qtyOrWeight) : (prodIt->salePrice * (int)qtyOrWeight);
                q.subtotal += rowTotal;
                cout << GREEN << ">>> Articulo agregado a la cotización." << RESET << "\n";
            }

            if (q.items.empty()) {
                cout << RED << ">>> Cotización cancelada: Carrito vacío." << RESET << "\n";
            } else {
                q.tax = q.subtotal * (config.taxRate / 100.0);
                q.total = q.subtotal + q.tax;
                
                cout << "\n-----------------------------------------\n";
                cout << "COTIZACION PREVIA: " << q.code << "\n";
                cout << "Cliente: " << q.clientName << "\n";
                printCart(q.items);
                cout << "Subtotal: " << config.currencySymbol << " " << q.subtotal << "\n";
                cout << "IVA (" << config.taxRate << "%): " << config.currencySymbol << " " << q.tax << "\n";
                cout << "TOTAL NETO: " << config.currencySymbol << " " << q.total << "\n";
                cout << "-----------------------------------------\n";
                cout << "¿Guardar Cotización? (s/n): ";
                string ans;
                cin >> ans;
                if (ans == "s") {
                    quotes.push_back(q);
                    saveQuotes();
                    addLog("Guardó Cotización: " + q.code + " para " + q.clientName, "Cotizaciones");
                    cout << GREEN << ">>> Cotización guardada con éxito." << RESET << "\n";
                }
            }
        } else if (opt == "2") {
            cout << "\n--- HISTORIAL DE COTIZACIONES ---\n";
            if (quotes.empty()) {
                cout << "  (No hay cotizaciones registradas)\n";
            } else {
                for (const auto& q : quotes) {
                    string color = (q.status == "converted" ? GREEN : (q.status == "deleted" ? RED : YELLOW));
                    cout << "ID: " << left << setw(10) << q.id 
                         << " | Código: " << setw(10) << q.code 
                         << " | Cliente: " << setw(18) << q.clientName 
                         << " | Total: " << config.currencySymbol << " " << setw(8) << fixed << setprecision(2) << q.total 
                         << " | Estado: " << color << q.status << RESET << "\n";
                }
            }
            cout << "---------------------------------\n";
        } else if (opt == "3") {
            if (caja.isOpen == false) {
                cout << RED << ">>> Error: La Caja Registradora está cerrada. Debe abrir la caja antes de facturar." << RESET << "\n";
                continue;
            }
            string cotId;
            cout << "Ingrese ID de la cotización a facturar: ";
            cin >> cotId;
            auto it = find_if(quotes.begin(), quotes.end(), [&](const Quote& q) { return q.id == cotId; });
            if (it == quotes.end()) {
                cout << RED << ">>> Error: Cotización no encontrada." << RESET << "\n";
                continue;
            }
            if (it->status != "pending") {
                cout << RED << ">>> Error: Esta cotización ya está " << it->status << "." << RESET << "\n";
                continue;
            }

            // Verify stock for all items
            bool hasStock = true;
            for (const auto& item : it->items) {
                auto prodIt = find_if(products.begin(), products.end(), [&](const Product& p) { return p.id == item.product.id; });
                if (prodIt != products.end()) {
                    int req = item.product.isBulk ? 1 : item.quantity;
                    if (prodIt->stock < req) {
                        cout << RED << ">>> Error: Stock insuficiente de " << prodIt->name << " (Stock: " << prodIt->stock << ", Requerido: " << req << ")" << RESET << "\n";
                        hasStock = false;
                    }
                }
            }

            if (!hasStock) {
                cout << RED << ">>> Cobro cancelado por falta de stock." << RESET << "\n";
                continue;
            }

            // Execute sales deduction and box add
            for (const auto& item : it->items) {
                for (auto& p : products) {
                    if (p.id == item.product.id) {
                        if (p.isBulk) p.stock = max(0, p.stock - 1);
                        else p.stock = max(0, p.stock - item.quantity);
                        break;
                    }
                }
            }

            it->status = "converted";
            caja.currentCash += it->total;
            caja.movements.push_back({"IN", it->total, "Venta por Cotización: " + it->code, getTimestamp()});
            
            saveQuotes();
            saveCaja();
            saveTables(); // save products stock state
            
            addLog("Facturó Cotización " + it->code + " por total: " + to_string(it->total), "Cotizaciones");
            cout << GREEN << ">>> ¡Venta Facturada con éxito! Comprobante emitido." << RESET << "\n";
            cout << "Efectivo agregado a Caja: " << config.currencySymbol << " " << it->total << "\n";
        } else if (opt == "4") {
            break;
        }
    }
}

// Audit Logs Screen
void renderAuditLogs() {
    cout << "\n--- HISTORIAL DE AUDITORIA Y SEGURIDAD ---\n";
    if (auditLogs.empty()) {
        cout << "  (No hay logs grabados en esta sesion)\n";
    } else {
        for (const auto& log : auditLogs) {
            cout << log << "\n";
        }
    }
    cout << "------------------------------------------\n";
    cout << "Presione ENTER para continuar...";
    cin.ignore();
    string dummy;
    getline(cin, dummy);
}

int main() {
    enableColors();
    initData();
    addLog("Sistema C++ Iniciado Exitosamente.", "Seguridad");
    
    string option;
    
    // LOGIN LOOP
    while (!hasActiveSession) {
        cout << CYAN << "=========================================" << RESET << "\n";
        cout << WHITE << "      INICIO DE SESION - POS MULTIRUBRO  " << RESET << "\n";
        cout << CYAN << "=========================================" << RESET << "\n";
        string user, pass;
        cout << "Ingrese Usuario: ";
        cin >> user;
        cout << "Ingrese Contraseña: ";
        cin >> pass;
        
        auto it = find_if(appUsers.begin(), appUsers.end(), [&](const AppUser& u) {
            return u.username == user && u.password == pass && u.isActive;
        });
        
        if (it != appUsers.end()) {
            activeSession = *it;
            hasActiveSession = true;
            addLog("Inicio de sesión exitoso: " + activeSession.username + " (" + activeSession.role + ")", "Seguridad");
            cout << GREEN << ">>> ¡Bienvenido, " << activeSession.fullName << "!" << RESET << "\n";
        } else {
            cout << RED << ">>> Error: Credenciales invalidas o usuario inactivo." << RESET << "\n";
            cout << "¿Desea salir del programa? (s/n): ";
            string exitAns;
            cin >> exitAns;
            if (exitAns == "s") {
                cout << "Saliendo del programa...\n";
                return 0;
            }
        }
    }
    
    while (true) {
        if (currentModule == "hub") {
            cout << YELLOW << "\n=========================================" << RESET << "\n";
            cout << WHITE << "   PUNTO DE VENTA MULTIRUBRO · HUB C++   " << RESET << "\n";
            cout << "   Usuario: " << CYAN << activeSession.username << RESET << " (" << activeSession.role << ")\n";
            cout << YELLOW << "=========================================" << RESET << "\n";
            cout << "1. Restaurante (Restaurantes, Cafeterías)\n";
            cout << "2. Farmacia (Droguerías, Boticas)\n";
            cout << "3. Panaderia (Pastelerías, Reposterías)\n";
            cout << "4. Fruteria (Ensaladas de Frutas, Heladerías)\n";
            cout << "5. Almacen General / Papelería / Retail\n";
            cout << "-----------------------------------------\n";
            cout << "6. Escanear Codigo de Barras (Global)\n";
            cout << "7. Caja Registradora (Turnos y Arqueos)\n";
            cout << "8. Compras a Proveedores\n";
            cout << "9. Cotizaciones y Facturación\n";
            cout << "10. Gestion de Usuarios y Permisos (Solo Admin)\n";
            cout << "11. Configuracion del Negocio\n";
            cout << "12. Licenciamiento y Activacion\n";
            cout << "13. Auditoría y Logs de Seguridad\n";
            cout << "14. Cerrar Sesión (" << activeSession.username << ")\n";
            cout << "15. Salir del Sistema\n";
            cout << YELLOW << "=========================================" << RESET << "\n";
            cout << "Seleccione una opcion: ";
            cin >> option;

            if (option == "1") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                if (isModuleAccessible("restaurant")) currentModule = "restaurant";
                else cout << RED << ">>> Error: Módulo bloqueado. Requiere licencia de Restaurante o Licencia Global." << RESET << "\n";
            }
            else if (option == "2") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                if (isModuleAccessible("pharmacy")) currentModule = "pharmacy";
                else cout << RED << ">>> Error: Módulo bloqueado. Requiere licencia de Farmacia o Licencia Global." << RESET << "\n";
            }
            else if (option == "3") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                if (isModuleAccessible("bakery")) currentModule = "bakery";
                else cout << RED << ">>> Error: Módulo bloqueado. Requiere licencia de Panadería o Licencia Global." << RESET << "\n";
            }
            else if (option == "4") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                if (isModuleAccessible("fruit")) currentModule = "fruit";
                else cout << RED << ">>> Error: Módulo bloqueado. Requiere licencia de Frutería o Licencia Global." << RESET << "\n";
            }
            else if (option == "5") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                if (isModuleAccessible("business")) currentModule = "business";
                else cout << RED << ">>> Error: Módulo bloqueado. Requiere licencia de Almacén o Licencia Global." << RESET << "\n";
            }
            else if (option == "6") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                string barcode;
                cout << "Ingrese codigo de barras a escanear (Ej. 1001, 2001, 3001, 4001, 5001): ";
                cin >> barcode;
                if (!scanBarcodeGlobal(barcode)) {
                    cout << RED << ">>> Error: Codigo de barras no registrado en el sistema." << RESET << "\n";
                }
            }
            else if (option == "7") {
                if (!activeSession.permissions.caja) {
                    cout << RED << ">>> Error: No tienes permisos para Caja." << RESET << "\n";
                    continue;
                }
                renderCajaView();
            }
            else if (option == "8") {
                if (!activeSession.permissions.compras) {
                    cout << RED << ">>> Error: No tienes permisos para Compras." << RESET << "\n";
                    continue;
                }
                renderComprasView();
            }
            else if (option == "9") {
                if (!activeSession.permissions.ventas) {
                    cout << RED << ">>> Error: No tienes permisos para Ventas." << RESET << "\n";
                    continue;
                }
                renderQuotesView();
            }
            else if (option == "10") {
                if (!activeSession.permissions.usuarios) {
                    cout << RED << ">>> Error: No tienes permisos para configurar Usuarios." << RESET << "\n";
                    continue;
                }
                renderUsersView();
            }
            else if (option == "11") {
                if (activeSession.role != "Admin") {
                    cout << RED << ">>> Error: Solo el administrador puede configurar el negocio." << RESET << "\n";
                    continue;
                }
                renderConfigView();
            }
            else if (option == "12") {
                if (activeSession.role != "Admin") {
                    cout << RED << ">>> Error: Solo el administrador puede activar licencias." << RESET << "\n";
                    continue;
                }
                renderLicenseView();
            }
            else if (option == "13") {
                renderAuditLogs();
            }
            else if (option == "14") {
                addLog("Cierre de sesión de: " + activeSession.username, "Seguridad");
                hasActiveSession = false;
                // Re-trigger login block
                while (!hasActiveSession) {
                    cout << CYAN << "=========================================" << RESET << "\n";
                    cout << WHITE << "      INICIO DE SESION - POS MULTIRUBRO  " << RESET << "\n";
                    cout << CYAN << "=========================================" << RESET << "\n";
                    string user, pass;
                    cout << "Ingrese Usuario: ";
                    cin >> user;
                    cout << "Ingrese Contraseña: ";
                    cin >> pass;
                    
                    auto it = find_if(appUsers.begin(), appUsers.end(), [&](const AppUser& u) {
                        return u.username == user && u.password == pass && u.isActive;
                    });
                    
                    if (it != appUsers.end()) {
                        activeSession = *it;
                        hasActiveSession = true;
                        addLog("Inicio de sesión exitoso: " + activeSession.username + " (" + activeSession.role + ")", "Seguridad");
                        cout << GREEN << ">>> ¡Bienvenido, " << activeSession.fullName << "!" << RESET << "\n";
                    } else {
                        cout << RED << ">>> Error: Credenciales invalidas." << RESET << "\n";
                    }
                }
            }
            else if (option == "15") {
                cout << GREEN << "Cerrando sistema POS C++. ¡Hasta luego!" << RESET << "\n";
                break;
            }
            else {
                cout << RED << "Opcion invalida." << RESET << "\n";
            }
        } 
        else {
            renderSalesView();
            cin >> option;

            if (option == "1") {
                string barcode;
                cout << "Escanee o ingrese codigo de barras: ";
                cin >> barcode;
                
                // Try global scanner lookup
                if (!scanBarcodeGlobal(barcode)) {
                    cout << RED << ">>> Error: Producto no encontrado." << RESET << "\n";
                }
            }
            else if (option == "2") {
                if (!activeSession.permissions.inventario) {
                    cout << RED << ">>> Error: No tienes permisos de inventario (mesas)." << RESET << "\n";
                    continue;
                }
                string tableName;
                cout << "Ingrese el nombre de la nueva mesa (Ej: Terraza 4): ";
                cin.ignore();
                getline(cin, tableName);
                addCustomTable(tableName);
            }
            else if (option == "3" && (currentModule == "restaurant" || currentModule == "bakery" || currentModule == "fruit")) {
                string tableId;
                cout << "Ingrese ID de la mesa a seleccionar (Ej. rt-1, bt-1, ft-1): ";
                cin >> tableId;
                selectedTableId = tableId;
                cout << GREEN << ">>> Mesa " << tableId << " seleccionada." << RESET << "\n";
            }
            else if (option == "4" && (currentModule == "restaurant" || currentModule == "bakery" || currentModule == "fruit")) {
                selectedTableId = "";
                cout << ">>> Mesa deseleccionada. Operando en modo Caja Directa.\n";
            }
            else if (option == "5" && (currentModule == "restaurant" || currentModule == "bakery" || currentModule == "fruit")) {
                string tableId, resName, resTime;
                cout << "ID de mesa a reservar: ";
                cin >> tableId;
                cout << "Nombre del cliente: ";
                cin.ignore();
                getline(cin, resName);
                cout << "Hora de reserva (Ej: 19:30): ";
                cin >> resTime;

                vector<TableState>* tables = (currentModule == "restaurant" ? &restaurantTables : (currentModule == "bakery" ? &bakeryTables : &fruitTables));
                bool tblFound = false;
                for (auto& t : *tables) {
                    if (t.id == tableId) {
                        t.status = "reserved";
                        t.reservationName = resName;
                        t.reservationTime = resTime;
                        tblFound = true;
                        cout << GREEN << ">>> Mesa " << tableId << " reservada con exito para " << resName << " a las " << resTime << "." << RESET << "\n";
                        saveTables();
                        break;
                    }
                }
                if (!tblFound) {
                    cout << RED << ">>> Error: Mesa no encontrada." << RESET << "\n";
                }
            }
            else if (option == "6") {
                // Checkout process
                if (caja.isOpen == false) {
                    cout << RED << ">>> Error: La Caja Registradora está cerrada. Debe abrir el turno en Caja antes de cobrar." << RESET << "\n";
                    continue;
                }

                vector<CartItem>* cartPtr = nullptr;
                bool isTable = false;
                
                if (!selectedTableId.empty()) {
                    vector<TableState>* tables = (currentModule == "restaurant" ? &restaurantTables : (currentModule == "bakery" ? &bakeryTables : &fruitTables));
                    for (auto& t : *tables) {
                        if (t.id == selectedTableId) {
                            cartPtr = &t.cart;
                            isTable = true;
                            break;
                        }
                    }
                } else {
                    cartPtr = &activeCarts[currentModule];
                }

                if (cartPtr && !cartPtr->empty()) {
                    double total = 0.0;
                    for (const auto& item : *cartPtr) {
                        total += (item.product.isBulk ? item.product.salePrice * item.weight : item.product.salePrice * item.quantity);
                    }
                    
                    // Deduct stock levels in sales
                    for (const auto& item : *cartPtr) {
                        for (auto& p : products) {
                            if (p.id == item.product.id) {
                                if (p.isBulk) p.stock = max(0, p.stock - 1);
                                else p.stock = max(0, p.stock - item.quantity);
                                break;
                            }
                        }
                    }

                    cout << GREEN << "\n>>> COBRO PROCESADO CON EXITO." << RESET << "\n";
                    cout << "Total pagado: " << GREEN << config.currencySymbol << " " << fixed << setprecision(2) << total << RESET << "\n";
                    
                    // Register movement in cash drawer
                    caja.currentCash += total;
                    caja.movements.push_back({"IN", total, "Venta POS - Modulo: " + currentModule + (isTable ? (" (Mesa: " + selectedTableId + ")") : ""), getTimestamp()});
                    saveCaja();
                    
                    if (isTable) {
                        vector<TableState>* tables = (currentModule == "restaurant" ? &restaurantTables : (currentModule == "bakery" ? &bakeryTables : &fruitTables));
                        for (auto& t : *tables) {
                            if (t.id == selectedTableId) {
                                t.cart.clear();
                                t.status = "free";
                                t.guestsCount = 0;
                                break;
                            }
                        }
                        selectedTableId = "";
                        saveTables();
                    } else {
                        cartPtr->clear();
                    }
                    saveTables(); // save product stock reduction
                    addLog("Venta POS por total: " + to_string(total), currentModule);
                } else {
                    cout << RED << ">>> Error: El carrito esta vacio. No hay nada que cobrar." << RESET << "\n";
                }
            }
            else if (option == "7") {
                currentModule = "hub";
                selectedTableId = "";
            }
            else {
                cout << RED << "Opcion invalida." << RESET << "\n";
            }
        }
    }

    return 0;
}
