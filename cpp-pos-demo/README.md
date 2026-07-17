# C++ POS Simulator Completo

Este directorio contiene una versión en C++ (consola interactiva) altamente robusta y completa del sistema de Punto de Venta (POS) Multirubro.

## Características Portadas e Implementadas:
1. **Autenticación e Inicio de Sesión Obligatorio:**
   - La aplicación requiere iniciar sesión con usuario y contraseña al arrancar.
   - Credenciales de administrador por defecto: **Usuario:** `admin` | **Contraseña:** `admin`.
   - Carga y guarda los usuarios en `users.txt`.
2. **Roles y Permisos de Usuarios:**
   - Gestión de usuarios y asignación de permisos individuales (Ventas, Caja, Inventario, Compras, Usuarios).
   - Los permisos limitan dinámicamente las opciones disponibles en el Hub (por ejemplo, los cajeros tienen bloqueados los módulos a los que no tienen permiso o el menú de configuración).
3. **Módulo de Compras a Proveedores:**
   - Registro y listado de proveedores (`suppliers.txt`).
   - Creación de órdenes de compra (OC) asociadas a proveedores y productos.
   - Recepción de órdenes de compra: al recibirlas, se incrementa automáticamente el stock del producto en el almacén y se actualiza su costo de compra promedio.
4. **Módulo de Cotizaciones y Presupuestos:**
   - Creación de cotizaciones para clientes en formato borrador (`quotes.txt`).
   - Muestra subtotales, IVA y total de venta con base en los productos seleccionados del catálogo.
   - Opción para "Convertir Cotización a Venta" (Facturar): valida que la caja registradora esté abierta, valida el stock en inventario, realiza el descuento de stock automático y suma los fondos al saldo total de la caja.
5. **Caja Registradora y Arqueo:**
   - Turnos de caja (apertura, movimientos IN/OUT) y cierre de caja detallado (arqueo esperado vs físico con diferencias).
6. **Configuración y Divisa Dinámica:**
   - Edición de datos de empresa, divisa (COP, USD, EUR, etc.), símbolo de moneda e IVA con actualización reactiva en toda la interfaz de la consola.
7. **Licenciamiento y Prueba de 30 Días:**
   - Validación de licencias globales y por módulos específicos con periodo de prueba simulado.
8. **Persistencia Local Completa:**
   - Todos los datos persisten automáticamente en archivos de texto locales.

## Credenciales y Claves de Licencia de Prueba:

- **Usuario Admin por Defecto:** `admin` | **Contraseña:** `admin`
- **Licencia Global del Sistema:** `POS-AAAA-AAAA-AAAA-AAAA-06TK`
- **Módulo de Restaurante:** `POS-REST-AAAA-AAAA-AAAA-06XV`
- **Módulo de Farmacia:** `POS-PHAR-AAAA-AAAA-AAAA-06W9`
- **Módulo de Panadería:** `POS-BAKE-AAAA-AAAA-AAAA-06UV`
- **Módulo de Frutería:** `POS-FRUT-AAAA-AAAA-AAAA-06YF`
- **Módulo de Almacén:** `POS-BUSI-AAAA-AAAA-AAAA-06X3`

## Compilación y Ejecución

### GCC (g++):
```bash
g++ -std=c++17 main.cpp -o pos_demo.exe
```

### MSVC:
```cmd
cl /EHsc main.cpp /Fepos_demo.exe
```
