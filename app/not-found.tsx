import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3f2fd] to-[#f0f0f0] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center bg-[#00bcd4] text-white px-8 py-4 rounded-lg shadow-lg">
              <span className="text-3xl font-bold">LA</span>
            </div>
          </div>
          
          {/* 404 Error */}
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-[#1e40af] mb-2">404</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Página no encontrada</h2>
            <p className="text-gray-600 mb-8">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <Link 
              href="/" 
              className="block w-full bg-[#1e40af] hover:bg-[#1565c0] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Volver al inicio
            </Link>
            
            <Link 
              href="/portal" 
              className="block w-full bg-[#ffd700] hover:bg-[#ffed4a] text-[#1e40af] font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Portal de miembros
            </Link>
          </div>
          
          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda? <Link href="/portal" className="text-[#1e40af] hover:underline font-medium">Contáctanos</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}