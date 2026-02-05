
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { userSession, formatAddress, getUserBalance, formatSTX, isWalletConnected, getConnectedAddress } from '@/lib/stacks';
import { connect } from '@stacks/connect';
import { Wallet, LogOut, Copy, CheckCircle2 } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Function to load user data and balance
  const loadUserData = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const address = getConnectedAddress();
    
    if (address) {
      setIsConnected(true);
      setUserAddress(address);
      loadBalance(address);
    } else {
      setIsConnected(false);
      setUserAddress('');
      setBalance(0);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    
    // Listen for storage changes (wallet disconnect via another tab)
    window.addEventListener('storage', loadUserData);
    return () => window.removeEventListener('storage', loadUserData);
  }, [loadUserData]);

  const loadBalance = async (address: string) => {
    setLoadingBalance(true);
    try {
      const bal = await getUserBalance(address);
      setBalance(bal);
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const connectWallet = async () => {
    // Always sign out and clear all session data first
    if (userSession.isUserSignedIn()) {
      userSession.signUserOut();
      
      // Clear all Stacks-related data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('blockstack') || key.includes('stacks')) {
          localStorage.removeItem(key);
        }
      });
      
      setIsConnected(false);
      setUserAddress('');
      setBalance(0);
      
      // Wait a bit for storage to clear
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      const result = await connect();
      
      // Poll for user session to be ready
      let attempts = 0;
      const checkSession = setInterval(() => {
        attempts++;
        
        if (userSession.isUserSignedIn()) {
          clearInterval(checkSession);
          loadUserData();
        } else if (attempts >= 20) {
          clearInterval(checkSession);
          // Reload the page as fallback
          window.location.reload();
        }
      }, 200);
      
    } catch (error) {
      console.error('Error calling connect:', error);
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    
    // Clear all Stacks-related data from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('blockstack') || key.includes('stacks')) {
        localStorage.removeItem(key);
      }
    });
    
    setIsConnected(false);
    setUserAddress('');
    setBalance(0);
    
    window.location.reload();
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(userAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Strade</h1>
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Decentralized Marketplace</span>
            </div>
          </div>

          {/* Center Navigation - Desktop Only */}
          <nav className="hidden md:flex items-center space-x-2">
            <Link href="/">
              <span
                className={`px-4 py-2 rounded-md font-medium transition-all cursor-pointer ${
                  pathname === '/'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Home
              </span>
            </Link>
            <Link href="/marketplace">
              <span
                className={`px-4 py-2 rounded-md font-medium transition-all cursor-pointer ${
                  pathname === '/marketplace'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Marketplace
              </span>
            </Link>
            <Link href="/my-listings">
              <span
                className={`px-4 py-2 rounded-md font-medium transition-all cursor-pointer ${
                  pathname === '/my-listings'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                My Listings
              </span>
            </Link>
          </nav>

          {/* Wallet Connection & Mobile Menu */}
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-blue-500/20 hover:ring-blue-500/50 transition-all">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {userAddress.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-800">
                  <DropdownMenuLabel className="text-slate-900 dark:text-white">Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Address</span>
                      <button
                        onClick={copyAddress}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm font-mono bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 p-2 rounded break-all">
                      {formatAddress(userAddress)}
                    </p>
                  </div>
                  
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Balance</span>
                      <div className="flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {loadingBalance ? '...' : formatSTX(balance)} STX
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem
                    onClick={disconnectWallet}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={connectWallet} size="sm" className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
            
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
