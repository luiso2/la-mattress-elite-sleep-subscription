# Script de migración para aplicar mejoras de diseño
# LA Mattress Elite Sleep+ Portal - Windows PowerShell

Write-Host "🚀 Iniciando migración de mejoras de diseño..." -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si un archivo existe
function Test-FileExists {
    param($FilePath)
    if (Test-Path $FilePath) {
        Write-Host "✓ Archivo encontrado: $FilePath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Archivo no encontrado: $FilePath" -ForegroundColor Red
        return $false
    }
}

# Función para hacer backup
function Backup-File {
    param($FilePath)
    if (Test-Path $FilePath) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupPath = "$FilePath.backup.$timestamp"
        Copy-Item $FilePath $backupPath
        Write-Host "✓ Backup creado: $backupPath" -ForegroundColor Green
    }
}

Write-Host "📋 Verificando archivos de mejora..." -ForegroundColor Yellow
Write-Host "------------------------------------"

# Verificar que existen los archivos nuevos
if (-not (Test-FileExists "app\globals-fixed.css")) { exit 1 }
if (-not (Test-FileExists "components\Navbar-fixed.tsx")) { exit 1 }
if (-not (Test-FileExists "tailwind.config.ts")) { 
    Write-Host "⚠ tailwind.config.ts - Archivo opcional" -ForegroundColor Yellow 
}

Write-Host ""
Write-Host "💾 Creando backups..." -ForegroundColor Yellow
Write-Host "--------------------"

# Crear backups de archivos originales
Backup-File "app\globals.css"
Backup-File "components\Navbar.tsx"

Write-Host ""
Write-Host "🔄 Aplicando mejoras..." -ForegroundColor Yellow
Write-Host "----------------------"

# Aplicar los cambios
try {
    Copy-Item "app\globals-fixed.css" "app\globals.css" -Force
    Write-Host "✓ globals.css actualizado" -ForegroundColor Green
} catch {
    Write-Host "✗ Error actualizando globals.css" -ForegroundColor Red
    exit 1
}

try {
    Copy-Item "components\Navbar-fixed.tsx" "components\Navbar.tsx" -Force
    Write-Host "✓ Navbar.tsx actualizado" -ForegroundColor Green
} catch {
    Write-Host "✗ Error actualizando Navbar.tsx" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧹 Limpiando caché de Next.js..." -ForegroundColor Yellow
Write-Host "--------------------------------"

# Limpiar caché de Next.js
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Caché de Next.js eliminado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
Write-Host "------------------------------"

# Verificar si Tailwind CSS v4 está instalado
$packageJson = Get-Content "package.json" -Raw
if ($packageJson -match '"tailwindcss":\s*"\^4"') {
    Write-Host "⚠ Usando Tailwind CSS v4 (beta)" -ForegroundColor Yellow
    Write-Host "  Considera migrar a v3 para mayor estabilidad" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Migración completada!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Ejecuta 'npm run dev' para iniciar el servidor"
Write-Host "2. Verifica los cambios en http://localhost:3000"
Write-Host "3. Prueba la navegación móvil y desktop"
Write-Host "4. Revisa el espaciado en todos los componentes"
Write-Host ""
Write-Host "🔙 Para revertir los cambios:" -ForegroundColor Yellow
Write-Host "   - Los backups están en: *.backup.[timestamp]"
Write-Host "   - Copia el backup sobre el archivo original"
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "   - AUDIT_REPORT.md - Informe completo de auditoría"
Write-Host "   - SPACING_EXAMPLES.md - Ejemplos de mejoras"
Write-Host ""

# Preguntar si desea iniciar el servidor
$response = Read-Host "¿Deseas iniciar el servidor de desarrollo ahora? (S/N)"
if ($response -eq "S" -or $response -eq "s") {
    Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
    npm run dev
}