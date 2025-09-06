'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Fetch user data
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      {/* Container that matches body content */}
      <div className="container-mobile !py-0">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-3xl font-bold text-[#00bcd4]">LA</span>
            <span className="text-3xl font-bold text-[#1e40af] ml-2">MATTRESS</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link 
              href="/portal" 
              className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200"
            >
              Member Portal
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/billing" 
                  className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200"
                >
                  Billing
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-6 py-2.5 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-[#ffd700] hover:bg-[#ffed4a] text-[#1e40af] font-bold px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Login
              </Link>
            )}
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
              <Link
                href="/portal"
                className="block text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Member Portal
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/billing"
                    className="block text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Billing
                  </Link>
                  <div className="pt-4 pb-2">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-4 pb-2">
                    <Link
                      href="/login"
                      className="block w-full bg-[#ffd700] hover:bg-[#ffed4a] text-[#1e40af] font-bold text-center py-3 px-4 rounded-lg transition-all shadow-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}