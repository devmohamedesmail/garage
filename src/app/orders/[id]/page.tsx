"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiPrinter, FiDownload, FiClock, FiAlertTriangle, FiCheckCircle, FiBox, FiTruck } from "react-icons/fi";
import api from "@/services/api";

interface PurchaseOrder {
  order_id: number;
  requisition_id: number;
  vendor_id: number;
  vendor_name?: string;
  order_date: string;               // e.g. "2025-04-13"
  expected_delivery_date: string | null;
  unit_cost: number;
  quantity_ordered: number;
  quantity_received?: number;       // New field: number of units already received
  status: string;                   // e.g. "Pending", "Partially Received", "Received", "Cancelled"
  received_date: string | null;
  created_at: string;
  updated_at: string;
  item_id?: number;
  item_name?: string;               // Added item name field
  quantity_requested?: number;
  delivery_status?: string;         // From API: 'Today', 'Tomorrow', 'Overdue', 'Future Date', 'Not Specified'
  next_delivery_date?: string | null; // New field: for partial deliveries, when is the next delivery expected
}

// New interface for delivery history
interface DeliveryRecord {
  date: string;
  quantity: number;
  notes?: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = useParams(); // dynamic route param: /orders/[orderId]

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Update form fields (for general order updates)
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [quantityOrdered, setQuantityOrdered] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Receive form fields (for recording delivery)
  const [quantityReceived, setQuantityReceived] = useState("");
  const [fullyDelivered, setFullyDelivered] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [nextDeliveryDate, setNextDeliveryDate] = useState(""); // New state for next delivery date
  
  // Extra quantity confirmation modal state
  const [showExtraQuantityModal, setShowExtraQuantityModal] = useState(false);
  const [extraQuantityData, setExtraQuantityData] = useState<{
    ordered: number;
    wouldBeReceived: number;
    message: string;
    pendingSubmission: {
      qtyRec: number;
      fullyDelivered: boolean;
      deliveryNote: string;
      nextDeliveryDate: string;
    } | null;
  }>({
    ordered: 0,
    wouldBeReceived: 0,
    message: "",
    pendingSubmission: null
  });
  
  // Mock delivery history - in a real app, this would be fetched from the API
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryRecord[]>([]);

