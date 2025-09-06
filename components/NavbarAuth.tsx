'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarAuthProps {
  customerName?: string;
}

export default function NavbarAuth({ customerName }: NavbarAuthProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('portal_token');
    router.push('/portal');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="LA Mattress" 
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const textLogo = document.createElement('div');
                textLogo.className = 'text-xl font-bold text-[#1e40af]';
                textLogo.textContent = 'LA MATTRESS';
                e.currentTarget.parentElement?.appendChild(textLogo);
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-[#00bcd4] transition-colors">
              Home
            </Link>
            <Link href="/portal/dashboard" className="text-gray-700 hover:text-[#00bcd4] transition-colors">
              My Dashboard
            </Link>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-300">
              {customerName && (
                <span className="text-sm text-gray-600">
                  Hello, <span className="font-semibold">{customerName.split(' ')[0]}</span>
                </span>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-[#00bcd4] focus:outline-none"
              onClick={() => {
                const menu = document.getElementById('mobile-menu');
                menu?.classList.toggle('hidden');
              }}
            >
              <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div id="mobile-menu" className="md:hidden hidden pb-4">
          <div className="flex flex-col space-y-3">
            <Link href="/" className="text-gray-700 hover:text-[#00bcd4] transition-colors py-2">
              Home
            </Link>
            <Link href="/portal/dashboard" className="text-gray-700 hover:text-[#00bcd4] transition-colors py-2">
              My Dashboard
            </Link>
            <div className="pt-3 border-t border-gray-200">
              {customerName && (
                <p className="text-sm text-gray-600 mb-3">
                  Logged in as <span className="font-semibold">{customerName}</span>
                </p>
              )}
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}