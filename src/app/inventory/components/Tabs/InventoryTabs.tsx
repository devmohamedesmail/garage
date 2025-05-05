"use client";

import React, { useState } from "react";
import ItemsTable from "../Tables/ItemsTable";
import VendorsTable from "../Tables/VendorsTable";
import OrdersTable from "../Tables/OrdersTable";

interface InventoryTabsProps {
  onDataChange: () => void;
}

export default function InventoryTabs({ onDataChange }: InventoryTabsProps) {
  const [activeTab, setActiveTab] = useState("items");

  const tabs = [
    { id: "items", label: "Items" },
    { id: "vendors", label: "Vendors" },
    { id: "orders", label: "Orders" }
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-6 text-center ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "items" && <ItemsTable onDataChange={onDataChange} />}
        {activeTab === "vendors" && <VendorsTable onDataChange={onDataChange} />}
        {activeTab === "orders" && <OrdersTable onDataChange={onDataChange} />}
      </div>
    </div>
  );
}
