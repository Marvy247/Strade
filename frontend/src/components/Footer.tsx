import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Strade</h3>
            <p className="text-slate-600 text-sm">
              A decentralized marketplace built on Stacks blockchain.
              Buy and sell goods securely with smart contracts.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-slate-900 transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/my-listings" className="hover:text-slate-900 transition-colors">
                  My Listings
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-slate-900 transition-colors">
                  Help & FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a 
                  href="https://www.stacks.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                >
                  Stacks Blockchain
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://explorer.hiro.so/?chain=testnet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                >
                  Testnet Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                >
                  <Github className="h-3 w-3" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-600">
          <p>&copy; 2024 Strade. Built on Stacks blockchain. All rights reserved.</p>
          <p className="mt-2 text-xs text-slate-500">
            Testnet version - For demonstration purposes only
          </p>
        </div>
      </div>
    </footer>
  );
}
