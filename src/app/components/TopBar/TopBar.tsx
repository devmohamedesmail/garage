'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiSettings } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import Link from 'next/link';

// Static route-to-title mapping
const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  // '/customers': 'Customers',
  // '/vehicles': 'Vehicles',
  // '/work-orders': 'Work Orders',
  '/inventory': 'Inventory',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/StaffPage': 'Staff',
  '/CustomersPage': 'Customers',
  '/WorkOrders': 'Work Orders',
  '/invoices': 'Invoices',
  '/VehiclesPage': 'Vehicles',
  '/newInvoice': 'Create Invoice',
  '/new_reg': 'New Registration',
  '/expenses': 'Expenses',
  '/StorageRoom_new': 'Storage Room',
  '/AppointmentsPage': 'Appointments',
};

// Helper function to get title for both static and dynamic routes
function getTitle(pathname: string): string {
  // Try an exact match first (in lowercase)
  if (routeTitles[pathname.toLowerCase()]) {
    return routeTitles[pathname.toLowerCase()];
  }
  
  // Fallback for dynamic routes based on known prefixes
  if (pathname.toLowerCase().startsWith('/customers/')) {
    return 'Customer Details';
  }
  if (pathname.toLowerCase().startsWith('/vehicles/')) {
    return 'Vehicle Details';
  }
  if (pathname.toLowerCase().startsWith('/work-orders/')) {
    return 'Work Order Details';
  }
  if (pathname.toLowerCase().startsWith('/staff/')) {
    return 'Staff Member Details';
  }
  if (pathname.toLowerCase().startsWith('/inventory/')) {
    return 'Inventory Item Details';
  }
  if (pathname.toLowerCase().startsWith('/invoices/')) {
    return 'Invoice Details';
  }

  // Default title
  return 'Page';
}

interface SearchResult {
  title: string;
  path: string;
}

const TopBar: React.FC = () => {
  // Get the current path (e.g. "/customers/6") with fallback
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const title = getTitle(pathname);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Create flattened routes for searching
  const allRoutes: SearchResult[] = Object.entries(routeTitles).map(([path, title]) => ({
    path,
    title
  }));

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Prioritize title matches over path matches
    const titleMatches = allRoutes.filter(route => 
      route.title.toLowerCase().includes(query.toLowerCase())
    );
    
    // Only include path matches if they're not already matched by title
    const pathMatches = allRoutes.filter(route => 
      route.path.toLowerCase().includes(query.toLowerCase()) && 
      !titleMatches.some(tm => tm.path === route.path)
    );
    
    // Combine results with title matches first
    const combinedResults = [...titleMatches, ...pathMatches];
    
    setSearchResults(combinedResults);
    setShowResults(true);
  };

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        searchInputRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle navigation and clear search
  const handleResultClick = (path: string) => {
    router.push(path);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="bg-white px-6 py-4 shadow-md flex justify-between items-center">
      {/* Dynamic Title */}
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

      {/* Search and Profile */}
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by page name..."
            className="px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-56"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div 
              ref={searchResultsRef}
              className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleResultClick(result.path)}
                >
                  <div className="font-medium">{result.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <FiSettings size={20} className="text-gray-600" />
        </button>
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
          <FaUserCircle size={24} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
