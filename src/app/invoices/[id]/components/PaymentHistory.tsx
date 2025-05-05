import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Payment {
  payment_id: number;
  amount: string;
  payment_method: string;
  payment_date: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

interface PaymentSummary {
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
}

interface PaymentHistoryProps {
  invoiceId: number;
  isLocked: boolean;
  onPaymentAdded: () => void;
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

export default function PaymentHistory({ invoiceId, isLocked, onPaymentAdded }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_method: "",
    notes: ""
  });
  const [paymentMessage, setPaymentMessage] = useState("");
  const [invoiceInfo, setInvoiceInfo] = useState<any>(null);

  // Fetch payments when component mounts
  useEffect(() => {
    fetchPayments();
  }, [invoiceId]);

  // Fetch invoice info when payment modal is shown
  useEffect(() => {
    const fetchInvoiceInfo = async () => {
      if (showPaymentModal) {
        try {
          const res = await api.get(`/invoices/${invoiceId}`);
          setInvoiceInfo(res.data);
        } catch (err) {
          console.error("Failed to fetch invoice info:", err);
        }
      }
    };
    
    fetchInvoiceInfo();
  }, [showPaymentModal, invoiceId]);

  const fetchPayments = async () => {
    try {
      setPaymentLoading(true);
      const res = await api.get(`/invoices/${invoiceId}/payments`);
      setPayments(res.data.payments || []);
      setPaymentSummary(res.data.summary || null);
      setPaymentLoading(false);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setPaymentLoading(false);
    }
  };

  // Handle payment form changes
  const handlePaymentChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setNewPayment({
      ...newPayment,
      [e.target.name]: e.target.value,
    });
  };

  // Submit new payment
  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate payment amount
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      setPaymentMessage("Please enter a valid payment amount.");
      return;
    }
    
    // Validate payment method
    if (!newPayment.payment_method) {
      setPaymentMessage("Please select a payment method.");
      return;
    }
    
    // Clear previous messages
    setPaymentMessage("");
    
    try {
      // Submit payment to the API
      await api.post(
        `/invoices/${invoiceId}/payments`, 
        {
          ...newPayment,
          created_by: 1, // TODO: Use actual user ID from authentication
        }
      );
      
      // Success message and refresh data
      setPaymentMessage("Payment recorded successfully!");
      setNewPayment({
        amount: "",
        payment_method: "",
        notes: ""
      });
      
      // Refresh payment history
      fetchPayments();
      
      // Notify parent component
      onPaymentAdded();
      
      // Close modal after short delay
      setTimeout(() => {
        setShowPaymentModal(false);
      }, 2000);
      
    } catch (err: any) {
      setPaymentMessage(`Error: ${err.message || "Failed to record payment"}`);
    }
  };

  return (
    <>
      <Card className={`p-4 mb-6 ${paymentSummary?.isFullyPaid ? 'border-green-500 border-2' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">Payment History</h2>
            {paymentSummary?.isFullyPaid && (
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fully Paid
              </span>
            )}
          </div>
          <Button 
            onClick={() => setShowPaymentModal(true)}
            disabled={isLocked || paymentSummary?.isFullyPaid}
            className={
              isLocked || paymentSummary?.isFullyPaid 
                ? "bg-gray-400 cursor-not-allowed" 
                : ""
            }
          >
            {paymentSummary?.isFullyPaid ? "Invoice Paid" : "Add Payment"}
          </Button>
        </div>
        
        {/* Payment Summary */}
        {paymentSummary && (
          <div className={`${paymentSummary.isFullyPaid ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border p-4 rounded mb-4`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${paymentSummary.isFullyPaid ? 'text-green-700' : 'text-blue-700'}`}>Total Amount</p>
                <p className="text-xl font-semibold">{paymentSummary.totalAmount.toFixed(2)} AED</p>
              </div>
              <div>
                <p className={`text-sm ${paymentSummary.isFullyPaid ? 'text-green-700' : 'text-blue-700'}`}>Total Paid</p>
                <p className="text-xl font-semibold">{paymentSummary.totalPaid.toFixed(2)} AED</p>
              </div>
              <div>
                <p className={`text-sm ${paymentSummary.isFullyPaid ? 'text-green-700' : 'text-blue-700'}`}>Remaining Balance</p>
                <p className="text-xl font-semibold">{paymentSummary.remainingBalance.toFixed(2)} AED</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${paymentSummary.isFullyPaid ? 'bg-green-600' : 'bg-blue-600'} h-2.5 rounded-full`}
                  style={{
                    width: `${Math.min(
                      (paymentSummary.totalPaid / paymentSummary.totalAmount) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="mt-1 text-sm text-gray-500 text-right">
                {Math.round((paymentSummary.totalPaid / paymentSummary.totalAmount) * 100)}% paid
              </div>
            </div>
          </div>
        )}

        {/* Payment Records */}
        {paymentLoading ? (
          <p className="text-center py-4">Loading payment history...</p>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateString(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {parseFloat(payment.amount).toFixed(2)} AED
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.recorded_by || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {payment.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded">
            <p className="text-gray-500">No payment records found</p>
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Record New Payment</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {paymentMessage && (
                <div className={`mb-4 p-3 rounded ${paymentMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {paymentMessage}
                </div>
              )}
              
              {paymentSummary && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <div className="mb-2">
                    <span className="text-sm text-blue-700">Total Amount:</span>
                    <span className="font-semibold float-right">{paymentSummary.totalAmount.toFixed(2)} AED</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-blue-700">Already Paid:</span>
                    <span className="font-semibold float-right">{paymentSummary.totalPaid.toFixed(2)} AED</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-blue-700 font-medium">Remaining Balance:</span>
                    <span className="font-bold float-right">{paymentSummary.remainingBalance.toFixed(2)} AED</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handlePaymentSubmit}>
                {/* Amount */}
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Payment Amount <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="amount"
                      value={newPayment.amount}
                      onChange={handlePaymentChange}
                      className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-16"
                      placeholder="0.00"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none bg-gray-100 border-r rounded-l">
                      <span className="text-gray-500">AED</span>
                    </div>
                  </div>
                  {paymentSummary && parseFloat(newPayment.amount) > paymentSummary.remainingBalance && (
                    <p className="text-yellow-600 text-sm mt-1">
                      The amount exceeds the remaining balance. This will result in an overpayment.
                    </p>
                  )}
                </div>
                
                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block font-semibold mb-2">
                    Payment Method <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="payment_method"
                    value={newPayment.payment_method}
                    onChange={handlePaymentChange}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Payment Method --</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Mobile Payment">Mobile Payment</option>
                  </select>
                </div>
                
                {/* Notes */}
                <div className="mb-6">
                  <label className="block font-semibold mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={newPayment.notes}
                    onChange={handlePaymentChange}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Any additional information about this payment"
                  ></textarea>
                </div>
                
                {/* Invoice info */}
                {invoiceInfo && (
                  <div className="mb-6 bg-gray-50 p-3 rounded text-sm">
                    <p className="text-gray-600">Invoice #: {invoiceInfo.invoice_number}</p>
                    <p className="text-gray-600">Customer: {invoiceInfo.customer_name}</p>
                  </div>
                )}
                
                {/* Submit button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Record Payment
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