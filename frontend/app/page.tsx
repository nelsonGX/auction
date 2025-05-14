import RoomCreation from '../components/room/RoomCreation';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-zinc-900 to-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center relative z-10 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="relative w-16 h-16 bg-blue-600 rounded-full p-2 shadow-lg animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl mb-4">
            Modern Auction Platform
          </h1>
          
          <div className="h-1 w-24 bg-blue-500 mx-auto my-6 rounded"></div>
          
          <p className="mt-5 max-w-xl mx-auto text-xl text-zinc-300 leading-relaxed animate-slide-in">
            Create and join real-time auctions with ease.
            <span className="block text-zinc-400 text-base mt-2">Fast, secure, and user-friendly.</span>
          </p>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 border-4 border-zinc-700 rounded-full"></div>
          <div className="absolute top-20 left-20 w-40 h-40 border-4 border-zinc-700 rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-60 h-60 border-4 border-zinc-700 rounded-full"></div>
        </div>
        
        <div className="mt-12 relative z-10 mx-auto max-w-md">
          <RoomCreation />
        </div>
        
        {/* Feature highlights */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center animate-fade-in">
          <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700 transform transition-all duration-300 hover:scale-105 hover:border-zinc-600">
            <div className="w-12 h-12 mx-auto bg-blue-600/30 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Real-time Bidding</h3>
            <p className="text-zinc-400">Instant updates and notifications for a seamless auction experience.</p>
          </div>
          
          <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700 transform transition-all duration-300 hover:scale-105 hover:border-zinc-600">
            <div className="w-12 h-12 mx-auto bg-blue-600/30 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Secure Access</h3>
            <p className="text-zinc-400">Password-protected rooms and encrypted communication.</p>
          </div>
          
          <div className="bg-zinc-800/50 p-6 rounded-lg border border-zinc-700 transform transition-all duration-300 hover:scale-105 hover:border-zinc-600">
            <div className="w-12 h-12 mx-auto bg-blue-600/30 rounded-lg flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Full Control</h3>
            <p className="text-zinc-400">Host dashboard with complete auction management capabilities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}