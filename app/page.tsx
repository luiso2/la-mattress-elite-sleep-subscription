'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#e3f2fd] to-white">
        <div className="container-mobile py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-6">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="text-[#1e40af]">LA MATTRESS</span>
                <br />
                <span className="text-[#00bcd4]">Elite Sleep+ Portal</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-600 max-w-xl mx-auto lg:mx-0">
                Access your exclusive member benefits
              </p>
              
              {/* Benefits List */}
              <div className="space-y-4 max-w-xl mx-auto lg:mx-0">
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">$180 in annual store credit</span>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Free delivery & setup</span>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">Lifetime warranty protection</span>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-800">3 free mattress protector replacements</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Link href="/portal" className="la-button-primary text-lg px-8 py-4">
                  Access Member Portal
                </Link>
                <Link href="/pricing" className="la-button-secondary text-lg px-8 py-4">
                  View Plans
                </Link>
              </div>
            </div>
            
            {/* Right Card */}
            <div className="relative max-w-md mx-auto lg:max-w-none">
              <div className="card transform hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-[#e3f2fd] to-[#f3f4f6] rounded-xl p-8">
                  {/* Logo */}
                  <div className="text-center mb-6">
                    <div className="inline-block bg-[#00bcd4] text-white px-6 py-3 rounded-lg shadow-lg">
                      <span className="text-3xl font-bold">LA</span>
                    </div>
                  </div>
                  
                  <h3 className="text-center text-2xl font-bold text-[#1e40af] mb-2">
                    ELITE SLEEP+
                  </h3>
                  <p className="text-center text-gray-600 mb-8">Premium Member Benefits</p>
                  
                  {/* Benefits Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Monthly Credit</p>
                      <p className="text-3xl font-bold text-green-600">$15</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Annual Value</p>
                      <p className="text-3xl font-bold text-[#1e40af]">$180</p>
                    </div>
                  </div>
                  
                  <div className="bg-[#ffd700] rounded-lg p-4 text-center shadow-sm">
                    <p className="text-lg font-bold text-[#1e40af]">One-Year Low Price Guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-mobile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[#1e40af]">10K+</div>
              <p className="text-gray-600">Happy Members</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[#1e40af]">4.9★</div>
              <p className="text-gray-600">Average Rating</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[#1e40af]">24/7</div>
              <p className="text-gray-600">Support Available</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-[#1e40af]">100%</div>
              <p className="text-gray-600">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}