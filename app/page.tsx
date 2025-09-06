'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#e3f2fd] via-white to-white">
        <div className="container-mobile py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6">
                <span className="text-[#1e40af] block mb-2">LA MATTRESS</span>
                <span className="text-[#00bcd4] block">Elite Sleep+ Portal</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Access your exclusive member benefits
              </p>
              
              {/* Benefits List con más espaciado */}
              <div className="mb-12 max-w-xl mx-auto lg:mx-0 bg-gray-50 rounded-xl p-6 lg:p-8">
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <div className="flex-shrink-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium text-gray-800 leading-relaxed">$180 in annual store credit</div>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <div className="flex-shrink-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium text-gray-800 leading-relaxed">Free delivery & setup</div>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start mb-6">
                  <div className="flex-shrink-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium text-gray-800 leading-relaxed">Lifetime warranty protection</div>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start">
                  <div className="flex-shrink-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-lg font-medium text-gray-800 leading-relaxed">3 free mattress protector replacements</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/portal" className="la-button-primary text-lg px-8 py-4 inline-block text-center">
                  Access Member Portal
                </Link>
              </div>
            </div>
            
            {/* Right Card */}
            <div className="relative max-w-md mx-auto lg:max-w-none">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="bg-gradient-to-br from-[#e3f2fd] to-[#f0f0f0] rounded-xl p-8">
                  {/* Logo */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center bg-[#00bcd4] text-white px-8 py-4 rounded-lg shadow-lg">
                      <span className="text-3xl font-bold">LA</span>
                    </div>
                  </div>
                  
                  <h3 className="text-center text-2xl font-bold text-[#1e40af] mb-3">
                    ELITE SLEEP+
                  </h3>
                  <p className="text-center text-gray-600 mb-8 text-lg">Premium Member Benefits</p>
                  
                  {/* Benefits Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-5 text-center shadow-md">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Monthly Credit</p>
                      <p className="text-3xl font-bold text-green-600">$15</p>
                    </div>
                    <div className="bg-white rounded-lg p-5 text-center shadow-md">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Annual Value</p>
                      <p className="text-3xl font-bold text-[#1e40af]">$180</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#ffd700] rounded-lg p-4 text-center shadow-md">
                    <p className="text-lg font-bold text-[#1e40af]">One-Year Low Price Guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container-mobile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-3">
              <div className="text-4xl lg:text-5xl font-bold text-[#1e40af]">10K+</div>
              <p className="text-gray-600 font-medium">Happy Members</p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl lg:text-5xl font-bold text-[#1e40af]">4.9★</div>
              <p className="text-gray-600 font-medium">Average Rating</p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl lg:text-5xl font-bold text-[#1e40af]">24/7</div>
              <p className="text-gray-600 font-medium">Support Available</p>
            </div>
            <div className="space-y-3">
              <div className="text-4xl lg:text-5xl font-bold text-[#1e40af]">100%</div>
              <p className="text-gray-600 font-medium">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}