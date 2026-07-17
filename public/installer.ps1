# CraftPOS GUI C++ Installer Script
$ErrorActionPreference = "Stop"

# Clear screen for impact
Clear-Host

# Set console colors if supported
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host " ██████╗██████╗  █████╗ ███████╗████████╗██████╗  ██████╗ ███████╗" -ForegroundColor Yellow
Write-Host "██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗██╔════╝" -ForegroundColor Yellow
Write-Host "██║     ██████╔╝███████║█████╗     ██║   ██████╔╝██║   ██║███████╗" -ForegroundColor Magenta
Write-Host "██║     ██╔══██╗██╔══██║██╔══╝     ██║   ██╔═══╝ ██║   ██║╚════██║" -ForegroundColor Magenta
Write-Host "╚██████╗██║  ██║██║  ██║██║        ██║   ██║     ╚██████╔╝███████║" -ForegroundColor Cyan
Write-Host " ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝      ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host "==========================================================================" -ForegroundColor Green
Write-Host " ⚡ INSTALADOR OFICIAL DE CRAFTPOS - MÁXIMO ESTILO NEOBRUTALISTA ⚡" -ForegroundColor Black -BackgroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Green

# Define directories
$InstallDir = "$env:LOCALAPPDATA\CraftPOS"
$ShortcutPath = "$HOME\Desktop\CraftPOS.lnk"
$SourceExe = "$PSScriptRoot\craftpos_gui.exe"
$SourceDll = "$PSScriptRoot\WebView2Loader.dll"
$SourceWebOut = "$PSScriptRoot\..\out"

# Check if executables exist
if (-not (Test-Path $SourceExe)) {
    Write-Host "❌ ERROR: No se encontró 'craftpos_gui.exe' en la carpeta actual." -ForegroundColor Red -BackgroundColor Black
    exit 1
}
if (-not (Test-Path $SourceDll)) {
    Write-Host "❌ ERROR: No se encontró 'WebView2Loader.dll' en la carpeta actual." -ForegroundColor Red -BackgroundColor Black
    exit 1
}
if (-not (Test-Path $SourceWebOut)) {
    Write-Host "❌ ERROR: No se encontró la carpeta 'out' de Next.js." -ForegroundColor Red -BackgroundColor Black
    exit 1
}

Write-Host "📁 [1/4] Creando directorio del sistema..." -ForegroundColor Cyan
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

Write-Host "⚙️ [2/4] Copiando ejecutable C++ y WebView2Loader..." -ForegroundColor Cyan
Copy-Item -Path $SourceExe -Destination "$InstallDir\craftpos_gui.exe" -Force
Copy-Item -Path $SourceDll -Destination "$InstallDir\WebView2Loader.dll" -Force

Write-Host "🎨 [3/4] Desplegando interfaz gráfica moderna (out)..." -ForegroundColor Cyan
$InstallWebOut = "$InstallDir\out"
if (Test-Path $InstallWebOut) {
    Remove-Item -Path $InstallWebOut -Recurse -Force
}
Copy-Item -Path $SourceWebOut -Destination $InstallWebOut -Recurse -Force

# Copy C++ console executable as fallback/terminal version
if (Test-Path "$PSScriptRoot\craftpos.exe") {
    Copy-Item -Path "$PSScriptRoot\craftpos.exe" -Destination "$InstallDir\craftpos_terminal.exe" -Force
}

# Copy database text files if they exist to preserve state
$FilesToCopy = @("config.txt", "license.txt", "caja.txt", "tables.txt", "users.txt", "suppliers.txt", "quotes.txt", "purchase_orders.txt")
foreach ($file in $FilesToCopy) {
    $srcPath = "$PSScriptRoot\$file"
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination "$InstallDir\$file" -Force
    }
}

Write-Host "🚀 [4/4] Creando acceso directo en tu Escritorio..." -ForegroundColor Cyan
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "$InstallDir\craftpos_gui.exe"
    $Shortcut.WorkingDirectory = $InstallDir
    $Shortcut.Description = "CraftPOS GUI Desktop (C++ & Edge Chromium)"
    $Shortcut.Save()
    Write-Host "⭐ Acceso directo creado con éxito en: $ShortcutPath" -ForegroundColor Yellow
} catch {
    Write-Warning "⚠️ No se pudo crear el acceso directo de escritorio automáticamente: $_"
}

Write-Host "==========================================================================" -ForegroundColor Green
Write-Host " 🎉 ¡INSTALACIÓN COMPLETADA CON ÉXITO CON EL MEJOR ESTILO! 🎉" -ForegroundColor Black -BackgroundColor Green
Write-Host " Ya puedes abrir tu sistema desde el Escritorio con el nombre: CraftPOS" -ForegroundColor Yellow
Write-Host "==========================================================================" -ForegroundColor Green
