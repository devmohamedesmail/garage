"use client";

import React, { useState, useEffect, useRef } from "react";
import Modal from "../Common/Modal";
import { FiAlertCircle, FiHelpCircle } from "react-icons/fi";
import garageApi from "@/services/api";

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: any) => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewItemModal({
  isOpen,
  onClose,
  onSuccess
}: NewItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendors, setVendors] = useState([]);
  const [formChanged, setFormChanged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  
  // Reference to the first input for auto-focus
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    item_name: "",
    item_type: "",
    description: "",
    cost_price: "",
    quantity_on_hand: "",
    reorder_level: "",
    reorder_quantity: "",
    vendor_id: ""
  });

  // Load vendors for the dropdown
  useEffect(() => {
    if (isOpen) {
      // Clear the form when opening
      setFormData({
        item_name: "",
        item_type: "",
        description: "",
        cost_price: "",
        quantity_on_hand: "",
        reorder_level: "",
        reorder_quantity: "",
        vendor_id: ""
      });
      
      // Fetch vendors
      const fetchVendors = async () => {
        try {
          const response = await garageApi.get("/vendors");
          if (!response.data) throw new Error("Failed to fetch vendors");
          setVendors(response.data.vendors || []);
        } catch (err) {
          console.error("Error fetching vendors:", err);
        }
      };
      
      fetchVendors();

      // Set focus on the first input field
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
      
      setFormChanged(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  // Validate a single field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "item_name":
        return value.trim() === "" ? "Item name is required" : "";
      case "item_type":
        return value === "" ? "Item type is required" : "";
      case "cost_price":
        return value && isNaN(parseFloat(value)) ? "Must be a valid number" : "";
      case "quantity_on_hand":
      case "reorder_level":
      case "reorder_quantity":
        return value && isNaN(parseInt(value)) ? "Must be a valid number" : "";
      default:
        return "";
    }
  };

  // Format currency input
  const formatCurrency = (value: string): string => {
    if (!value) return value;
    
    // Remove non-numeric characters
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure proper decimal format
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1];
    }
    
    return numericValue;
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format currency for cost_price
    if (name === "cost_price") {
      formattedValue = formatCurrency(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    setFormChanged(true);
    
    // Validate field and update errors
    const error = validateField(name, formattedValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Handle form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors: FormErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value.toString());
      if (error) errors[key] = error;
    });
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Convert numeric fields
      const payload = {
        ...formData,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        quantity_on_hand: formData.quantity_on_hand ? parseInt(formData.quantity_on_hand) : 0,
        reorder_level: formData.reorder_level ? parseInt(formData.reorder_level) : 0,
        reorder_quantity: formData.reorder_quantity ? parseInt(formData.reorder_quantity) : 0,
        vendor_id: formData.vendor_id || null
      };

      // Use garageApi instead of direct fetch
      const response = await garageApi.post("/items", payload);
      
      // Get the created item data
      const createdItem = response.data;
      
      // Pass the created item to the parent component's onSuccess callback
      onSuccess(createdItem);
      
      // Close the modal
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to create item";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Confirm before closing if form has unsaved changes
  const handleCloseRequest = () => {
    if (!formChanged || window.confirm("You have unsaved changes. Are you sure you want to close this form?")) {
      onClose();
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit form with Ctrl+Enter
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  };

  // Tooltip component for field help
  const Tooltip = ({ content }: { content: string }) => (
    <div className="group relative ml-1 inline-block">
      <FiHelpCircle className="text-gray-400 hover:text-gray-600" />
      <div className="absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-800 text-white rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
        {content}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleCloseRequest} title="Add New Item">
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.item_name ? 'border-red-500' : ''}`}
              required
            />
            {fieldErrors.item_name && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.item_name}
              </p>
            )}
          </div>

          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Type <span className="text-red-500">*</span>
            </label>
            <select
              name="item_type"
              value={formData.item_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.item_type ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select Type</option>
              <option value="Part">Part</option>
              <option value="Tool">Tool</option>
              <option value="Consumable">Consumable</option>
              <option value="Other">Other</option>
            </select>
            {fieldErrors.item_type && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.item_type}
              </p>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Vendor (Optional)</option>
              {vendors.map(vendor => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.vendor_name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Cost Price
              <Tooltip content="The price paid for acquiring this item" />
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="text"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                min="0"
                className={`w-full pl-8 px-3 py-2 border rounded-md ${fieldErrors.cost_price ? 'border-red-500' : ''}`}
                placeholder="0.00"
              />
            </div>
            {fieldErrors.cost_price && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.cost_price}
              </p>
            )}
          </div>

          {/* Quantity on Hand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Quantity on Hand
              <Tooltip content="Current quantity available in inventory" />
            </label>
            <input
              type="number"
              name="quantity_on_hand"
              value={formData.quantity_on_hand}
              onChange={handleChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.quantity_on_hand ? 'border-red-500' : ''}`}
              placeholder="0"
            />
            {fieldErrors.quantity_on_hand && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.quantity_on_hand}
              </p>
            )}
          </div>

          {/* Reorder Level & Quantity - Group these related fields visually */}
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Reorder Level
                <Tooltip content="Minimum quantity before reordering is needed" />
              </label>
              <input
                type="number"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md ${fieldErrors.reorder_level ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {fieldErrors.reorder_level && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {fieldErrors.reorder_level}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Reorder Quantity
                <Tooltip content="Quantity to order when stock is low" />
              </label>
              <input
                type="number"
                name="reorder_quantity"
                value={formData.reorder_quantity}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md ${fieldErrors.reorder_quantity ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {fieldErrors.reorder_quantity && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {fieldErrors.reorder_quantity}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter item details here..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between space-x-2 mt-6">
          <div className="text-xs text-gray-500 italic self-center">
            * Required fields &nbsp;&nbsp; Tip: Press Ctrl+Enter to save
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleCloseRequest}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : "Save Item"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
