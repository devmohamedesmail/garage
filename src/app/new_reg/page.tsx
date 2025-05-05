"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { toast } from "react-hot-toast";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";

// Define interfaces for our form data
export interface Customer {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  country: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  license_plate: string;
  vin: string;
  color: string;
  vehicle_type: string;
}

export interface RepairDetails {
  variation_id: number; // Changed from string to number to match DB
  service_type: string; // Keep this for display purposes
  things_to_fix: string;
  special_requests: string;
  notes: string;
  price: string;
  
  // Supervisor fields
  supervisor_ratio: string;
  supervisor_expected_delivery_date: string;
  
  // Technician fields
  technician_ratio: string;
  technician_expected_delivery_date: string;
  
  down_payment: string;
  payment_status: string;
  payment_method: string;
}

export interface ExistingVehicle {
  vehicle_id: number;
  customer_id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  color: string;
  vehicle_type: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_city: string;
  customer_country: string;
}

export interface Variation {
  variation_id: number;
  variation_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Technician {
  user_id: number;
  technician_name: string;
}

// UAE License Plate Regions
export const plateRegions = [
  { name: "Abu Dhabi", code: "AD" },
  { name: "Dubai", code: "DXB" },
  { name: "Sharjah", code: "SHJ" },
  { name: "Ajman", code: "AJM" },
  { name: "Umm Al Quwain", code: "UAQ" },
  { name: "Ras Al Khaimah", code: "RAK" },
  { name: "Fujairah", code: "FUJ" }
];

// Common car manufacturers
export const carMakes = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti",
  "Buick", "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Dodge", "Ferrari",
  "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar",
  "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lincoln", "Lotus",
  "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "Mini", "Mitsubishi",
  "Nissan", "Pagani", "Peugeot", "Porsche", "Ram", "Renault", "Rolls-Royce",
  "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo"
];