  // Helper to convert a date string to YYYY-MM-DD
  const toYMD = (s: string | null) => (s ? new Date(s).toISOString().split("T")[0] : "");

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'received': return 'bg-green-100 text-green-800';
      case 'partially received': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Helper to format date display
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  // -----------------------------
  // 1) Fetch order details  
  // -----------------------------
  async function fetchOrder() {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get(`/purchase_orders/${id}`);
      const data = response.data;
      setOrder(data);
      // Pre-fill update form values based on the order data
      setExpectedDelivery(toYMD(data.expected_delivery_date));
      setUnitCost(data.unit_cost.toString());
      setQuantityOrdered(data.quantity_ordered.toString());
      setUpdateStatus(data.status);
      // Reset the receive form values
      setQuantityReceived("");
      setFullyDelivered(false);
      
      // Populate mock delivery history
      if (data.quantity_received && data.quantity_received > 0) {
        // In a real app, you'd fetch the actual delivery history
        const mockHistory: DeliveryRecord[] = [];
        if (data.received_date) {
          mockHistory.push({
            date: data.received_date,
            quantity: data.quantity_received,
            notes: "Initial delivery"
          });
        }
        setDeliveryHistory(mockHistory);
      }
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // -----------------------------
  // 2) Order Edit Form Submission  
  // -----------------------------
  async function handleUpdateOrder(e: FormEvent) {
    e.preventDefault();
    setUpdateError(null);
    setMessage("");
    setSubmitting(true);
    
    try {
      if (!unitCost || parseFloat(unitCost) <= 0) {
        throw new Error("Please enter a valid unit cost");
      }
      
      if (!quantityOrdered || parseInt(quantityOrdered) <= 0) {
        throw new Error("Please enter a valid quantity");
      }
      
      const body = {
        expected_delivery_date: expectedDelivery || null,
        unit_cost: parseFloat(unitCost),
        quantity_ordered: parseInt(quantityOrdered),
        status: updateStatus || null,
      };

      const response = await api.put(`/purchase_orders/${id}`, body);
      
      if (!response) throw new Error("Failed to update purchase order");
      setMessage("Purchase order updated successfully");
      fetchOrder();
    } catch (e: any) {
      setUpdateError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // -----------------------------
  // 3) Receive Order Form Submission  
  // -----------------------------
  async function handleReceive(e: FormEvent) {
    e.preventDefault();
    setReceiveError(null);
    setMessage("");
    setSubmitting(true);
    if (!order) return;

    const qtyRec = parseInt(quantityReceived, 10);
    if (isNaN(qtyRec) || qtyRec <= 0) {
      setReceiveError("Please enter a valid received quantity");
      setSubmitting(false);
      return;
    }

    // Check if a next delivery date is required but not provided
    // Only require next delivery date for partial deliveries (when not fully delivered)
    if (!fullyDelivered && !nextDeliveryDate) {
      setReceiveError("Please enter the next expected delivery date for this partial delivery");
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post(`/purchase_orders/${id}/receive`, {
        quantity_received: qtyRec,
        fully_delivered: fullyDelivered,
        notes: deliveryNote || "Received via supervisor entry",
        next_delivery_date: !fullyDelivered ? nextDeliveryDate : null,
      });

      const data = response.data;
      
      // Handle the extra quantity error code
      if (response.status >= 400) {
        // Check if this is an extra quantity error that needs confirmation
        if (data.error === "extra_quantity") {
          // Ask user for confirmation to proceed with extra quantity
          setExtraQuantityData({
            ordered: data.ordered,
            wouldBeReceived: data.would_be_received,
            message: data.message,
            pendingSubmission: {
              qtyRec,
              fullyDelivered,
              deliveryNote: deliveryNote || "Received via supervisor entry",
              nextDeliveryDate: !fullyDelivered ? nextDeliveryDate : null,
            }
          });
          setShowExtraQuantityModal(true);
        } else {
          // This is a regular error
          throw new Error(data.error || "Failed to record received quantity");
        }
      } else {
        setMessage("Delivery recorded successfully");
      }
      
      // Add to our local delivery history (in a real app, we'd refetch)
      setDeliveryHistory([...deliveryHistory, {
        date: new Date().toISOString(),
        quantity: qtyRec,
        notes: deliveryNote || "Standard delivery"
      }]);
      
      setDeliveryNote("");
      setQuantityReceived("");
      setFullyDelivered(false);
      setNextDeliveryDate("");
      fetchOrder();
    } catch (e: any) {
      setReceiveError(e.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  // Handle confirmation of extra quantity
  async function handleConfirmExtraQuantity() {
    setShowExtraQuantityModal(false);
    setSubmitting(true);
    
    try {
      // Resubmit with confirmation flag
      const confirmResponse = await api.post(`/purchase_orders/${id}/receive`, {
        quantity_received: extraQuantityData.pendingSubmission?.qtyRec,
        fully_delivered: extraQuantityData.pendingSubmission?.fullyDelivered,
        notes: extraQuantityData.pendingSubmission?.deliveryNote,
        next_delivery_date: extraQuantityData.pendingSubmission?.nextDeliveryDate,
        confirm_extra_quantity: true // Add confirmation flag
      });
      
      if (confirmResponse.status >= 400) {
        throw new Error(confirmResponse.data.error || "Failed to record received quantity");
      }
      
      setMessage("Delivery with extra quantity recorded successfully");
      // Add to our local delivery history (in a real app, we'd refetch)
      setDeliveryHistory([...deliveryHistory, {
        date: new Date().toISOString(),
        quantity: extraQuantityData.pendingSubmission?.qtyRec || 0,
        notes: extraQuantityData.pendingSubmission?.deliveryNote || "Standard delivery"
      }]);
      
      setDeliveryNote("");
      setQuantityReceived("");
      setFullyDelivered(false);
      setNextDeliveryDate("");
      fetchOrder();
    } catch (e: any) {
      setReceiveError(e.message);
    } finally {
      setSubmitting(false);
    }
  }
  
  // -----------------------------
  // 4) Export/Print functions
  // -----------------------------
  function handleExport() {
    if (!order) return;
    
    // Create export data
    const data = {
      order_id: order.order_id,
      vendor: order.vendor_name,
      date: formatDate(order.order_date),
      status: order.status,
      items: {
        quantity: order.quantity_ordered,
        unit_cost: order.unit_cost,
        total: order.quantity_ordered * order.unit_cost
      },
      delivery: {
        expected: formatDate(order.expected_delivery_date),
        received: order.quantity_received || 0,
        remaining: order.quantity_ordered - (order.quantity_received || 0)
      }
    };
    
    // Convert to JSON string
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    // Create download link and click it
    const link = document.createElement('a');
    link.href = href;
    link.download = `purchase-order-${order.order_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  function handlePrint() {
    window.print();
  }

  // -----------------------------
  // Render  
  // -----------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Loading purchase order #{id}...</p>
      </div>
    );
  }
  
  if (fetchError) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 max-w-3xl mx-auto">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-500 text-xl mr-2" />
          <p className="text-red-700 font-medium">Error: {fetchError}</p>
        </div>
        <button 
          onClick={fetchOrder} 
          className="mt-4 bg-white border border-red-300 hover:bg-red-50 px-4 py-2 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-3xl mx-auto">
        <p className="text-gray-700">No order found with ID #{id}.</p>
        <button 
          onClick={() => router.push('/orders')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          View All Orders
        </button>
      </div>
    );
  }

  // Calculate received & remaining; if quantity_received is not provided, assume 0.
  const receivedQty = order.quantity_received || 0;
  const remainingQty = order.quantity_ordered - receivedQty;
  const totalCost = order.unit_cost * order.quantity_ordered;
  
  // Calculate delivery progress percentage - cap at 100% if exceeding
  const deliveryProgressRaw = order.quantity_ordered > 0 ? (receivedQty / order.quantity_ordered) * 100 : 0;
  const deliveryProgress = Math.min(deliveryProgressRaw, 100); // Cap at 100% for progress bar
  const displayProgress = Math.round(deliveryProgressRaw); // But show actual percentage in text
  
  // Get delivery status information from the API
  const deliveryStatus = order.delivery_status || 'Not Specified';
  // Use the isLate flag for backward compatibility until all pages are updated
  const isLate = deliveryStatus === 'Overdue';
  
  // Helper function to get the right icon and styles for delivery status
  const getDeliveryStatusInfo = (status: string) => {
    switch(status) {
      case 'Today':
        return {
          icon: <FiClock className="text-xl" />,
          className: 'text-blue-800 bg-blue-50 px-3 py-1 rounded',
          label: 'Expected Today'
        };
      case 'Tomorrow':
        return {
          icon: <FiTruck className="text-xl" />,
          className: 'text-purple-800 bg-purple-50 px-3 py-1 rounded',
          label: 'Expected Tomorrow'
        };
      case 'Overdue':
        return {
          icon: <FiAlertTriangle className="text-xl" />,
          className: 'text-red-800 bg-red-50 px-3 py-1 rounded',
          label: 'Delivery Overdue'
        };
      case 'Future Date':
        return {
          icon: <FiTruck className="text-xl" />,
          className: 'text-gray-800 bg-gray-50 px-3 py-1 rounded',
          label: 'Future Delivery'
        };
      default:
        return {
          icon: null,
          className: '',
          label: ''
        };
    }
  };
  
  const deliveryStatusInfo = getDeliveryStatusInfo(deliveryStatus);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Header with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-bold">Purchase Order #{order.order_id}</h1>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm transition-colors"
          >
            <FiPrinter /> Print
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm transition-colors"
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-lg p-4 flex items-center justify-between ${getStatusColor(order.status)}`}>
        <div className="flex items-center gap-2">
          {order.status === "Received" ? (
            <FiCheckCircle className="text-xl" />
          ) : order.status === "Partially Received" ? (
            <FiBox className="text-xl" />
          ) : (
            <FiTruck className="text-xl" />
          )}
          <span className="font-medium">Status: {order.status}</span>
        </div>
        
        {deliveryStatusInfo.icon && (
          <div className={`flex items-center gap-2 ${deliveryStatusInfo.className}`}>
            {deliveryStatusInfo.icon}
            <span className="text-sm font-medium">{deliveryStatusInfo.label}</span>
          </div>
        )}
      </div>

      {/* Success/Error messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {message}
        </div>
      )}

      {/* Order Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">Order Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Requisition ID</p>
            <p className="font-medium">{order.requisition_id || "Direct Order"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vendor</p>
            <p className="font-medium">{order.vendor_name || `ID: ${order.vendor_id}`}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Item</p>
            <p className="font-medium">{order.item_name || "Unknown Item"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">{formatDate(order.order_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expected Delivery</p>
            <p className="font-medium flex items-center">
              {formatDate(order.expected_delivery_date)}
              {deliveryStatus !== 'Not Specified' && (
                <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded ${
                  deliveryStatus === 'Overdue' ? 'bg-red-100 text-red-800' : 
                  deliveryStatus === 'Today' ? 'bg-blue-100 text-blue-800' :
                  deliveryStatus === 'Tomorrow' ? 'bg-purple-100 text-purple-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {deliveryStatus}
                </span>
              )}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-medium mt-6">Quantities & Cost</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Quantity Ordered</p>
            <p className="font-medium">{order.quantity_ordered} units</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unit Cost</p>
            <p className="font-medium">${Number(order.unit_cost).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="font-medium font-mono">${totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Delivery Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Delivery Progress</span>
            <span>{displayProgress}% {displayProgress > 100 ? "(Extra Received)" : "Complete"}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${deliveryProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Received: {receivedQty}</span>
            <span>
              {remainingQty > 0 
                ? `Remaining: ${remainingQty}` 
                : remainingQty < 0 
                  ? `Extra Received: ${Math.abs(remainingQty)}` 
                  : "Fully Received"}
            </span>
          </div>
        </div>

        {order.received_date && (
          <div className="pt-2">
            <p className="text-sm text-gray-500">Received Date</p>
            <p className="font-medium">{formatDate(order.received_date)}</p>
          </div>
        )}
        
        {/* Next Delivery Date - show only for partially received orders */}
        {order.status === "Partially Received" && order.next_delivery_date && (
          <div className="pt-2 border-t border-gray-100 mt-2">
            <p className="text-sm text-gray-500 flex items-center">
              <FiTruck className="mr-1 text-blue-500" /> Next Expected Delivery
            </p>
            <p className="font-medium text-blue-700">{formatDate(order.next_delivery_date)}</p>
            <p className="text-xs text-gray-500">
              Remaining {remainingQty} units scheduled for delivery
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-400 pt-4">
          Created: {new Date(order.created_at).toLocaleString()} | Updated: {new Date(order.updated_at).toLocaleString()}
        </div>
      </div>

      {/* Delivery History (would typically be fetched from API) */}
      {deliveryHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Delivery History</h2>
          <div className="space-y-4">
            {deliveryHistory.map((record, i) => (
              <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Received {record.quantity} units</p>
                    {record.notes && <p className="text-sm text-gray-500">{record.notes}</p>}
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Edit Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:hidden">
        <h2 className="text-xl font-semibold mb-4">Update Order</h2>
        {updateError && <p className="text-red-600 mb-4 p-2 bg-red-50 rounded">{updateError}</p>}
        
        <form onSubmit={handleUpdateOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              >
                <option>Pending</option>
                <option>Partially Received</option>
                <option>Received</option>
                <option>Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 pl-6 border"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Ordered</label>
              <input
                type="number"
                value={quantityOrdered}
                onChange={(e) => setQuantityOrdered(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                min="1"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Receive Order Form */}
      {order.status !== "Cancelled" && order.status !== "Received" && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:hidden">
          <h2 className="text-xl font-semibold mb-4">Record Delivery</h2>
          {receiveError && <p className="text-red-600 mb-4 p-2 bg-red-50 rounded">{receiveError}</p>}
          
          <form onSubmit={handleReceive} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
                <input
                  type="number"
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  min="1"
                  placeholder="Enter quantity received"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Expected: {remainingQty} units (you can exceed this if more was received)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  placeholder="Any notes about this delivery"
                />
              </div>

              {/* Next Delivery Date Field - only shown if not fully delivered */}
              {!fullyDelivered && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Expected Delivery Date {!fullyDelivered && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={nextDeliveryDate}
                    onChange={(e) => setNextDeliveryDate(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    min={new Date().toISOString().split('T')[0]}
                    required={!fullyDelivered}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for partial deliveries - when do you expect the rest of the items?
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center pl-4 border border-gray-200 rounded">
              <input
                id="fully-delivered-checkbox"
                type="checkbox"
                checked={fullyDelivered}
                onChange={(e) => {
                  setFullyDelivered(e.target.checked);
                  // If fully delivered, auto-fill the received quantity with the remaining quantity
                  if (e.target.checked && order) {
                    setQuantityReceived(remainingQty.toString());
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="fully-delivered-checkbox" className="w-full py-3 ml-2 text-sm font-medium text-gray-900">
                Mark as Fully Delivered
              </label>
            </div>
            
            <button 
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
            >
              {submitting ? 'Processing...' : 'Submit Delivery'}
            </button>
          </form>
        </div>
      )}

      {/* Extra Quantity Confirmation Modal */}
      {showExtraQuantityModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black opacity-50 absolute inset-0"></div>
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full z-10 p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Extra Quantity</h3>
            <p className="text-sm text-gray-700 mb-4">
              {extraQuantityData.message}
            </p>
            
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>Ordered Quantity:</span>
              <span>{extraQuantityData.ordered} units</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mb-4">
              <span>Would Be Received:</span>
              <span className="font-medium text-gray-900">{extraQuantityData.wouldBeReceived} units</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowExtraQuantityModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowExtraQuantityModal(false);
                  setSubmitting(true);
                  
                  // Resubmit with confirmation flag
                  const confirmRes = await api.post(`/purchase_orders/${id}/receive`, {
                    quantity_received: extraQuantityData.pendingSubmission?.qtyRec,
                    fully_delivered: extraQuantityData.pendingSubmission?.fullyDelivered,
                    notes: extraQuantityData.pendingSubmission?.deliveryNote,
                    next_delivery_date: extraQuantityData.pendingSubmission?.nextDeliveryDate,
                    confirm_extra_quantity: true // Add confirmation flag
                  });
                  
                  const confirmData = confirmRes.data;
                  setSubmitting(false);
                  if (confirmRes.status >= 400) {
                    setReceiveError(confirmData.error || "Failed to record received quantity");
                    return;
                  }
                  
                  setMessage("Delivery with extra quantity recorded successfully");
                  // Add to our local delivery history (in a real app, we'd refetch)
                  setDeliveryHistory([...deliveryHistory, {
                    date: new Date().toISOString(),
                    quantity: extraQuantityData.pendingSubmission?.qtyRec || 0,
                    notes: extraQuantityData.pendingSubmission?.deliveryNote || "Standard delivery"
                  }]);
                  
                  setDeliveryNote("");
                  setQuantityReceived("");
                  setFullyDelivered(false);
                  setNextDeliveryDate("");
                  fetchOrder();
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Confirm Extra Quantity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between print:hidden">
        <button 
          onClick={() => router.back()} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Orders
        </button>
        
        {order.requisition_id && (
          <button 
            onClick={() => router.push(`/requisitions/${order.requisition_id}`)}
            className="text-blue-600 hover:text-blue-800"
          >
            View Original Requisition →
          </button>
        )}
      </div>
    </div>
  );
}
