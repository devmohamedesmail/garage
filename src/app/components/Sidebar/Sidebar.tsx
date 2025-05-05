'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Category type definition
interface Category {
  name: string;
  icon: string;
  items: MenuItem[];
}

// MenuItem type definition
interface MenuItem {
  name: string;
  href: string;
  icon: string;
}

const Sidebar: React.FC = () => {
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    Dashboard: true,  // Open by default
  });
  
  // Define menu items grouped by category
  const categories: Category[] = [
    {
      name: 'Dashboard',
      icon: '🏠',
      items: [
        { name: 'Main Dashboard', href: '/', icon: '📊' },
      ]
    },
    {
      name: 'Customer Management',
      icon: '👥',
      items: [
        { name: 'Customers', href: '/customers', icon: '👤' },
        // { name: 'Vehicles', href: '/VehiclesPage', icon: '🚗' },
      ]
    },
    {
      name: 'Work Management',
      icon: '🔧',
      items: [
        { name: 'Car Cards Dashboard', href: '/car-cards-dashboard', icon: '🚗' },
        { name: 'Work Orders', href: '/WorkOrders', icon: '📋' },
      ]
    },
    {
      name: 'Finance',
      icon: '💰',
      items: [
        { name: 'Invoices', href: '/invoices', icon: '💵' },
        { name: 'overtime', href: '/overtime', icon: '⏰' },
        { name: 'Expenses', href: '/expenses', icon: '💸' },
        { name: 'Reports', href: '/reports/finance', icon: '📈' },
      ]
    },
    {
      name: 'Inventory',
      icon: '📦',
      items: [
        { name: 'Inventory', href: '/inventory', icon: '🔍' },
        { name: 'Storage Room', href: '/StorageRoom_new', icon: '🏢' },
      ]
    },
    {
      name: 'Staff',
      icon: '👨‍💼',
      items: [
        { name: 'Staff Management', href: '/StaffPage', icon: '👨‍💼' },
        { name: 'Staff Reports', href: '/reports/staff', icon: '📄' },
      ]
    },
    {
      name: 'Settings',
      icon: '⚙️',
      items: [
        { name: 'Variation Settings', href: '/VariationSettingsPage', icon: '🔧' },
      ]
    },
    {
      name: 'Supervisor',
      icon: '👮',
      items: [
        { name: 'Supervisor Dashboard', href: '/supervisor/dashboard', icon: '📋' },
        { name: 'Technician Manners', href: '/supervisor/technician-manners', icon: '👷' },
      ]
    }
  ];

  // Function to toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Add the CSS styles on component mount
  useEffect(() => {
    // Check if styles are already added to prevent duplicates
    const existingStyle = document.getElementById('sidebar-scroll-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'sidebar-scroll-styles';
      style.innerHTML = `
        .sidebar-scroll::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        
        .sidebar-scroll {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        .category-transition {
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <nav className="bg-white w-64 min-h-screen p-4 shadow-lg flex flex-col">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Image
          src="/Final-logo.png"
          alt="Your logo here"
          width={50}
          height={20}
          priority
          className="h-auto"
        />
      </div>

      {/* Categorized Menu Items - Using flex and overflow for proper scrolling */}
      <div className="flex-grow overflow-y-auto sidebar-scroll">
        <ul>
          {categories.map((category) => (
            <li key={category.name} className="mb-2">
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category.name)}
                className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium text-gray-800">{category.name}</span>
                </div>
                <span className="text-gray-500 transition-transform duration-200" style={{ 
                  transform: expandedCategories[category.name] ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  ›
                </span>
              </div>
              
              {/* Category Items */}
              {expandedCategories[category.name] && (
                <ul className="ml-6 mt-1 category-transition">
                  {category.items.map((item) => (
                    <li key={item.name} className="mb-2">
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-500 p-1 rounded-md"
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
