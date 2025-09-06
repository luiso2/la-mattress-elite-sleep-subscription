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
    <>
      {/* Top Banner */}
      <div className="bg-[#1e40af] text-white text-center py-2 px-4">
        <p className="text-sm font-medium">One-Year Low Price Guarantee</p>
      </div>
      
      {/* Main Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
        <div className="container-mobile">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-[#00bcd4] text-white px-3 py-1.5 rounded font-bold text-lg shadow-sm">
                LA
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#1e40af]">MATTRESS</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/pricing" className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200">
                Pricing
              </Link>
              
              <Link href="/portal" className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200">
                Member Portal
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200">
                    Dashboard
                  </Link>
                  <Link href="/billing" className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200">
                    Billing
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-[#1e40af] font-medium transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="la-button-primary"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 hover:text-[#1e40af] p-2 rounded-md hover:bg-gray-50 transition-colors"
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
              <div className="flex flex-col space-y-2">
                <Link
                  href="/pricing"
                  className="text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 hover:bg-gray-50 rounded-md transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                
                <Link
                  href="/portal"
                  className="text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 hover:bg-gray-50 rounded-md transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Member Portal
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 hover:bg-gray-50 rounded-md transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/billing"
                      className="text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 hover:bg-gray-50 rounded-md transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Billing
                    </Link>
                    <div className="pt-2 px-4">
                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white px-4 py-3 rounded-md hover:bg-red-600 transition-colors font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-[#1e40af] font-medium py-3 px-4 hover:bg-gray-50 rounded-md transition-all"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <div className="pt-2 px-4">
                      <Link
                        href="/register"
                        className="block w-full la-button-primary text-center"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}