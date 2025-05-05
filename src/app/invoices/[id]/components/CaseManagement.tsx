import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import api from "@/services/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CaseReason {
  reason_id: number;
  reason_name: string;
  description?: string;
  is_active: boolean;
}

interface Case {
  case_id: number;
  case_number: string;
  invoice_id: number;
  reason_id: number;
  reason_name?: string;
  custom_reason?: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed' | 'approved' | 'rejected';
  created_by: number;
  created_by_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  deadline_date: string;
  created_at: string;
  updated_at: string;
  is_late: boolean;
}

interface CaseManagementProps {
  invoiceId: number;
  isLocked: boolean;
  onCaseCreated: () => void;
  onEditApproved?: (isApproved: boolean) => void;
}

function formatDateString(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("en-US", {
    dateStyle: "medium", // e.g. "Mar 9, 2025"
    timeStyle: "short",  // e.g. "8:00 PM"
  });
}

export default function CaseManagement({ invoiceId, isLocked, onCaseCreated, onEditApproved }: CaseManagementProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [caseReasons, setCaseReasons] = useState<CaseReason[]>([]);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseData, setCaseData] = useState({
    reason_id: "",
    custom_reason: "",
    description: "",
    images: [] as File[]
  });
  const [caseSaving, setCaseSaving] = useState(false);
  const [caseMessage, setCaseMessage] = useState("");
  const [invoiceInfo, setInvoiceInfo] = useState<any>(null);
  const [hasApprovedCase, setHasApprovedCase] = useState(false);

  // Fetch cases for this invoice
  useEffect(() => {
    const fetchCases = async () => {
      if (!invoiceId) {
        console.log("No invoiceId provided, skipping cases fetch");
        return;
      }

      try {
        console.log("Fetching cases for invoice ID:", invoiceId);
        
        // Use centralized API with proper error handling
        const res = await api.get(`/invoice-cases`, {
          params: { invoice_id: invoiceId },
          validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
          }
        });
        
        if (res.status === 404) {
          console.log("No cases found for this invoice");
          setCases([]);
          return;
        }
        
        if (res.status !== 200) {
          console.error("Error response from API:", res.status, res.statusText);
          setCases([]);
          return;
        }
        
        if (!res.data || !res.data.cases) {
          console.error("Invalid API response format:", res.data);
          setCases([]);
          return;
        }

        console.log("Cases data received:", res.data.cases);
        setCases(res.data.cases);
        
        // Check if there's any approved case
        const approvedCase = res.data.cases.find(
          (c: Case) => c.status === 'approved'
        );
        
        setHasApprovedCase(!!approvedCase);
        
        // Notify parent component about any approved case
        if (onEditApproved) {
          onEditApproved(!!approvedCase);
        }
      } catch (err) {
        console.error("Error fetching cases for this invoice:", err);
        setCases([]);
      }
    };
    
    fetchCases();
  }, [invoiceId, onEditApproved]);

  // Fetch invoice details for the modal
  useEffect(() => {
    const fetchInvoiceInfo = async () => {
      if (showCaseModal) {
        try {
          const res = await api.get(`/invoices/${invoiceId}`);
          setInvoiceInfo(res.data);
        } catch (err) {
          console.error("Failed to fetch invoice info:", err);
        }
      }
    };
    
    fetchInvoiceInfo();
  }, [showCaseModal, invoiceId]);

  // Fetch case reasons when modal is shown
  useEffect(() => {
    const fetchCaseReasons = async () => {
      try {
        const res = await api.get("/case-reasons/active");
        console.log("Case reasons fetched:", res.data);
        setCaseReasons(res.data);
      } catch (err) {
        console.error("Failed to fetch case reasons:", err);
      }
    };
    
    if (showCaseModal) {
      fetchCaseReasons();
    }
  }, [showCaseModal]);

  // Handle case form changes
  const handleCaseChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setCaseData({
      ...caseData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle case image uploads
  const handleCaseImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setCaseData({
        ...caseData,
        images: [...caseData.images, ...newImages]
      });
    }
  };

  // Remove a case image before submitting
  const handleRemoveCaseImage = (index: number) => {
    const updatedImages = [...caseData.images];
    updatedImages.splice(index, 1);
    setCaseData({
      ...caseData,
      images: updatedImages
    });
  };

  // Submit case creation
  const handleCaseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!caseData.reason_id && caseData.reason_id !== 'other') {
      alert("Please select a reason for the case.");
      return;
    }
    
    if (caseData.reason_id === 'other' && !caseData.custom_reason) {
      alert("Please provide a custom reason for your case.");
      return;
    }
    
    if (!caseData.description) {
      alert("Please provide a description for the case.");
      return;
    }
    
    if (caseData.images.length === 0) {
      alert("Please upload at least one image for this case.");
      return;
    }
    
    setCaseSaving(true);
    setCaseMessage("");
    
    try {
      // 1) Upload images first
      const imageUrls: string[] = [];
      
      for (const image of caseData.images) {
        const formData = new FormData();
        formData.append("image", image);
        
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
        throw new Error("Failed to upload images");
      }
      
      // 2) Create the case with uploaded image URLs
      const payload = {
        invoice_id: invoiceId,
        reason_id: caseData.reason_id === 'other' ? null : parseInt(caseData.reason_id, 10),
        custom_reason: caseData.reason_id === 'other' ? caseData.custom_reason : undefined,
        description: caseData.description,
        created_by: 1, // TODO: Use actual user ID from auth
        images: imageUrls
      };
      
      console.log("Submitting case with payload:", payload);
      
      await api.post(
        "/invoice-cases",
        payload
      );
      
      // 3) Success - reset form and refresh data
      setCaseMessage("Case created successfully. Waiting for admin review.");
      setCaseData({
        reason_id: "",
        custom_reason: "",
        description: "",
        images: []
      });
      
      // 4) Refresh cases list
      const casesRes = await api.get(`/invoice-cases`, {
        params: { invoice_id: invoiceId }
      });
      
      if (casesRes.data && casesRes.data.cases) {
        setCases(casesRes.data.cases);
        
        // Check for approved cases
        const approvedCase = casesRes.data.cases.find(
          (c: Case) => c.status === 'approved'
        );
        setHasApprovedCase(!!approvedCase);
      }
      
      // 5) Call onCaseCreated to notify parent component
      onCaseCreated();
      
      // 6) Close modal after short delay
      setTimeout(() => {
        setShowCaseModal(false);
      }, 2000);
      
    } catch (err: any) {
      setCaseMessage(`Error: ${err.message || "Failed to create case"}`);
    } finally {
      setCaseSaving(false);
    }
  };

  return (
    <>
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Case Management</h2>
          <Button 
            onClick={() => setShowCaseModal(true)} 
            className="bg-black text-white"
          >
            Open New Case
          </Button>
        </div>

        {/* Message shown when invoice is locked */}
        {isLocked && !hasApprovedCase && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">This invoice is locked for editing</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>To make changes to this invoice, open a new case explaining what changes you need. Once approved by an administrator, you will be able to edit the invoice.</p>
                  <Button 
                    onClick={() => setShowCaseModal(true)} 
                    variant="outline"
                    className="mt-3 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                  >
                    Open New Case
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message shown when there is an approved case */}
        {isLocked && hasApprovedCase && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Case approved!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>You have an approved case for this invoice. You can now edit the invoice details including payment information.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cases list */}
        {cases.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CASE #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REASON</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CREATED</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cases.map((caseItem) => (
                <tr key={caseItem.case_id} className={caseItem.status === 'approved' ? 'bg-green-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {caseItem.case_number}
                    {caseItem.status === 'approved' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        APPROVED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {caseItem.reason_name || caseItem.custom_reason || "Other reason"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      caseItem.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      caseItem.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      caseItem.status === 'approved' ? 'bg-green-100 text-green-800' :
                      caseItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {caseItem.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateString(caseItem.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Link href={`/cases/${caseItem.case_id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No cases have been created for this invoice.</p>
        )}
      </Card>

      {/* Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Open New Case</h2>
                <button 
                  onClick={() => setShowCaseModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {caseMessage && (
                <div className={`mb-4 p-3 rounded ${caseMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {caseMessage}
                </div>
              )}

              {isLocked && (
                <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded">
                  <p className="text-sm">
                    <strong>Note:</strong> This invoice is currently locked for editing. 
                    Opening a case will allow you to request changes to this invoice.
                    Once your case is approved, you will be able to edit the invoice.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleCaseSubmit}>
                {/* Reason Selection */}
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Case Reason <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="reason_id"
                    value={caseData.reason_id}
                    onChange={handleCaseChange}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select a reason --</option>
                    {caseReasons.map(reason => (
                      <option key={reason.reason_id} value={reason.reason_id}>
                        {reason.reason_name}
                      </option>
                    ))}
                    <option value="other">Other (specify)</option>
                  </select>
                </div>
                
                {/* Custom reason field if "Other" is selected */}
                {caseData.reason_id === 'other' && (
                  <div className="mb-4">
                    <label className="block font-semibold mb-2">
                      Custom Reason <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="custom_reason"
                      value={caseData.custom_reason}
                      onChange={handleCaseChange}
                      className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Specify the case reason"
                      required
                    />
                  </div>
                )}
                
                {/* Description */}
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={caseData.description}
                    onChange={handleCaseChange}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe the issue or what changes you need to make to this invoice"
                    required
                  ></textarea>
                </div>
                
                {/* Image Upload */}
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Images <span className="text-red-600">*</span>
                    <span className="text-sm text-gray-500 ml-2">(At least one image is required)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleCaseImageChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 hover:file:bg-gray-300 file:cursor-pointer mb-2"
                  />
                  
                  {/* Preview selected images */}
                  {caseData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {caseData.images.map((img, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={URL.createObjectURL(img)} 
                            alt={`Case image ${index + 1}`} 
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCaseImage(index)}
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
                    disabled={caseSaving}
                    className={caseSaving ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    {caseSaving ? "Creating Case..." : "Create Case"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}