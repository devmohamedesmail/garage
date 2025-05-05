"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "../Common/Modal";
import { ChangeEvent } from "react";
import { FiAlertCircle, FiHelpCircle } from "react-icons/fi";
import garageApi from "@/services/api";

interface NewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewVendorModal({
  isOpen,
  onClose,
  onSuccess
}: NewVendorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formChanged, setFormChanged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  
  // Reference to the first input for auto-focus
  const firstInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    vendor_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    comment: ""
  });

  // Clear form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      
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

  const resetForm = () => {
    setFormData({
      vendor_name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      comment: ""
    });
    setError("");
    setFieldErrors({});
  };

  // Validate a single field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "vendor_name":
        return value.trim() === "" ? "Vendor name is required" : "";
      case "email":
        if (!value) return "";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Invalid email format" : "";
      case "phone":
        if (!value) return "";
        const phoneRegex = /^[0-9+\-() ]+$/;
        return !phoneRegex.test(value) ? "Invalid phone number format" : "";
      default:
        return "";
    }
  };

  // Handle input changes with proper typing
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormChanged(true);
    
    // Validate field and update errors
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
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

  // Confirm before closing if form has unsaved changes
  const handleCloseRequest = () => {
    if (!formChanged || window.confirm("You have unsaved changes. Are you sure you want to close this form?")) {
      resetForm();
      onClose();
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

  // Form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      // Vendor name is required
      if (!formData.vendor_name.trim()) {
        throw new Error("Vendor name is required");
      }

      const response = await garageApi.post("/vendors", formData);

      if (!response.data) {
        throw new Error("Failed to create vendor");
      }

      // Success
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to create vendor";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseRequest} title="Add New Vendor">
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Name */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.vendor_name ? 'border-red-500' : ''}`}
              required
            />
            {fieldErrors.vendor_name && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.vendor_name}
              </p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Contact Person
              <Tooltip content="Main point of contact at this vendor" />
            </label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="John Doe"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.phone ? 'border-red-500' : ''}`}
              placeholder="+1 (555) 123-4567"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${fieldErrors.email ? 'border-red-500' : ''}`}
              placeholder="contact@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500 flex items-center">
                <FiAlertCircle className="mr-1" /> {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              Address
              <Tooltip content="Physical or mailing address for this vendor" />
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="123 Business St, City, State, ZIP"
            />
          </div>

          {/* Comment */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Additional notes about this vendor"
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
              ) : "Save Vendor"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
