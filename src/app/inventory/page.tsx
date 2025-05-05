"use client";

import { useState, useEffect } from "react";
import api from "@/services/api"; // Import the API service
import { useRouter } from "next/navigation";
import DashboardCards from "./components/Cards/DashboardCards";
import ActionButtons from "./components/ActionButtons";
import InventoryTabs from "./components/Tabs/InventoryTabs";

// Modal Components
import NewItemModal from "./components/Modals/NewItemModal";
import NewVendorModal from "./components/Modals/NewVendorModal";
import NewOrderModal from "./components/Modals/NewOrderModal";
import RequisitionsModal from "./components/Modals/RequisitionsModal";
import OrdersExpectedModal from "./components/Modals/OrdersExpectedModal";
import CreateOrderModal from "./components/Modals/CreateOrderModal";
import BarcodeDisplayModal from "./components/Modals/BarcodeDisplayModal";

interface Requisition {
  requisition_id: number | string;
  item_id: number | string;
  item_name: string;
  quantity_requested: number;
  status: string;
  reason: string;
  created_at: string;
}

interface CreatedItem {
  item_id: number | string;
  item_name: string;
  serial_number?: string;
  [key: string]: any; // For other properties
}

export default function InventoryPage() {
  // State for modal visibility
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showRequisitionsModal, setShowRequisitionsModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showOrdersExpectedModal, setShowOrdersExpectedModal] = useState(false);
  const [ordersExpectedType, setOrdersExpectedType] = useState("today"); // "today" or "tomorrow"
  
  // State for barcode modal
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [createdItem, setCreatedItem] = useState<CreatedItem | null>(null);

  // State for selected requisition when creating an order
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);

  // Dashboard summary data
  const [dashboardData, setDashboardData] = useState({
    pendingRequisitions: 0,
    ordersToday: 0,
    ordersTomorrow: 0,
  });

  // State for inventory items
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Function to load dashboard data
  const loadDashboardData = async () => {
    try {
      // Set default values in case API calls fail
      let pendingRequisitions = 0;
      let ordersToday = 0;
      let ordersTomorrow = 0;

      try {
        // Modified to filter out handled requisitions
        const requisitionsRes = await api.get("/purchase_requisitions?status=Pending&is_handled=0");
        if (requisitionsRes.data) {
          pendingRequisitions = requisitionsRes.data.totalPages > 0 ? requisitionsRes.data.requisitions.length : 0;
        }
      } catch (error) {
        console.error("Error fetching requisitions:", error);
      }

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      try {
        const todayOrdersRes = await api.get(`/purchase_orders?expected_delivery_date=${today}`);
        if (todayOrdersRes.data) {
          ordersToday = todayOrdersRes.data.totalPages > 0 ? todayOrdersRes.data.orders.length : 0;
        }
      } catch (error) {
        console.error("Error fetching today's orders:", error);
      }

      try {
        const tomorrowOrdersRes = await api.get(`/purchase_orders?expected_delivery_date=${tomorrow}`);
        if (tomorrowOrdersRes.data) {
          ordersTomorrow = tomorrowOrdersRes.data.totalPages > 0 ? tomorrowOrdersRes.data.orders.length : 0;
        }
      } catch (error) {
        console.error("Error fetching tomorrow's orders:", error);
      }

      setDashboardData({
        pendingRequisitions,
        ordersToday,
        ordersTomorrow,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // Fetch inventory items when the component mounts
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/items');  // Changed from '/inventory' to '/api/items'
        setInventoryItems(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setError('Failed to load inventory data');
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Function to fetch items by search term or filter
  const searchItems = async () => {
    try {
      setIsLoading(true);
      let queryParams = new URLSearchParams();
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      if (selectedFilter !== 'all') {
        queryParams.append('type', selectedFilter);
      }

      const response = await api.get(`/items?${queryParams.toString()}`);  // Changed from '/inventory/search' to '/api/items'
      setInventoryItems(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error searching inventory:', error);
      setError('Failed to search inventory');
      setIsLoading(false);
    }
  };

  // Handle card clicks
  const handleRequisitionsClick = () => {
    setShowRequisitionsModal(true);
  };

  const handleOrdersExpectedClick = (type: string) => {
    setOrdersExpectedType(type);
    setShowOrdersExpectedModal(true);
  };

  // Handle action button clicks
  const handleNewItemClick = () => {
    setShowNewItemModal(true);
  };

  const handleNewVendorClick = () => {
    setShowNewVendorModal(true);
  };

  const handleNewOrderClick = () => {
    setShowNewOrderModal(true);
  };

  // Handle creating an order from requisition
  const handleCreateOrder = (requisition: Requisition) => {
    setSelectedRequisition(requisition);
    setShowRequisitionsModal(false);
    setShowCreateOrderModal(true);
  };

  // Handle item creation success
  const handleItemCreated = (item: CreatedItem) => {
    setCreatedItem(item);
    setShowNewItemModal(false);
    setShowBarcodeModal(true);
    loadDashboardData();
  };

  // Handle refreshing data after modal actions
  const handleDataRefresh = () => {
    loadDashboardData();
  };

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>

      {/* Dashboard Cards */}
      <DashboardCards
        pendingRequisitions={dashboardData.pendingRequisitions}
        ordersToday={dashboardData.ordersToday}
        ordersTomorrow={dashboardData.ordersTomorrow}
        onRequisitionsClick={handleRequisitionsClick}
        onOrdersTodayClick={() => handleOrdersExpectedClick("today")}
        onOrdersTomorrowClick={() => handleOrdersExpectedClick("tomorrow")}
      />

      {/* Action Buttons */}
      <ActionButtons
        onNewItemClick={handleNewItemClick}
        onNewVendorClick={handleNewVendorClick}
        onNewOrderClick={handleNewOrderClick}
      />

      {/* Tabs for Items, Vendors, Orders */}
      <div className="mt-6">
        <InventoryTabs onDataChange={handleDataRefresh} />
      </div>

      {/* Modals */}
      <NewItemModal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
        onSuccess={handleItemCreated}
      />

      <NewVendorModal
        isOpen={showNewVendorModal}
        onClose={() => setShowNewVendorModal(false)}
        onSuccess={handleDataRefresh}
      />

      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSuccess={handleDataRefresh}
      />

      <RequisitionsModal
        isOpen={showRequisitionsModal}
        onClose={() => setShowRequisitionsModal(false)}
        onCreateOrder={handleCreateOrder}
      />

      <OrdersExpectedModal
        isOpen={showOrdersExpectedModal}
        onClose={() => setShowOrdersExpectedModal(false)}
        type={ordersExpectedType as "today" | "tomorrow"}
      />

      <CreateOrderModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        onSuccess={handleDataRefresh}
        selectedRequisition={selectedRequisition}
      />

      {/* Barcode Display Modal */}
      <BarcodeDisplayModal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        item={createdItem}
      />
    </div>
  );
}
