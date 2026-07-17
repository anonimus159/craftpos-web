# CraftPOS GUI C++ Installer Script
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "     INSTALADOR DE CRAFTPOS GUI (C++)    " -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan

# Define directories
$InstallDir = "$env:LOCALAPPDATA\CraftPOS"
$ShortcutPath = "$HOME\Desktop\CraftPOS.lnk"
$SourceExe = "$PSScriptRoot\CraftPOS.exe"
$SourceDll = "$PSScriptRoot\WebView2Loader.dll"
$SourceWebOut = "$PSScriptRoot\..\out"

# Check if executables exist
if (-not (Test-Path $SourceExe)) {
    Write-Error "No se encontro 'CraftPOS.exe' en la carpeta actual."
    exit 1
}
if (-not (Test-Path $SourceDll)) {
    Write-Error "No se encontro 'WebView2Loader.dll' en la carpeta actual."
    exit 1
}
if (-not (Test-Path $SourceWebOut)) {
    Write-Error "No se encontro la carpeta de diseño web 'out' en la raiz del proyecto."
    exit 1
}

Write-Host "Creando directorio de instalacion..." -ForegroundColor Yellow
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

Write-Host "Copiando ejecutable y dependencias..." -ForegroundColor Yellow
Copy-Item -Path $SourceExe -Destination "$InstallDir\CraftPOS.exe" -Force
Copy-Item -Path $SourceDll -Destination "$InstallDir\WebView2Loader.dll" -Force
if (Test-Path "$PSScriptRoot\craftpos_icon.ico") {
    Copy-Item -Path "$PSScriptRoot\craftpos_icon.ico" -Destination "$InstallDir\craftpos_icon.ico" -Force
}

Write-Host "Copiando carpeta de diseño gráfico (out)..." -ForegroundColor Yellow
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

Write-Host "Creando acceso directo en el Escritorio..." -ForegroundColor Yellow
try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "$InstallDir\CraftPOS.exe"
    $Shortcut.WorkingDirectory = $InstallDir
    $Shortcut.Description = "CraftPOS GUI Desktop (C++ & Edge Chromium)"
    if (Test-Path "$InstallDir\craftpos_icon.ico") {
        $Shortcut.IconLocation = "$InstallDir\craftpos_icon.ico"
    }
    $Shortcut.Save()
    Write-Host "Acceso directo creado en: $ShortcutPath" -ForegroundColor Green
} catch {
    Write-Warning "No se pudo crear el acceso directo de escritorio: $_"
}

Write-Host "=========================================" -ForegroundColor Green
Write-Host " ¡INSTALACION GRAFICA COMPLETADA CON EXITO!" -ForegroundColor Green
Write-Host " Puedes abrir la app moderna desde tu Escritorio" -ForegroundColor White
Write-Host "        Nombre del Acceso: CraftPOS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
