import React, { useState } from "react";
import garageApi from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditRequestModal from "./EditRequestModal";

interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_name?: string;
  vehicle_info?: string;
  service_type: string;
  price: string;
  vat: string;
  car_type?: string;
  ratio?: string;
  things_to_fix?: string;
  notes?: string;
  special_requests?: string;
  expected_delivery_date?: string;
  down_payment: string;
  total_amount: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  updated_at?: string;
  work_order_id?: number;
  locked_for_editing?: boolean;
}

interface InvoiceDetailsProps {
  invoice: Invoice | null;
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

function formatCurrency(amount: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount) || 0);
}

export default function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Check lock status when a case is created
  const handleCaseCreated = async () => {
    if (!invoice?.invoice_id) return;
    
    try {
      const response = await garageApi.get(`/invoices/${invoice.invoice_id}/lock-status`);
      if (response.data && response.data.locked_for_editing !== undefined) {
        // Handle lock status update via props or context if needed
        console.log("Lock status updated:", response.data.locked_for_editing);
      }
    } catch (err) {
      console.error("Failed to check invoice lock status:", err);
    } finally {
      setShowRequestModal(false);
    }
  };

  if (!invoice) return null;

  return (
    <>
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invoice Details</h2>
          {invoice.locked_for_editing && (
            <Button 
              onClick={() => setShowRequestModal(true)} 
              variant="outline"
            >
              Request Edit Permission
            </Button>
          )}
        </div>
        
        {/* Invoice Header */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Invoice #</p>
              <p className="font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  invoice.payment_status === "Paid" ? "bg-green-100 text-green-800" : 
                  invoice.payment_status === "Partially Paid" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"
                }`}>
                  {invoice.payment_status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-semibold">{formatDateString(invoice.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-semibold">{invoice.payment_method || "N/A"}</p>
            </div>
          </div>
        </div>
        
        {/* Customer & Vehicle */}
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Customer & Vehicle Information</h3>
          <div className="bg-white p-2 border rounded">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p>{invoice.customer_name || "No customer info"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vehicle</p>
                <p>{invoice.vehicle_info || "No vehicle info"}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Service & Pricing */}
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Service & Pricing</h3>
          <div className="bg-white p-3 border rounded">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Service Type</p>
                <p>{invoice.service_type || "Not specified"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Car Type</p>
                <p>{invoice.car_type || "Standard"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p>{formatCurrency(invoice.price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">VAT</p>
                <p>{formatCurrency(invoice.vat)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Down Payment</p>
                <p>{formatCurrency(invoice.down_payment)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                <p className="font-bold">{formatCurrency(invoice.total_amount)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div>
          <h3 className="text-md font-semibold mb-2">Additional Information</h3>
          <div className="bg-white p-3 border rounded">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Things to Fix</p>
                <p className="whitespace-pre-wrap">{invoice.things_to_fix || "None specified"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Special Requests</p>
                <p className="whitespace-pre-wrap">{invoice.special_requests || "None"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="whitespace-pre-wrap">{invoice.notes || "No notes"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Delivery Date</p>
                <p>{invoice.expected_delivery_date ? formatDateString(invoice.expected_delivery_date) : "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {showRequestModal && (
        <EditRequestModal 
          invoiceId={invoice.invoice_id}
          onClose={() => setShowRequestModal(false)}
          onCaseCreated={handleCaseCreated}
        />
      )}
    </>
  );
}