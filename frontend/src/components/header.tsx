'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { GlobeAltIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/providers/AuthProvider';

export function Header() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  
  const handleLogout = () => {
    logout();
  };
  const links = [
    { href: '/dashboard', label: 'Home' },
    { href: '/results', label: 'Results' },
  ];
  if (pathname === '/login') {
    return null;
  }
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/10 bg-black/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2 shrink-0">
            <GlobeAltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            <span className="text-base sm:text-lg font-semibold text-white">
              <span className="hidden sm:inline">SpydrCrawler</span>
              <span className="sm:hidden">Spydr</span>
            </span>
          </Link>
          
          <div className="flex items-center justify-center flex-1 mx-4 sm:mx-8">
            <div className="flex items-center space-x-1 rounded-full bg-neutral-900/50 p-1 backdrop-blur-sm border border-neutral-800/50">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="relative">
                  {pathname === link.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-white shadow-lg"
                      initial={false}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 100, 
                        damping: 25,
                        mass: 0.6
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 inline-flex items-center justify-center px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-150 rounded-full min-w-[48px] sm:min-w-[64px] ${
                      pathname === link.href
                        ? 'text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {user && (
              <span className="hidden sm:inline text-sm text-neutral-400 font-medium">
                {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-300 transition-all duration-200 hover:bg-neutral-800/80 hover:text-white hover:border-neutral-600 backdrop-blur-sm cursor-pointer"
            >
              <ArrowLeftStartOnRectangleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}