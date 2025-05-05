"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "../Common/Modal";
import { FiAlertCircle, FiHelpCircle, FiShoppingBag, FiClipboard } from "react-icons/fi";
import garageApi from "@/services/api";

interface Requisition {
  requisition_id: number | string;
  item_id: number | string;
  item_name: string;
  quantity_requested: number;
}

interface Item {
  item_id: number | string;
  item_name: string;
  item_type: string;
}

interface Vendor {
  vendor_id: number | string;
  vendor_name: string;
}

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewOrderModal({
  isOpen,
  onClose,
  onSuccess
}: NewOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderType, setOrderType] = useState("fromRequisition"); // "fromRequisition" or "direct"
  const [formChanged, setFormChanged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  
  // Reference to the first input/select element for auto-focus
  const firstInputRef = useRef<HTMLSelectElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    requisition_id: "",
    item_id: "",
    vendor_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    unit_cost: "",
    quantity_ordered: ""
  });

  // Data for select lists
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState({
    requisitions: false,
    items: false,
    vendors: false
  });

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      
      // Set focus on the first selectable field
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
      
      loadVendors();

      if (orderType === "fromRequisition") {
        loadRequisitions();
      } else {
        loadItems();
      }
      
      setFormChanged(false);
      setFieldErrors({});
    }
  }, [isOpen, orderType]);

  const resetForm = () => {
    setFormData({
      requisition_id: "",
      item_id: "",
      vendor_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      unit_cost: "",
      quantity_ordered: ""
    });
    setError("");
    setFieldErrors({});
  };

  // Validate a single field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "requisition_id":
        return orderType === "fromRequisition" && !value ? "Requisition is required" : "";
      case "item_id":
        return orderType === "direct" && !value ? "Item is required" : "";
      case "vendor_id":
        return !value ? "Vendor is required" : "";
      case "order_date":
        return !value ? "Order date is required" : "";
      case "unit_cost":
        if (!value) return "Unit cost is required";
        return isNaN(parseFloat(value)) || parseFloat(value) <= 0 ? "Enter a valid positive number" : "";
      case "quantity_ordered":
        if (!value) return "Quantity is required";
        return isNaN(parseInt(value)) || parseInt(value) <= 0 ? "Enter a valid positive number" : "";
      default:
        return "";
    }
  };

  // Format currency input
  const formatCurrency = (value: string): string => {
    if (!value) return value;
    
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Ensure proper decimal format
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1];
    }
    
    return numericValue;
  };

  const loadRequisitions = async () => {
    try {
      setIsLoading(prev => ({ ...prev, requisitions: true }));
      // Updated to include is_handled=0 filter
      const res = await garageApi.get("/purchase_requisitions?status=Pending&is_handled=0");
      if (!res.data) throw new Error("Failed to load requisitions");
      setRequisitions(res.data.requisitions || []);
    } catch (err) {
      console.error("Error loading requisitions:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, requisitions: false }));
    }
  };

  const loadItems = async () => {
    try {
      setIsLoading(prev => ({ ...prev, items: true }));
      const res = await garageApi.get("/items");
      if (!res.data) throw new Error("Failed to load items");
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Error loading items:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, items: false }));
    }
  };

  const loadVendors = async () => {
    try {
      setIsLoading(prev => ({ ...prev, vendors: true }));
      const res = await garageApi.get("/vendors");
      if (!res.data) throw new Error("Failed to load vendors");
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error("Error loading vendors:", err);
    } finally {
      setIsLoading(prev => ({ ...prev, vendors: false }));
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format currency for unit_cost
    if (name === "unit_cost") {
      formattedValue = formatCurrency(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    setFormChanged(true);
    
    // Validate the field and update errors
    const error = validateField(name, formattedValue);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    // If requisition changes, update quantity automatically
    if (name === "requisition_id" && value) {
      const selectedReq = requisitions.find(r => r.requisition_id == value);
      if (selectedReq) {
        const quantityValue = selectedReq.quantity_requested.toString();
        const itemValue = selectedReq.item_id.toString();
        
        setFormData(prev => ({ 
          ...prev, 
          quantity_ordered: quantityValue || "",
          item_id: itemValue || ""
        }));
        
        // Validate the updated fields
        setFieldErrors(prev => ({
          ...prev,
          quantity_ordered: validateField("quantity_ordered", quantityValue)
        }));
      }
    }
  };

  // Toggle between order types
  const handleOrderTypeChange = (type: string) => {
    if (formChanged && !window.confirm("Changing order type will reset the form. Continue?")) {
      return;
    }
    
    setOrderType(type);
    resetForm();
    setFormChanged(false);
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

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit form with Ctrl+Enter
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  };

  // Confirm before closing if form has unsaved changes
  const handleCloseRequest = () => {
    if (!formChanged || window.confirm("You have unsaved changes. Are you sure you want to close this form?")) {
      resetForm();
      onClose();
    }
  };

  // Form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors: FormErrors = {};
    
    // Only validate fields relevant to the current order type
    if (orderType === "fromRequisition") {
      errors.requisition_id = validateField("requisition_id", formData.requisition_id);
    } else {
      errors.item_id = validateField("item_id", formData.item_id);
    }
    
    // Validate common fields
    errors.vendor_id = validateField("vendor_id", formData.vendor_id);
    errors.order_date = validateField("order_date", formData.order_date);
    errors.unit_cost = validateField("unit_cost", formData.unit_cost);
    errors.quantity_ordered = validateField("quantity_ordered", formData.quantity_ordered);
    
    // Filter out empty error messages
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== "")
    );
    
    // If there are validation errors, show them and stop submission
    if (Object.keys(filteredErrors).length > 0) {
      setFieldErrors(filteredErrors);
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      let endpoint = "";
      let payload: any = { ...formData };

      // Convert numeric fields
      payload.unit_cost = parseFloat(payload.unit_cost);
      payload.quantity_ordered = parseInt(payload.quantity_ordered);
      
      // Different endpoints and payloads based on order type
      if (orderType === "direct") {
        endpoint = "/purchase_orders/manual";
        
        // For direct orders, set requisition_id to 0 instead of NULL
        // This avoids the database constraint issue
        payload = {
          item_id: payload.item_id,
          vendor_id: payload.vendor_id,
          order_date: payload.order_date,
          expected_delivery_date: payload.expected_delivery_date || null,
          unit_cost: payload.unit_cost,
          quantity_ordered: payload.quantity_ordered,
          // Adding a dummy requisition_id value if needed by the database
          requisition_id: 0  
        };
      } else {
        endpoint = "/purchase_orders/create";
        // For requisition-based orders, we don't need item_id
        delete payload.item_id;
      }

      console.log("Sending payload:", payload);

      const response = await garageApi.post(endpoint, payload);

      if (!response.data) {
        throw new Error("Failed to create order");
      }

      // Success
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to create order";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total cost
  const totalCost = 
    formData.unit_cost && formData.quantity_ordered 
      ? parseFloat(formData.unit_cost) * parseInt(formData.quantity_ordered) 
      : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleCloseRequest} title="Create Purchase Order">
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded flex items-center">
        <FiAlertCircle className="mr-2" /> {error}
      </div>}
      
      {/* Order type tabs - improved with icons */}
      <div className="flex border-b mb-4">
        <button
          type="button"
          className={`py-2 px-4 flex items-center ${
            orderType === "fromRequisition" 
              ? "border-b-2 border-blue-500 text-blue-600 font-medium" 
              : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
          }`}
          onClick={() => handleOrderTypeChange("fromRequisition")}
        >
          <FiClipboard className="mr-2" /> From Requisition
        </button>
        <button
          type="button"
          className={`py-2 px-4 flex items-center ${
            orderType === "direct" 
              ? "border-b-2 border-blue-500 text-blue-600 font-medium" 
              : "text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300"
          }`}
          onClick={() => handleOrderTypeChange("direct")}
        >
          <FiShoppingBag className="mr-2" /> Direct Order
        </button>
      </div>
      
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Requisition or Item selection */}
          {orderType === "fromRequisition" ? (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Requisition <span className="text-red-500">*</span>
                <Tooltip content="Choose a pending purchase requisition to fulfill" />
              </label>
              <select
                ref={firstInputRef}
                name="requisition_id"
                value={formData.requisition_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${fieldErrors.requisition_id ? 'border-red-500' : ''}`}
                required
                disabled={isLoading.requisitions}
              >
                <option value="">Select a Pending Requisition</option>
                {requisitions.map(req => (
                  <option key={req.requisition_id} value={req.requisition_id}>
                    {req.item_name} - Qty: {req.quantity_requested}
                  </option>
                ))}
              </select>
              {isLoading.requisitions && <div className="text-xs text-gray-500 mt-1">Loading requisitions...</div>}
              {fieldErrors.requisition_id && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {fieldErrors.requisition_id}
                </p>
              )}
            </div>
          ) : (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Item <span className="text-red-500">*</span>
                <Tooltip content="Choose an inventory item to order directly" />
              </label>
              <select
                ref={firstInputRef}
                name="item_id"
                value={formData.item_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${fieldErrors.item_id ? 'border-red-500' : ''}`}
                required
                disabled={isLoading.items}
              >
                <option value="">Select an Item</option>
                {items.map(item => (
                  <option key={item.item_id} value={item.item_id}>
                    {item.item_name} - {item.item_type}
                  </option>
                ))}
              </select>
              {isLoading.items && <div className="text-xs text-gray-500 mt-1">Loading items...</div>}
              {fieldErrors.item_id && (
                <p className="mt-1 text-xs text-red-500 flex items-center">
                  <FiAlertCircle className="mr-1" /> {fieldErrors.item_id}
                </p>
              )}
            </div>
          )}

          {/* Vendor */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Vendor <span className="text-red-500">*</span>
              <Tooltip content="Supplier from whom you'll purchase the item" />
            </label>
            <select
              name="vendor_id"
              value={formData.vendor_id}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.vendor_id ? 'border-red-500' : ''}`}
              required
              disabled={isLoading.vendors}
            >
              <option value="">Select a Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.vendor_name}{vendor.phone ? ` - ${vendor.phone}` : ''}
                </option>
              ))}
            </select>
            {isLoading.vendors && <div className="text-xs text-gray-500 mt-1">Loading vendors...</div>}
            {fieldErrors.vendor_id && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.vendor_id}
              </p>
            )}
          </div>

          {/* Order Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="order_date"
              value={formData.order_date}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.order_date ? 'border-red-500' : ''}`}
              required
            />
            {fieldErrors.order_date && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.order_date}
              </p>
            )}
          </div>

          {/* Expected Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Expected Delivery Date
              <Tooltip content="When you expect the order to arrive" />
            </label>
            <input
              type="date"
              name="expected_delivery_date"
              value={formData.expected_delivery_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              min={formData.order_date}
            />
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
              <input
                type="text"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleChange}
                min="0"
                className={`w-full pl-8 px-3 py-2 border rounded-md ${fieldErrors.unit_cost ? 'border-red-500' : ''}`}
                placeholder="0.00"
                required
              />
            </div>
            {fieldErrors.unit_cost && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.unit_cost}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity_ordered"
              value={formData.quantity_ordered}
              onChange={handleChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.quantity_ordered ? 'border-red-500' : ''}`}
              placeholder="1"
              required
            />
            {fieldErrors.quantity_ordered && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.quantity_ordered}
              </p>
            )}
          </div>
          
          {/* Total Cost Summary */}
          <div className="col-span-2 mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Cost:</span>
              <span className="text-lg font-bold">
                ${isNaN(totalCost) ? '0.00' : totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between space-x-2 mt-6">
          <div className="text-xs text-gray-500 italic self-center">
            <span className="text-red-500">*</span> Required fields &nbsp;&nbsp; Tip: Press Ctrl+Enter to save
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
                  Creating...
                </>
              ) : "Create Order"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
