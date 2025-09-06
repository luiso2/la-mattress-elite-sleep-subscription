'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Mobile First */}
      <div className="bg-gradient-to-br from-[#e3f2fd] to-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="container-mobile py-8 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[#1e40af] mb-4 md:mb-6 leading-tight">
                LA MATTRESS<br/>
                <span className="text-[#00bcd4]">Elite Sleep+ Portal</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-6 md:mb-8">
                Access your exclusive member benefits
              </p>
              
              {/* Benefits List */}
              <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-left max-w-lg mx-auto lg:mx-0">
                <li className="flex items-center text-base md:text-lg text-gray-700">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">$180 in annual store credit</span>
                </li>
                <li className="flex items-center text-base md:text-lg text-gray-700">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Free delivery & setup</span>
                </li>
                <li className="flex items-center text-base md:text-lg text-gray-700">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Lifetime warranty protection</span>
                </li>
                <li className="flex items-center text-base md:text-lg text-gray-700">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">3 free mattress protector replacements</span>
                </li>
              </ul>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/portal"
                  className="la-button-primary text-lg"
                >
                  Access Member Portal
                </Link>
                <Link
                  href="/pricing"
                  className="la-button-secondary text-lg"
                >
                  View Plans
                </Link>
              </div>
            </div>
            
            {/* Card Visual - Hidden on small mobile */}
            <div className="hidden sm:block relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="bg-gradient-to-br from-[#e3f2fd] to-[#f3f4f6] rounded-xl p-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-[#00bcd4] text-white px-6 py-3 rounded-lg">
                      <span className="text-3xl font-bold">LA</span>
                    </div>
                  </div>
                  <h3 className="text-center text-2xl font-bold text-[#1e40af] mb-2">
                    ELITE SLEEP+
                  </h3>
                  <p className="text-center text-gray-600 mb-6">Premium Member Benefits</p>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Monthly Credit</p>
                      <p className="text-3xl font-bold text-green-600">$15</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Annual Value</p>
                      <p className="text-3xl font-bold text-[#1e40af]">$180</p>
                    </div>
                    <div className="bg-[#ffd700] rounded-lg p-4 text-center">
                      <p className="text-lg font-bold text-[#1e40af]">One-Year Low Price Guarantee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators - Mobile Optimized */}
          <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#1e40af] mb-1">10K+</div>
              <p className="text-sm md:text-base text-gray-600">Happy Members</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#1e40af] mb-1">4.9★</div>
              <p className="text-sm md:text-base text-gray-600">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#1e40af] mb-1">24/7</div>
              <p className="text-sm md:text-base text-gray-600">Support Available</p>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#1e40af] mb-1">100%</div>
              <p className="text-sm md:text-base text-gray-600">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}