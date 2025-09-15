'use client';

import { useState } from 'react';
import Link from 'next/link';

// Logo component that handles fallback properly
function LogoComponent() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <Link href="/" className="flex items-center">
        <div className="text-2xl font-bold text-[#1e40af]">
          LA MATTRESS
        </div>
      </Link>
    );
  }

  return (
    <Link href="/" className="flex items-center">
      <img 
        src="/logo.png" 
        alt="LA MATTRESS" 
        className="h-12 w-auto"
        onError={() => setImageError(true)}
      />
    </Link>
  );
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      {/* Container that matches body content */}
      <div className="container-mobile !py-0">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <LogoComponent />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/portal" 
              className="bg-[#ffd700] hover:bg-[#ffed4a] text-[#1e40af] font-bold px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Access Member Portal
            </Link>
            {/* Employee Access - Subtle Link */}
            <Link 
              href="/employee/login" 
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
            >
              Staff
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-[#1e40af] p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-fadeIn">
            <div className="space-y-1">
              <div className="pt-4 pb-2">
                <Link
                  href="/portal"
                  className="block w-full bg-[#ffd700] hover:bg-[#ffed4a] text-[#1e40af] font-bold text-center py-3 px-4 rounded-lg transition-all shadow-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Access Member Portal
                </Link>
              </div>
              <div className="pt-2 pb-2 border-t border-gray-100">
                <Link
                  href="/employee/login"
                  className="block text-gray-500 hover:text-gray-700 text-sm text-center py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Employee Access
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}