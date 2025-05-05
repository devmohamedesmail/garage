"use client";

import { useState, useEffect } from "react";
import Modal from "../Common/Modal";
import garageApi from "@/services/api";

interface Requisition {
  requisition_id: number | string;
  item_id: number | string;
  item_name: string;
  quantity_requested: number;
  status: string;
}

interface Vendor {
  vendor_id: number | string;
  vendor_name: string;
  phone?: string;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRequisition: Requisition | null;
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
  selectedRequisition
}: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    requisition_id: "",
    vendor_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    unit_cost: "",
    quantity_ordered: ""
  });

  // Load vendors when modal opens & reset form
  useEffect(() => {
    if (isOpen && selectedRequisition) {
      resetForm();
      loadVendors();
    }
  }, [isOpen, selectedRequisition]);

  // Update form data when selected requisition changes
  useEffect(() => {
    if (selectedRequisition) {
      setFormData(prev => ({
        ...prev,
        requisition_id: String(selectedRequisition.requisition_id),
        quantity_ordered: String(selectedRequisition.quantity_requested)
      }));
    }
  }, [selectedRequisition]);

  const resetForm = () => {
    setFormData({
      requisition_id: selectedRequisition ? String(selectedRequisition.requisition_id) : "",
      vendor_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      unit_cost: "",
      quantity_ordered: selectedRequisition ? String(selectedRequisition.quantity_requested) : ""
    });
    setSelectedVendor(null);
    setError("");
  };

  const loadVendors = async () => {
    try {
      const res = await garageApi.get("/vendors");
      if (!res.data) throw new Error("Failed to load vendors");
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error("Error loading vendors:", err);
      setError("Failed to load vendors. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update selected vendor when vendor_id changes
    if (name === "vendor_id" && value) {
      const vendor = vendors.find(v => v.vendor_id.toString() === value);
      setSelectedVendor(vendor || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Basic validation
      if (!formData.vendor_id) {
        throw new Error("Please select a vendor");
      }
      
      if (!formData.unit_cost || parseFloat(formData.unit_cost) <= 0) {
        throw new Error("Please enter a valid unit cost");
      }

      if (!formData.quantity_ordered || parseInt(formData.quantity_ordered) <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      // Submit the order
      const response = await garageApi.post("/purchase_orders/create", formData);

      if (!response.data) {
        throw new Error("Failed to create purchase order");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRequisition) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Purchase Order for ${selectedRequisition.item_name}`} size="md">
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Item Details & Selected Vendor - Display Only */}
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-500">Item</div>
            <div className="font-medium">{selectedRequisition.item_name}</div>
            
            <div className="text-sm text-gray-500 mt-2">Requested Quantity</div>
            <div className="font-medium">{selectedRequisition.quantity_requested}</div>
            
            {selectedVendor && (
              <>
                <div className="text-sm text-gray-500 mt-2">Selected Vendor</div>
                <div className="font-medium">{selectedVendor.vendor_name}</div>
                {selectedVendor.phone && (
                  <div className="text-sm font-medium text-blue-600 mt-1">{selectedVendor.phone}</div>
                )}
              </>
            )}
          </div>
          
          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Vendor *
            </label>
            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          {/* Order Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Date *
            </label>
            <input
              type="date"
              name="order_date"
              value={formData.order_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              name="expected_delivery_date"
              value={formData.expected_delivery_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost *
            </label>
            <input
              type="number"
              name="unit_cost"
              value={formData.unit_cost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              name="quantity_ordered"
              value={formData.quantity_ordered}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
