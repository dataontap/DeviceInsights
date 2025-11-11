import { Link, useLocation } from "wouter";
import { Smartphone, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = location.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Smartphone className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Network Services</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/network-policy" className="text-gray-700 hover:text-primary transition-colors">
              Network Policy
            </Link>
            <Link href="/api-docs" className="text-gray-700 hover:text-primary transition-colors">
              API Docs
            </Link>
            <Link href="/analytics" className="text-gray-700 hover:text-primary transition-colors">
              Analytics
            </Link>
            <Link href="/admin">
              <Button className="bg-primary text-white hover:bg-blue-700">
                Admin Portal
              </Button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-primary">
              Home
            </Link>
            <Link href="/network-policy" className="block px-3 py-2 text-gray-700 hover:text-primary">
              Network Policy
            </Link>
            <Link href="/api-docs" className="block px-3 py-2 text-gray-700 hover:text-primary">
              API Docs
            </Link>
            <Link href="/analytics" className="block px-3 py-2 text-gray-700 hover:text-primary">
              Analytics
            </Link>
            <Link href="/admin" className="block px-3 py-2">
              <Button className="w-full bg-primary text-white hover:bg-blue-700">
                Admin Portal
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
