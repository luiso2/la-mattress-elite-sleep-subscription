#!/bin/bash
# Script de migración para aplicar mejoras de diseño
# LA Mattress Elite Sleep+ Portal

echo "🚀 Iniciando migración de mejoras de diseño..."
echo "================================================"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un archivo existe
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Archivo encontrado: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Archivo no encontrado: $1"
        return 1
    fi
}

# Función para hacer backup
backup_file() {
    if [ -f "$1" ]; then
        cp "$1" "$1.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✓${NC} Backup creado: $1.backup.$(date +%Y%m%d_%H%M%S)"
    fi
}

echo ""
echo "📋 Verificando archivos de mejora..."
echo "------------------------------------"

# Verificar que existen los archivos nuevos
check_file "app/globals-fixed.css" || exit 1
check_file "components/Navbar-fixed.tsx" || exit 1
check_file "tailwind.config.ts" || echo -e "${YELLOW}⚠${NC}  Archivo opcional"

echo ""
echo "💾 Creando backups..."
echo "--------------------"

# Crear backups de archivos originales
backup_file "app/globals.css"
backup_file "components/Navbar.tsx"

echo ""
echo "🔄 Aplicando mejoras..."
echo "----------------------"

# Aplicar los cambios
if cp "app/globals-fixed.css" "app/globals.css"; then
    echo -e "${GREEN}✓${NC} globals.css actualizado"
else
    echo -e "${RED}✗${NC} Error actualizando globals.css"
    exit 1
fi

if cp "components/Navbar-fixed.tsx" "components/Navbar.tsx"; then
    echo -e "${GREEN}✓${NC} Navbar.tsx actualizado"
else
    echo -e "${RED}✗${NC} Error actualizando Navbar.tsx"
    exit 1
fi

echo ""
echo "🧹 Limpiando caché de Next.js..."
echo "--------------------------------"

# Limpiar caché de Next.js
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✓${NC} Caché de Next.js eliminado"
fi

echo ""
echo "📦 Verificando dependencias..."
echo "------------------------------"

# Verificar si Tailwind CSS está instalado correctamente
if grep -q '"tailwindcss": "^4"' package.json; then
    echo -e "${YELLOW}⚠${NC}  Usando Tailwind CSS v4 (beta)"
    echo "   Considera migrar a v3 para mayor estabilidad"
fi

echo ""
echo "✅ Migración completada!"
echo "========================"
echo ""
echo "📝 Próximos pasos:"
echo "1. Ejecuta 'npm run dev' para iniciar el servidor"
echo "2. Verifica los cambios en http://localhost:3000"
echo "3. Prueba la navegación móvil y desktop"
echo "4. Revisa el espaciado en todos los componentes"
echo ""
echo "🔙 Para revertir los cambios:"
echo "   - Los backups están en: *.backup.[timestamp]"
echo "   - Copia el backup sobre el archivo original"
echo ""
echo "📚 Documentación:"
echo "   - AUDIT_REPORT.md - Informe completo de auditoría"
echo "   - SPACING_EXAMPLES.md - Ejemplos de mejoras"
echo ""