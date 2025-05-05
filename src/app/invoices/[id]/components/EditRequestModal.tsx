import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EditRequestModalProps {
  invoiceId: number;
  onClose: () => void;
  onCaseCreated: () => void;
}

export default function EditRequestModal({ invoiceId, onClose, onCaseCreated }: EditRequestModalProps) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [invoiceInfo, setInvoiceInfo] = useState<any>(null);
  const [editReasonId, setEditReasonId] = useState<number | null>(null);

  // Fetch invoice details for the modal
  useEffect(() => {
    const fetchInvoiceInfo = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}`);
        setInvoiceInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch invoice info:", err);
      }
    };
    
    fetchInvoiceInfo();
  }, [invoiceId]);

  // Fetch case reasons to find the edit request reason ID
  useEffect(() => {
    const fetchCaseReasons = async () => {
      try {
        const res = await api.get("/case-reasons/active");
        if (res.data) {
          // Find the edit request reason ID
          const editReason = res.data.find((reason: any) => reason.reason_name === 'Edit Invoice Request');
          if (editReason) {
            setEditReasonId(editReason.reason_id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch case reasons:", err);
      }
    };
    
    fetchCaseReasons();
  }, []);

  // Handle file uploads
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setImages([...images, ...newImages]);
    }
  };

  // Remove a selected image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  // Submit the edit request
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!editReasonId) {
      setMessage("Error: Edit Request reason not found in the system");
      return;
    }
    
    if (!description) {
      alert("Please provide a description of why you need to edit this invoice.");
      return;
    }
    
    if (images.length === 0) {
      alert("Please upload at least one supporting document or image.");
      return;
    }
    
    setSaving(true);
    setMessage("");
    
    try {
      // 1) Upload images first
      const imageUrls: string[] = [];
      
      for (const image of images) {
        const formData = new FormData();
        formData.append("image", image);
        
        // Use FormData with the api service
        const uploadRes = await api.post(
          `/invoices/${invoiceId}/upload-image`, 
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        
        if (uploadRes.data && uploadRes.data.imageUrl) {
          imageUrls.push(uploadRes.data.imageUrl);
        }
      }
      
      if (imageUrls.length === 0) {
        throw new Error("Failed to upload supporting documents");
      }
      
      // 2) Create the edit request case
      const payload = {
        invoice_id: invoiceId,
        reason_id: editReasonId,
        description: description,
        created_by: 1, // TODO: Use actual user ID from auth
        images: imageUrls
      };
      
      await api.post(
        "/invoice-cases",
        payload
      );
      
      // 3) Success handling
      setMessage("Edit request submitted successfully. The invoice will be unlocked once an admin approves your request.");
      
      // 4) Call onCaseCreated to notify parent after short delay
      setTimeout(() => {
        onCaseCreated();
      }, 2000);
      
    } catch (err: any) {
      setMessage(`Error: ${err.message || "Failed to submit edit request"}`);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Request Edit Permission</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {message && (
            <div className={`mb-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {message}
            </div>
          )}
          
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded">
            <p className="text-sm">
              <strong>Important:</strong> To edit this locked invoice, you need admin approval. 
              Please provide a clear explanation of why you need to edit this invoice and include any supporting documents.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Description */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">
                Reason for Editing <span className="text-red-600">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Explain why you need to edit this invoice and what changes you need to make"
                required
              ></textarea>
            </div>
            
            {/* Supporting Documents */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">
                Supporting Documents <span className="text-red-600">*</span>
                <span className="text-sm text-gray-500 ml-2">(At least one document is required)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 hover:file:bg-gray-300 file:cursor-pointer mb-2"
              />
              
              {/* Preview selected images */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt={`Supporting document ${index + 1}`} 
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Invoice info */}
            {invoiceInfo && (
              <div className="mb-6 bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-medium mb-2">Invoice Information</h3>
                <p className="text-sm text-gray-600">Invoice #: {invoiceInfo.invoice_number}</p>
                <p className="text-sm text-gray-600">Customer: {invoiceInfo.customer_name}</p>
                <p className="text-sm text-gray-600">Vehicle: {invoiceInfo.vehicle_info}</p>
              </div>
            )}
            
            {/* Submit button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className={saving ? "opacity-50 cursor-not-allowed" : ""}
              >
                {saving ? "Submitting Request..." : "Submit Edit Request"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}