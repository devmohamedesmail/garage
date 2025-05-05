"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PdfModal from "@/components/PDFModal";
import InvoiceDetails from "./components/InvoiceDetails";
import InvoiceImages from "./components/InvoiceImages";
import WorkOrderSection from "./components/WorkOrderSection";
import CaseManagement from "./components/CaseManagement";
import PaymentHistory from "./components/PaymentHistory";
import PaymentAmountUpdate from "./components/PaymentAmountUpdate";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";

// Invoice interface
interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_name?: string;
  vehicle_info?: string;
  service_type: string;
  price: string;
  vat: string;
  car_type: string;
  ratio: string;
  images: string;
  things_to_fix: string;
  notes: string;
  special_requests: string;
  expected_delivery_date: string;
  down_payment: string;
  total_amount: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  work_order_id: number;
  locked_for_editing?: boolean;
}

// WorkOrder interface
interface WorkOrder {
  work_order_id: number;
  status: string;
  start_date: string;
  end_date: string | null;
  estimated_cost: string | null;
  final_cost?: string | null;
  notes: string;
  supervisor: string;
  is_completed: number;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const invoiceId = id ? parseInt(id as string, 10) : NaN;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceImages, setInvoiceImages] = useState<string[]>([]);
  
  // For PDF modal
  const [showPdfModal, setShowPdfModal] = useState(false);
  const pdfUrl = invoice ? `${api.defaults.baseURL}/invoices/${invoice.invoice_id}/pdf` : "";
  
  // For lock status monitoring
  const [lockStatusLoading, setLockStatusLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hasApprovedCase, setHasApprovedCase] = useState(false);

  // Function to check lock status directly from the API
  const checkLockStatus = async () => {
    if (!invoiceId) return;
    setLockStatusLoading(true);
    
    try {
      const response = await api.get(`/invoices/${invoiceId}/lock-status`);
      if (response.data && invoice) {
        setInvoice({
          ...invoice,
          locked_for_editing: response.data.locked_for_editing
        });
        setIsLocked(!!response.data.locked_for_editing);
      }
    } catch (err) {
      console.error("Failed to check invoice lock status:", err);
    } finally {
      setLockStatusLoading(false);
    }
  };
  
  // Fetch invoice details
  useEffect(() => {
    if (!invoiceId || isNaN(invoiceId)) {
      setError("Invalid invoice ID");
      setLoading(false);
      return;
    }
    
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${invoiceId}`, {
          validateStatus: function(status) {
            return status < 500; // Only reject if server error
          }
        });
        
        if (res.status === 404) {
          setError(`Invoice #${invoiceId} not found`);
          setLoading(false);
          return;
        }
        
        if (res.status !== 200) {
          setError(`Failed to load invoice: ${res.statusText}`);
          setLoading(false);
          return;
        }
        
        const inv = res.data;
        
        // Combine names if available
        if (inv.customer_first_name && inv.customer_last_name) {
          inv.customer_name = `${inv.customer_first_name} ${inv.customer_last_name}`;
        }
        
        // Combine vehicle info if not provided
        if (!inv.vehicle_info && inv.license_plate && inv.make && inv.model && inv.year) {
          inv.vehicle_info = `${inv.license_plate} - ${inv.make} ${inv.model} ${inv.year}`;
        }
        
        setInvoice(inv);
        
        // Update invoiceImages state (assuming comma-separated string)
        if (inv.images && inv.images.trim().length > 0) {
          const imgs = inv.images.split(",").map((img: string) => img.trim());
          setInvoiceImages(imgs);
        } else {
          setInvoiceImages([]);
        }
        
        setLoading(false);
      } catch (err: any) {
        const errorMessage = err.response?.status === 404 
          ? `Invoice #${invoiceId} not found`
          : "Failed to fetch invoice.";
          
        setError(errorMessage);
        setLoading(false);
        
        // Show toast notification for better user experience
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };
    fetchInvoice();
  }, [invoiceId, toast]);

  // If invoice includes a work_order_id, fetch its details
  useEffect(() => {
    const fetchWorkOrder = async () => {
      if (invoice && invoice.work_order_id) {
        try {
          const res = await api.get(`/work_orders/${invoice.work_order_id}`);
          setWorkOrder(res.data);
        } catch (err) {
          console.error("Failed to fetch work order.", err);
        }
      }
    };
    fetchWorkOrder();
  }, [invoice]);

  // Fetch lock status along with invoice data
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) return;
      
      try {
        // Use api instead of garageApi
        const response = await api.get(`/invoices/${id}`, {
          validateStatus: function (status) {
            return status < 500; // Only reject if server error
          }
        });
        
        if (response.status === 404) {
          console.error(`Invoice #${id} not found`);
          return;
        }
        
        if (response.status !== 200) {
          console.error('Error fetching invoice:', response.status, response.statusText);
          return;
        }
        
        setInvoice(response.data);
        
        // Check if the invoice is locked
        if (response.data.locked_for_editing !== undefined) {
          setIsLocked(!!response.data.locked_for_editing);
        }
        
        // Check for active cases
        try {
          const casesResponse = await api.get(`/invoice-cases`, {
            params: { invoice_id: id },
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          if (casesResponse.status === 200 && casesResponse.data && casesResponse.data.cases) {
            // Find any approved case
            const approvedCase = casesResponse.data.cases.find(
              (c: any) => c.status === 'approved' || c.status === 'APPROVED'
            );
            
            console.log("Case status check:", { 
              hasApprovedCase: !!approvedCase,
              cases: casesResponse.data.cases 
            });
            
            setHasApprovedCase(!!approvedCase);
          }
        } catch (caseErr) {
          console.error('Error fetching invoice cases:', caseErr);
        }
        
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      }
    };

    fetchInvoiceDetails();
  }, [id]);
  
  // Handle invoice image updates
  const handleImagesUpdated = (newImages: string[]) => {
    setInvoiceImages(newImages);
  };

  // Handle work order creation
  const handleWorkOrderCreated = (workOrderId: number) => {
    setInvoice((prevInvoice) =>
      prevInvoice ? { ...prevInvoice, work_order_id: workOrderId } : null
    );
  };

  // Handle case creation
  const handleCaseCreated = async () => {
    // Refresh the invoice with updated lock status
    await checkLockStatus();
  };

  // Handle payment addition/update
  const handlePaymentUpdated = async () => {
    // Refresh invoice to get updated payment status
    try {
      const invoiceRes = await api.get(`/invoices/${invoiceId}`);
      setInvoice(invoiceRes.data);
    } catch (err) {
      console.error("Failed to refresh invoice after payment update:", err);
    }
  };

  // Handle invoice update
  const handleInvoiceUpdated = (updatedInvoice: Invoice) => {
    setInvoice(updatedInvoice);
  };

  const handlePrintPDF = () => {
    if (invoice && invoice.invoice_id) {
      setShowPdfModal(true);
    }
  };

  // Handle edit approval status from CaseManagement component
  const handleCaseApproved = (isApproved: boolean) => {
    setHasApprovedCase(isApproved);
    
    // If a case was just approved, refresh the lock status
    if (isApproved) {
      checkLockStatus();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg">Loading invoice...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-10">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mt-5">{error}</h1>
          <p className="text-gray-600 mt-2">We couldn't find the invoice you were looking for.</p>
          <div className="mt-6">
            <Link href="/invoices">
              <Button size="lg">
                Return to Invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (!invoice) return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-10">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mt-5">No invoice found</h1>
          <p className="text-gray-600 mt-2">The invoice data could not be loaded.</p>
          <div className="mt-6">
            <Link href="/invoices">
              <Button size="lg">
                Return to Invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/invoices">
          <Button variant="outline">Back to Invoices</Button>
        </Link>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">Invoice #{invoice?.invoice_number}</h1>
          {invoice?.locked_for_editing && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Locked
            </span>
          )}
          {!invoice?.locked_for_editing && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Unlocked
            </span>
          )}
        </div>
      </div>
  
      {/* Payment History Section - Moved higher for better visibility */}
      <PaymentHistory 
        invoiceId={invoice?.invoice_id}
        isLocked={!!invoice?.locked_for_editing}
        onPaymentAdded={handlePaymentUpdated}
      />

      {/* Invoice Details & Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Invoice Details */}
        <InvoiceDetails invoice={invoice} />
        
        {/* Invoice Images */}
        <InvoiceImages 
          invoiceId={invoice?.invoice_id} 
          images={invoiceImages} 
          onImagesUpdated={handleImagesUpdated} 
        />
      </div>
  
      {/* Work Order Section */}
      <WorkOrderSection 
        invoice={invoice} 
        workOrder={workOrder} 
        onWorkOrderCreated={handleWorkOrderCreated} 
      />
  
      {/* Case Management Section */}
      <CaseManagement 
        invoiceId={invoice?.invoice_id}
        isLocked={!!invoice?.locked_for_editing}
        onCaseCreated={handleCaseCreated}
        onEditApproved={handleCaseApproved}
      />
      
      {/* Special Payment Amount Update - Only for approved edit cases */}
      {invoice && hasApprovedCase && (
        <PaymentAmountUpdate
          invoiceId={invoice.invoice_id}
          currentAmount={invoice.total_amount}
          onPaymentUpdated={handlePaymentUpdated}
        />
      )}
      
      {/* Print Receipt */}
      <div className="p-6 bg-white rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Print Receipt</h2>
          <Button onClick={handlePrintPDF}>Print Receipt as PDF</Button>
        </div>
      </div>
      {showPdfModal && <PdfModal pdfUrl={pdfUrl} onClose={() => setShowPdfModal(false)} />}
    </div>
  );
}