export default function NewRegistrationPage() {
  const router = useRouter();
  
  // Track which step we're on
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // State for variations (service types) and technicians
  const [variations, setVariations] = useState<Variation[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [isLoadingVariations, setIsLoadingVariations] = useState<boolean>(false);
  
  // State for form data
  const [customer, setCustomer] = useState<Customer>({
    first_name: "",
    last_name: "",
    phone: "", // Remove the default "971" value to work with our new country selector
    email: "",
    city: "",
    country: "UAE", // Default to UAE
  });
  
  const [vehicle, setVehicle] = useState<Vehicle>({
    make: "",
    model: "",
    year: "",
    license_plate: "",
    vin: "",
    color: "",
    vehicle_type: "",
  });

  const [repair, setRepair] = useState<RepairDetails>({
    variation_id: 0,
    service_type: "",
    things_to_fix: "",
    special_requests: "",
    notes: "",
    price: "0",
    
    // Separate fields for supervisor and technician
    supervisor_ratio: "100",
    supervisor_expected_delivery_date: "",
    technician_ratio: "100",
    technician_expected_delivery_date: "",
    
    down_payment: "0",
    payment_status: "Unpaid",
    payment_method: "Cash",
  });
  
  // State for the vehicle image
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Selected ids for existing customers and vehicles
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  
  // Fetch variations and technicians when component mounts
  useEffect(() => {
    const fetchVariations = async () => {
      setIsLoadingVariations(true);
      try {
        const response = await api.get("/variations");
        setVariations(response.data);
      } catch (error) {
        console.error("Error fetching variations:", error);
        toast.error("Failed to load service types. Please refresh.");
      } finally {
        setIsLoadingVariations(false);
      }
    };
    
    const fetchTechnicians = async () => {
      try {
        const response = await api.get("/technicians");
        setTechnicians(response.data);
        
        // Set default selected technician if available
        if (response.data.length > 0) {
          setSelectedTechnician(response.data[0].user_id);
        }
      } catch (error) {
        console.error("Error fetching technicians:", error);
        toast.error("Failed to load technicians. Please refresh.");
      }
    };
    
    fetchVariations();
    fetchTechnicians();
  }, []);
  
  // Calculate total amount
  const calculateTotal = () => {
    const price = parseFloat(repair.price) || 0;
    const vat = price * 0.05; // 5% VAT fixed
    return (price + vat).toFixed(2);
  };
  
  // Handle customer form field changes
  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // NEW FUNCTION: Add direct update method for customer data
  const updateCustomerData = (customerData: Partial<Customer>) => {
    setCustomer(prev => ({
      ...prev,
      ...customerData
    }));
  };
  
  // Handle vehicle form field changes
  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVehicle((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle repair form field changes
  const handleRepairChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "variation_id") {
      // Find the corresponding variation name
      const selectedVariation = variations.find(v => v.variation_id.toString() === value);
      
      setRepair((prev) => ({
        ...prev,
        variation_id: parseInt(value, 10),
        service_type: selectedVariation ? selectedVariation.variation_name : "",
      }));
    } else {
      setRepair((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  // Handle selecting a car make
  const handleMakeSelect = (make: string) => {
    setVehicle((prev) => ({
      ...prev,
      make
    }));
  };
  
  const selectExistingVehicle = (vehicle: ExistingVehicle) => {
    // Set IDs for API submission
    setSelectedCustomerId(vehicle.customer_id);
    setSelectedVehicleId(vehicle.vehicle_id);
    
    // Fill vehicle data
    setVehicle({
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year?.toString() || "",
      license_plate: vehicle.license_plate || "",
      vin: vehicle.vin || "",
      color: vehicle.color || "",
      vehicle_type: vehicle.vehicle_type || ""
    });
    
    // Fill complete customer data with all available fields
    setCustomer({
      first_name: vehicle.customer_first_name || "",
      last_name: vehicle.customer_last_name || "",
      phone: vehicle.customer_phone || "971",
      email: vehicle.customer_email || "",
      city: vehicle.customer_city || "",
      country: vehicle.customer_country || "UAE"
    });
  };
  
  // Handle selecting a license plate region
  const handleRegionSelect = (regionCode: string) => {
    setVehicle((prev) => ({
      ...prev,
      license_plate: regionCode + " " + prev.license_plate.replace(/^(AD|DXB|SHJ|AJM|UAQ|RAK|FUJ)\s*/, "")
    }));
  };
  
  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVehicleImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle technician selection
  const handleTechnicianChange = (technicianId: number) => {
    setSelectedTechnician(technicianId);
  };
  
  // Validate Step 1 data
  const validateStep1 = () => {
    // Basic validation for required fields
    if (!customer.first_name || !customer.last_name || !customer.phone) {
      toast.error("Please fill in all required customer information");
      return false;
    }
    
    if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.license_plate) {
      toast.error("Please fill in all required vehicle information");
      return false;
    }
    
    return true;
  };
  
  // Validate Step 2 data
  const validateStep2 = () => {
    if (!repair.variation_id) {
      toast.error("Please select a service type");
      return false;
    }
    
    if (!repair.things_to_fix) {
      toast.error("Please describe what needs to be fixed");
      return false;
    }
    
    if (!repair.supervisor_expected_delivery_date || !repair.technician_expected_delivery_date) {
      toast.error("Please provide expected delivery dates for both supervisor and technician");
      return false;
    }
    
    if (!selectedTechnician) {
      toast.error("Please select a technician");
      return false;
    }
    
    // Validate numeric fields
    if (isNaN(parseFloat(repair.price)) || parseFloat(repair.price) < 0) {
      toast.error("Please enter a valid price");
      return false;
    }
    
    if (isNaN(parseFloat(repair.supervisor_ratio)) || parseFloat(repair.supervisor_ratio) < 0 || parseFloat(repair.supervisor_ratio) > 100) {
      toast.error("Supervisor ratio must be between 0 and 100");
      return false;
    }
    
    if (isNaN(parseFloat(repair.technician_ratio)) || parseFloat(repair.technician_ratio) < 0 || parseFloat(repair.technician_ratio) > 100) {
      toast.error("Technician ratio must be between 0 and 100");
      return false;
    }
    
    if (isNaN(parseFloat(repair.down_payment)) || parseFloat(repair.down_payment) < 0) {
      toast.error("Please enter a valid down payment amount");
      return false;
    }
    
    return true;
  };
  
  // Navigate to next step
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };
  
  // Navigate to previous step
  const handlePreviousStep = () => {
    setCurrentStep(1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let customerId = selectedCustomerId;
      let vehicleId = selectedVehicleId;
      
      // UPDATED: Check if customer exists by phone or email
      if (!customerId && (customer.phone || customer.email)) {
        const checkCustomerResponse = await api.get("/customers/check-exists", {
          params: {
            phone: customer.phone,
            email: customer.email
          }
        });
        
        if (checkCustomerResponse.data.exists) {
          // Use existing customer
          customerId = checkCustomerResponse.data.customer.customer_id;
          toast.success("Using existing customer record");
          
          // Update local customer state with database values
          setCustomer({
            first_name: checkCustomerResponse.data.customer.first_name,
            last_name: checkCustomerResponse.data.customer.last_name,
            phone: checkCustomerResponse.data.customer.phone,
            email: checkCustomerResponse.data.customer.email,
            city: checkCustomerResponse.data.customer.city || "",
            country: checkCustomerResponse.data.customer.country || "UAE"
          });
        }
      }
      
      // If still no customer ID, create a new customer
      if (!customerId) {
        const customerResponse = await api.post("/customers", customer);
        customerId = customerResponse.data.insertId;
        toast.success("New customer created successfully");
      }
      
      // UPDATED: Check if vehicle exists by license plate AND (make + model)
      if (!vehicleId && vehicle.license_plate && vehicle.make && vehicle.model) {
        const checkVehicleResponse = await api.get("/vehicles/check-exists", {
          params: {
            license_plate: vehicle.license_plate,
            make: vehicle.make,
            model: vehicle.model
          }
        });
        
        if (checkVehicleResponse.data.exists) {
          // Use existing vehicle
          vehicleId = checkVehicleResponse.data.vehicle.vehicle_id;
          toast.success("Using existing vehicle record");
          
          // Update local vehicle state with database values
          setVehicle({
            make: checkVehicleResponse.data.vehicle.make,
            model: checkVehicleResponse.data.vehicle.model,
            year: checkVehicleResponse.data.vehicle.year.toString(),
            license_plate: checkVehicleResponse.data.vehicle.license_plate,
            vin: checkVehicleResponse.data.vehicle.vin || "",
            color: checkVehicleResponse.data.vehicle.color || "",
            vehicle_type: checkVehicleResponse.data.vehicle.vehicle_type || ""
          });
        }
      }
      
      // If still no vehicle ID, create a new vehicle
      if (!vehicleId) {
        const vehicleResponse = await api.post("/vehicles", {
          ...vehicle,
          customer_id: customerId,
          year: parseInt(vehicle.year)
        });
        vehicleId = vehicleResponse.data.insertId;
        toast.success("New vehicle created successfully");
      }
      
      // Create the invoice
      const invoiceData = {
        customer_id: customerId,
        vehicle_id: vehicleId,
        service_type: repair.service_type,
        price: parseFloat(repair.price),
        // vat is calculated on the server (forced at 5%)
        car_type: vehicle.vehicle_type,
        ratio: parseFloat(repair.supervisor_ratio), // Use supervisor ratio for the invoice
        // images: imageBase64, // Handle image upload separately if needed
        things_to_fix: repair.things_to_fix,
        notes: repair.notes,
        special_requests: repair.special_requests,
        expected_delivery_date: repair.supervisor_expected_delivery_date, // Use supervisor date for the invoice
        down_payment: parseFloat(repair.down_payment),
        total_amount: parseFloat(calculateTotal()),
        payment_status: repair.payment_status,
        payment_method: repair.payment_method
      };
      
      const invoiceResponse = await api.post("/invoices", invoiceData);
      toast.success("Invoice created successfully");
      
      // Create work order for the invoice using the dedicated registration endpoint
      const workOrderData = {
        invoice_id: invoiceResponse.data.invoice_id,
        assigned_technician: selectedTechnician,
        variation_id: repair.variation_id,
        notes: repair.notes,
        // Add technician fields to the work order
        technician_expected_delivery_date: repair.technician_expected_delivery_date,
        technician_ratio: parseFloat(repair.technician_ratio)
      };
      
      // Use the specialized endpoint for registration
      await api.post("/work_orders_reg", workOrderData);
      toast.success("Work order created successfully");

      // Success - redirect to invoices page
      router.push(`${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceResponse.data.invoice_id}`);

      
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error creating registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Register New Vehicle</h1>
      
      {/* Step indicators */}
      <div className="flex mb-6">
        <div className={`flex-1 p-2 text-center ${currentStep === 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
          Step 1: Vehicle & Client Information
        </div>
        <div className={`flex-1 p-2 text-center ${currentStep === 2 ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
          Step 2: Repair Details
        </div>
      </div>
      
      {/* Step 1 Component */}
      {currentStep === 1 && (
        <StepOne 
          customer={customer}
          vehicle={vehicle}
          imagePreview={imagePreview}
          handleCustomerChange={handleCustomerChange}
          handleVehicleChange={handleVehicleChange}
          handleMakeSelect={handleMakeSelect}
          handleRegionSelect={handleRegionSelect}
          handleImageChange={handleImageChange}
          selectExistingVehicle={selectExistingVehicle}
          handleNextStep={handleNextStep}
          updateCustomerData={updateCustomerData} // Added new prop
        />
      )}
      
      {/* Step 2 Component */}
      {currentStep === 2 && (
        <StepTwo 
          repair={repair}
          variations={variations}
          technicians={technicians}
          selectedTechnician={selectedTechnician}
          handleRepairChange={handleRepairChange}
          handleTechnicianChange={handleTechnicianChange}
          calculateTotal={calculateTotal}
          handlePreviousStep={handlePreviousStep}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isLoadingVariations={isLoadingVariations}
        />
      )}
    </div>
  );
}