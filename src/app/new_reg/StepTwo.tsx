import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RepairDetails, Variation, Technician } from "./page";
import ServiceTypeModal from "./ServiceTypeModal";

interface StepTwoProps {
  repair: RepairDetails;
  variations: Variation[];
  technicians: Technician[];
  selectedTechnician: number | null;
  handleRepairChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleTechnicianChange: (technicianId: number) => void;
  calculateTotal: () => string;
  handlePreviousStep: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isLoadingVariations: boolean;
}

const StepTwo: React.FC<StepTwoProps> = ({
  repair,
  variations,
  technicians,
  selectedTechnician,
  handleRepairChange,
  handleTechnicianChange,
  calculateTotal,
  handlePreviousStep,
  handleSubmit,
  isSubmitting,
  isLoadingVariations
}) => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [localVariations, setLocalVariations] = useState<Variation[]>(variations);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  
  // Update local variations when props change
  useEffect(() => {
    setLocalVariations(variations);
  }, [variations]);

  // Function to refresh variations
  const refreshVariations = async () => {
    try {
      const response = await api.get("/variations");
      setLocalVariations(response.data);
      return response.data;
    } catch (error) {
      console.error("Error refreshing variations:", error);
      return [];
    }
  };
  
  // Validate all required fields
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!repair.variation_id) errors.variation_id = "Service type is required";
    if (!selectedTechnician) errors.assigned_technician = "Assigned technician is required";
    if (!repair.supervisor_expected_delivery_date) errors.supervisor_expected_delivery_date = "Expected delivery date is required";
    if (!repair.supervisor_ratio) errors.supervisor_ratio = "Supervisor quality ratio is required";
    if (!repair.technician_expected_delivery_date) errors.technician_expected_delivery_date = "Technician expected delivery date is required";
    if (!repair.technician_ratio) errors.technician_ratio = "Technician quality ratio is required";
    if (!repair.things_to_fix || repair.things_to_fix.trim() === '') errors.things_to_fix = "Things to fix is required";
    if (!repair.price || parseFloat(repair.price) <= 0) errors.price = "Price is required and must be greater than 0";
    if (!repair.payment_status) errors.payment_status = "Payment status is required";
    if (!repair.payment_method) errors.payment_method = "Payment method is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission with validation
  const validateAndSubmit = () => {
    setAttemptedSubmit(true);
    if (validateForm()) {
      handleSubmit();
    } else {
      // Scroll to the first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Repair Details</h2>
      
      {attemptedSubmit && Object.keys(formErrors).length > 0 && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Please correct the following errors:</strong>
          <ul className="mt-2 list-disc pl-5">
            {Object.values(formErrors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Service Type and Assigned Technician - Keep at the top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="variation_id" className="block text-sm font-medium">Service Type *</label>
            <button 
              type="button"
              onClick={() => setShowServiceModal(true)}
              className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
              title="Add New Service Type"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {isLoadingVariations ? (
            <div className="w-full p-2 border rounded bg-gray-100">Loading service types...</div>
          ) : (
            <select
              id="variation_id"
              name="variation_id"
              value={repair.variation_id || ""}
              onChange={handleRepairChange}
              className={`w-full p-2 border ${formErrors.variation_id && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
              required
              data-error={!!formErrors.variation_id && attemptedSubmit}
            >
              <option value="">Select Service Type</option>
              {localVariations.map(variation => (
                <option key={variation.variation_id} value={variation.variation_id}>
                  {variation.variation_name}
                </option>
              ))}
            </select>
          )}
          {formErrors.variation_id && attemptedSubmit && (
            <p className="text-red-500 text-xs mt-1">{formErrors.variation_id}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="assigned_technician" className="block text-sm font-medium mb-1 font-bold">Assigned Technician *</label>
          <select
            id="assigned_technician"
            name="assigned_technician"
            value={selectedTechnician || ""}
            onChange={(e) => handleTechnicianChange(parseInt(e.target.value, 10))}
            className={`w-full p-2 border ${formErrors.assigned_technician && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded bg-yellow-50`}
            required
            data-error={!!formErrors.assigned_technician && attemptedSubmit}
          >
            <option value="">Select Technician</option>
            {technicians.map(tech => (
              <option key={tech.user_id} value={tech.user_id}>
                {tech.technician_name}
              </option>
            ))}
          </select>
          {formErrors.assigned_technician && attemptedSubmit && (
            <p className="text-red-500 text-xs mt-1">{formErrors.assigned_technician}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Select the technician who will perform the repair</p>
        </div>
      </div>
      
      {/* Supervisor and Technician boxes - Keep at the top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Supervisor Box */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-bold mb-4 text-blue-600">Supervisor</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="supervisor_expected_delivery_date" className="block text-sm font-medium mb-1 font-bold">Expected Delivery Date *</label>
              <Input
                id="supervisor_expected_delivery_date"
                name="supervisor_expected_delivery_date"
                type="date"
                value={repair.supervisor_expected_delivery_date}
                onChange={handleRepairChange}
                min={new Date().toISOString().split('T')[0]}
                className={`bg-white border-blue-300 ${formErrors.supervisor_expected_delivery_date && attemptedSubmit ? 'border-red-500' : ''}`}
                required
                data-error={!!formErrors.supervisor_expected_delivery_date && attemptedSubmit}
              />
              {formErrors.supervisor_expected_delivery_date && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.supervisor_expected_delivery_date}</p>
              )}
              <p className="text-xs text-blue-500 mt-1">When you expect the repair to be completed</p>
            </div>
            
            <div>
              <label htmlFor="supervisor_ratio" className="block text-sm font-medium mb-1">Quality Ratio (%) *</label>
              <Input
                id="supervisor_ratio"
                name="supervisor_ratio"
                type="number"
                min="0"
                max="100"
                value={repair.supervisor_ratio}
                onChange={handleRepairChange}
                className={`bg-white ${formErrors.supervisor_ratio && attemptedSubmit ? 'border-red-500' : ''}`}
                required
                data-error={!!formErrors.supervisor_ratio && attemptedSubmit}
              />
              {formErrors.supervisor_ratio && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.supervisor_ratio}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Expected level of perfection</p>
            </div>
          </div>
        </div>
        
        {/* Technician Box */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-lg font-bold mb-4 text-green-600">Technician</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="technician_expected_delivery_date" className="block text-sm font-medium mb-1">Expected Delivery Date *</label>
              <Input
                id="technician_expected_delivery_date"
                name="technician_expected_delivery_date"
                type="date"
                value={repair.technician_expected_delivery_date}
                onChange={handleRepairChange}
                min={new Date().toISOString().split('T')[0]} 
                className={`bg-white ${formErrors.technician_expected_delivery_date && attemptedSubmit ? 'border-red-500' : ''}`}
                required
                data-error={!!formErrors.technician_expected_delivery_date && attemptedSubmit}
              />
              {formErrors.technician_expected_delivery_date && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.technician_expected_delivery_date}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="technician_ratio" className="block text-sm font-medium mb-1">Quality Ratio (%) *</label>
              <Input
                id="technician_ratio"
                name="technician_ratio"
                type="number"
                min="0"
                max="100"
                value={repair.technician_ratio}
                onChange={handleRepairChange}
                className={`bg-white ${formErrors.technician_ratio && attemptedSubmit ? 'border-red-500' : ''}`}
                required
                data-error={!!formErrors.technician_ratio && attemptedSubmit}
              />
              {formErrors.technician_ratio && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.technician_ratio}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Expected level of perfection</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Things to Fix, Special Requests, and Notes sections - Keep at the top */}
      <div className="mb-6">
        <label htmlFor="things_to_fix" className="block text-sm font-medium mb-1">Things to Fix *</label>
        <Textarea
          id="things_to_fix"
          name="things_to_fix"
          value={repair.things_to_fix}
          onChange={handleRepairChange}
          rows={3}
          required
          placeholder="Describe what needs to be repaired or serviced..."
          className={`${formErrors.things_to_fix && attemptedSubmit ? 'border-red-500' : ''}`}
          data-error={!!formErrors.things_to_fix && attemptedSubmit}
        />
        {formErrors.things_to_fix && attemptedSubmit && (
          <p className="text-red-500 text-xs mt-1">{formErrors.things_to_fix}</p>
        )}
      </div>
      
      <div className="mb-6">
        <label htmlFor="special_requests" className="block text-sm font-medium mb-1">Special Requests</label>
        <Textarea
          id="special_requests"
          name="special_requests"
          value={repair.special_requests}
          onChange={handleRepairChange}
          rows={2}
          placeholder="Any special requests for this service..."
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes</label>
        <Textarea
          id="notes"
          name="notes"
          value={repair.notes}
          onChange={handleRepairChange}
          rows={2}
          placeholder="Additional notes for this service..."
        />
      </div>
      
      {/* Financial information - MOVED TO BOTTOM */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-bold mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">Price (AED) *</label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={repair.price}
              onChange={handleRepairChange}
              required
              className={`${formErrors.price && attemptedSubmit ? 'border-red-500' : ''}`}
              data-error={!!formErrors.price && attemptedSubmit}
            />
            {formErrors.price && attemptedSubmit && (
              <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="down_payment" className="block text-sm font-medium mb-1">Down Payment (AED) *</label>
            <Input
              id="down_payment"
              name="down_payment"
              type="number"
              min="0"
              step="0.01"
              value={repair.down_payment}
              onChange={handleRepairChange}
              required
              className={`${formErrors.down_payment && attemptedSubmit ? 'border-red-500' : ''}`}
              data-error={!!formErrors.down_payment && attemptedSubmit}
            />
          </div>
          
          <div>
            <label htmlFor="vat_display" className="block text-sm font-medium mb-1">VAT (5%)</label>
            <Input
              id="vat_display"
              type="number"
              value={(parseFloat(repair.price) * 0.05).toFixed(2)}
              disabled
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <label htmlFor="total_display" className="block text-sm font-medium mb-1">Total Amount (AED)</label>
            <Input
              id="total_display"
              type="number"
              value={calculateTotal()}
              disabled
              className="bg-gray-100 font-bold"
            />
          </div>
          
          <div>
            <label htmlFor="payment_status" className="block text-sm font-medium mb-1">Payment Status *</label>
            <select
              id="payment_status"
              name="payment_status"
              value={repair.payment_status}
              onChange={handleRepairChange}
              className={`w-full p-2 border ${formErrors.payment_status && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
              required
              data-error={!!formErrors.payment_status && attemptedSubmit}
            >
              <option value="">Select Payment Status</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
            {formErrors.payment_status && attemptedSubmit && (
              <p className="text-red-500 text-xs mt-1">{formErrors.payment_status}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="payment_method" className="block text-sm font-medium mb-1">Payment Method *</label>
            <select
              id="payment_method"
              name="payment_method"
              value={repair.payment_method}
              onChange={handleRepairChange}
              className={`w-full p-2 border ${formErrors.payment_method && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
              required
              data-error={!!formErrors.payment_method && attemptedSubmit}
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
            </select>
            {formErrors.payment_method && attemptedSubmit && (
              <p className="text-red-500 text-xs mt-1">{formErrors.payment_method}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button 
          onClick={validateAndSubmit} 
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? "Submitting..." : "Create Invoice"}
        </Button>
      </div>

      {/* Service Type Modal */}
      {showServiceModal && (
        <ServiceTypeModal 
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          variations={localVariations}
          refreshVariations={refreshVariations}
          onServiceAdded={(newService) => {
            // Update the form with the selected service
            handleRepairChange({
              target: {
                name: "variation_id",
                value: newService.variation_id.toString()
              }
            } as React.ChangeEvent<HTMLSelectElement>);
            
            // Close the modal
            setShowServiceModal(false);
          }}
        />
      )}
    </Card>
  );
};

export default StepTwo;