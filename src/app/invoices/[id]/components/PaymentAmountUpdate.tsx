import React, { useState, FormEvent, ChangeEvent } from "react";
import garageApi from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PaymentAmountUpdateProps {
  invoiceId: number;
  currentAmount: string;
  onPaymentUpdated: () => void;
}

export default function PaymentAmountUpdate({ invoiceId, currentAmount, onPaymentUpdated }: PaymentAmountUpdateProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  // Handle payment amount change
  const handlePaymentAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPaymentAmount(e.target.value);
  };

  // Submit updated payment amount
  const handlePaymentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!paymentAmount || isNaN(parseFloat(paymentAmount))) {
      setPaymentMessage("Please enter a valid payment amount");
      return;
    }
    
    setIsSavingPayment(true);
    setPaymentMessage("");
    
    try {
      // Use a different endpoint that only updates the total amount without creating a payment record
      await garageApi.patch(`/invoices/${invoiceId}/update-total-amount`, {
        total_amount: parseFloat(paymentAmount),
        user_id: 1 // TODO: Use actual user ID from auth
      });
      
      setPaymentMessage("Invoice total amount updated successfully");
      
      // Clear the payment amount field
      setPaymentAmount("");
      
      // Notify parent component to refresh invoice data
      onPaymentUpdated();
      
    } catch (err: any) {
      setPaymentMessage(`Error: ${err.response?.data?.error || err.message || "Failed to update total amount"}`);
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Your case has been approved!</p>
            <p className="text-sm mt-1">You can now update the invoice total amount below.</p>
          </div>
        </div>
      </div>
      
      <h2 className="text-xl font-bold mb-4">Update Total Amount</h2>
      
      {paymentMessage && (
        <div className={`mb-4 p-3 rounded ${paymentMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {paymentMessage}
        </div>
      )}
      
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Current Total Amount
          </label>
          <input 
            type="text" 
            id="currentAmount" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" 
            value={currentAmount || ""} 
            disabled 
          />
        </div>
        
        <div>
          <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
            New Total Amount <span className="text-red-600">*</span>
          </label>
          <input 
            type="number" 
            id="paymentAmount" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={paymentAmount}
            onChange={handlePaymentAmountChange}
            step="0.01"
            min="0"
            placeholder="Enter the new total amount"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSavingPayment}
            className={isSavingPayment ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSavingPayment ? "Updating..." : "Update Total Amount"}
          </Button>
        </div>
      </form>
    </Card>
  );
}