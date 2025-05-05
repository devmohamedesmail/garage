import React, { useState, useEffect, useRef } from "react";
import { plateRegions, carMakes } from "./page";
import api from "@/services/api";

// Constants for dropdowns
const cities = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah", "Al Ain"];
const countries = ["UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman"];

// Country code mapping
const countryCodes: Record<string, string> = {
  "UAE": "971",
  "Saudi Arabia": "966",
  "Qatar": "974",
  "Kuwait": "965",
  "Bahrain": "973",
  "Oman": "968"
};

// Car models mapping
const carModels: Record<string, string[]> = {
  "Toyota": ["Camry", "Corolla", "RAV4", "Land Cruiser", "Fortuner", "Prado", "Yaris"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "HR-V"],
  "Nissan": ["Altima", "Maxima", "Patrol", "Sunny", "X-Trail"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X3", "X5", "X7"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE"],
  "Ford": ["F-150", "Mustang", "Explorer", "Escape", "Edge"],
  "Chevrolet": ["Tahoe", "Malibu", "Camaro", "Silverado", "Suburban"],
  "Hyundai": ["Sonata", "Elantra", "Tucson", "Santa Fe", "Accent"],
  "Kia": ["Optima", "Sorento", "Sportage", "Forte", "Soul"],
  "Audi": ["A4", "A6", "Q5", "Q7", "A8"],
  "Lexus": ["IS", "ES", "LS", "RX", "GX", "LX"],
  "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-9", "MX-5"],
  "Subaru": ["Outback", "Forester", "Impreza", "Legacy", "Crosstrek"],
  "Volkswagen": ["Jetta", "Passat", "Golf", "Tiguan", "Atlas"],
  "Jeep": ["Grand Cherokee", "Wrangler", "Cherokee", "Compass", "Renegade"],
  "Dodge": ["Charger", "Challenger", "Durango", "Journey", "Grand Caravan"],
  "Mitsubishi": ["Outlander", "Eclipse Cross", "Mirage", "Pajero", "L200"],
  // Add more as needed
};

// TypeScript interfaces
interface CustomerType {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  country: string;
}

interface VehicleType {
  make: string;
  model: string;
  year: string;
  license_plate: string;
  license_code: string;  // New field
  license_number: string;  // New field
  vin: string;
  color: string;
  vehicle_type: string;
}

interface CustomerSuggestion {
  id?: number;
  customer_id?: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
}

interface StepOneProps {
  customer: CustomerType;
  vehicle: VehicleType;
  imagePreview: string | null;
  handleCustomerChange: (e: { target: { name: string; value: string } }) => void;
  handleVehicleChange: (e: { target: { name: string; value: string } }) => void;
  handleMakeSelect: (make: string) => void;
  handleRegionSelect: (region: string) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectExistingVehicle: (vehicle: any) => void;
  handleNextStep: () => void;
  updateCustomerData: (data: Partial<CustomerType>) => void;
}

const StepOne: React.FC<StepOneProps> = ({
  customer,
  vehicle,
  imagePreview,
  handleCustomerChange,
  handleVehicleChange,
  handleMakeSelect,
  handleRegionSelect,
  handleImageChange,
  selectExistingVehicle,
  handleNextStep,
  updateCustomerData,
}) => {
  // State for customer search
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // States for make/model search
  const [filteredMakes, setFilteredMakes] = useState<string[]>(carMakes);
  const [availableModels, setAvailableModels] = useState<string[]>(
    vehicle.make ? (carModels[vehicle.make] || []) : []
  );
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [makeSearchTerm, setMakeSearchTerm] = useState("");
  const [modelSearchTerm, setModelSearchTerm] = useState("");
  
  // Validation state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  
  // Refs for elements and timing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  
  // Phone number split into parts
  const [phoneWithoutCode, setPhoneWithoutCode] = useState<string>(() => {
    // If phone has country code already, extract the number part
    if (customer.phone && customer.phone.length > 3) {
      // Extract the country code from the beginning (assuming format like "971xxxxxxxx")
      for (const [country, code] of Object.entries(countryCodes)) {
        if (customer.phone.startsWith(code)) {
          return customer.phone.substring(code.length);
        }
      }
    }
    return ""; // Default to empty if can't determine
  });
  
  // IMPORTANT: Define fetchCustomerVehicles BEFORE it's used in selectCustomer
  const fetchCustomerVehicles = async (customerId: number) => {
    try {
      console.log("DEBUG: Fetching vehicles for customer ID:", customerId);
      
      const response = await api.get("/vehicles");
      const data = response.data;
      
      console.log("DEBUG: All vehicles received:", data.vehicles.length);
      
      // Filter vehicles to only include those belonging to the selected customer
      const customerVehicles = data.vehicles.filter((vehicle: any) => 
        vehicle.customer_id === customerId
      );
      
      console.log("DEBUG: Filtered vehicles for customer ID", customerId, ":", customerVehicles.length);
      
      if (customerVehicles.length > 0) {
        // Use the first vehicle from the filtered results
        console.log("DEBUG: Selected vehicle:", customerVehicles[0]);
        selectExistingVehicle(customerVehicles[0]);
      } else {
        console.log("DEBUG: No vehicles found for customer ID:", customerId);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };
  
  // Handle first name input change with debouncing
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // First update the field value
    handleCustomerChange(e);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Reset states
    setSearchError(null);
    setNoResults(false);
    
    // Don't search if value is too short
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    
    // Set a new timeout (debounce)
    searchTimeoutRef.current = setTimeout(() => {
      // Perform the search
      searchForCustomers(value);
    }, 500); // 500ms debounce
  };
  
  // Function to search for customers
  const searchForCustomers = async (value: string) => {
    setIsLoading(true);
    setNoResults(false);
    setSearchError(null);
    
    try {
      console.log("DEBUG: Searching for:", value);
      
      console.log("DEBUG: Making request to search customers with:", value);
      
      const response = await api.get(`/customers?search=${value}`);
      const data = response.data;
      
      console.log("DEBUG: Search results:", data);
      
      if (data.customers && data.customers.length > 0) {
        setSuggestions(data.customers);
        setShowDropdown(true);
        setNoResults(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
        setNoResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError(`Error searching: ${error instanceof Error ? error.message : String(error)}`);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to select a customer from dropdown
  const selectCustomer = (selectedCustomer: CustomerSuggestion) => {
    // Close dropdown immediately
    setShowDropdown(false);
    setSuggestions([]); // Clear suggestions to prevent re-opening
    
    console.log("DEBUG: Customer selected:", selectedCustomer);
    
    // Create a comprehensive customer data object from the selected customer
    const customerData: Partial<CustomerType> = {};
    
    // First name
    if (selectedCustomer.first_name || selectedCustomer.name) {
      const value = selectedCustomer.first_name || selectedCustomer.name?.split(' ')[0] || "";
      customerData.first_name = value;
      
      // Set input value directly
      const inputElement = document.querySelector('input[name="first_name"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = value;
        const event = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(event);
      }
      
      // Also call the React handler directly
      handleCustomerChange({ target: { name: "first_name", value } });
    }
    
    // Last name
    if (selectedCustomer.last_name || selectedCustomer.name) {
      const value = selectedCustomer.last_name || selectedCustomer.name?.split(' ').slice(1).join(' ') || "";
      customerData.last_name = value;
      
      // Set input value directly
      const inputElement = document.querySelector('input[name="last_name"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.value = value;
        const event = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(event);
      }
      
      // Also call the React handler
      handleCustomerChange({ target: { name: "last_name", value } });
    }
    
    // Phone - update with new phone handling
    if (selectedCustomer.phone) {
      // For existing customers, we need to split the phone into country code + number
      let countryCode = countryCodes[customer.country]; // Default to current country
      let phoneNumber = selectedCustomer.phone;
      
      // Try to extract country code from phone if it exists
      for (const [country, code] of Object.entries(countryCodes)) {
        if (selectedCustomer.phone.startsWith(code)) {
          countryCode = code;
          phoneNumber = selectedCustomer.phone.substring(code.length);
          
          // Update country if we detected a specific country code
          for (const [countryName, countryCodeValue] of Object.entries(countryCodes)) {
            if (countryCodeValue === countryCode) {
              customerData.country = countryName;
              handleCustomerChange({ target: { name: "country", value: countryName } });
              
              // Update country select element directly
              const countrySelect = document.querySelector('select[name="country"]') as HTMLSelectElement;
              if (countrySelect) {
                countrySelect.value = countryName;
                const event = new Event('change', { bubbles: true });
                countrySelect.dispatchEvent(event);
              }
              break;
            }
          }
          break;
        }
      }
      
      // Set input value directly for the number part
      const phoneInput = document.querySelector('input[name="phoneNumber"]') as HTMLInputElement;
      if (phoneInput) {
        phoneInput.value = phoneNumber;
        const event = new Event('change', { bubbles: true });
        phoneInput.dispatchEvent(event);
      }
      
      // Update state
      setPhoneWithoutCode(phoneNumber);
      
      // Also call the React handler with the full phone number
      customerData.phone = countryCode + phoneNumber;
      handleCustomerChange({ 
        target: { 
          name: "phone", 
          value: countryCode + phoneNumber 
        } 
      });
    }
    
    // Email - FIX: Ensure email is properly updated in both DOM and React state
    if (selectedCustomer.email) {
      customerData.email = selectedCustomer.email;
      
      // Update React state directly
      handleCustomerChange({ target: { name: "email", value: selectedCustomer.email } });
      
      // Set input value directly (with forced value check)
      setTimeout(() => {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
        if (emailInput) {
          emailInput.value = selectedCustomer.email;
          const event = new Event('change', { bubbles: true });
          emailInput.dispatchEvent(event);
          
          // Force React state update again after a short delay to ensure it sticks
          setTimeout(() => {
            handleCustomerChange({ target: { name: "email", value: selectedCustomer.email } });
          }, 100);
        }
      }, 0);
    }
    
    // City - FIX: Ensure city is properly updated in both DOM and React state
    if (selectedCustomer.city) {
      customerData.city = selectedCustomer.city;
      
      // Update React state directly
      handleCustomerChange({ target: { name: "city", value: selectedCustomer.city } });
      
      // Set select value directly (with forced value check)
      setTimeout(() => {
        const citySelect = document.querySelector('select[name="city"]') as HTMLSelectElement;
        if (citySelect) {
          citySelect.value = selectedCustomer.city;
          const event = new Event('change', { bubbles: true });
          citySelect.dispatchEvent(event);
          
          // Force React state update again after a short delay to ensure it sticks
          setTimeout(() => {
            handleCustomerChange({ target: { name: "city", value: selectedCustomer.city } });
          }, 100);
        }
      }, 0);
    }
    
    // Country (if not already set by phone handling)
    if (selectedCustomer.country && !customerData.country) {
      customerData.country = selectedCustomer.country;
      
      // Update React state directly
      handleCustomerChange({ target: { name: "country", value: selectedCustomer.country } });
      
      // Set select value directly
      const countrySelect = document.querySelector('select[name="country"]') as HTMLSelectElement;
      if (countrySelect) {
        countrySelect.value = selectedCustomer.country;
        const event = new Event('change', { bubbles: true });
        countrySelect.dispatchEvent(event);
      }
    }
    
    // Use updateCustomerData to ensure React state is properly updated with all fields at once
    updateCustomerData(customerData);
    
    console.log("DEBUG: CUSTOMER SELECTION COMPLETE");
    
    // Fetch vehicles for the selected customer
    const customerId = selectedCustomer.id || selectedCustomer.customer_id;
    if (customerId) {
      fetchCustomerVehicles(customerId);
    }
  };
  
  // Handler for Vehicle input changes with proper typing
  const handleVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    handleVehicleChange({
      target: {
        name: e.target.name,
        value: e.target.value
      }
    });
  };
  
  // Helper function to handle make selection - IMPROVED VERSION
  const handleMakeDropdownSelect = (make: string) => {
    console.log("DEBUG: Make selected:", make);
    
    // Multiple approaches to ensure the update sticks:
    
    // 1. Update the state directly
    setMakeSearchTerm(make);
    
    // 2. Set the input field value directly via DOM
    const makeInputElement = document.querySelector('input[name="make"]') as HTMLInputElement;
    if (makeInputElement) {
      makeInputElement.value = make;
      // Dispatch change event to ensure React's event system detects it
      const event = new Event('change', { bubbles: true });
      makeInputElement.dispatchEvent(event);
    }
    
    // 3. Call all the standard handlers
    handleMakeSelect(make);
    handleVehicleChange({
      target: { name: "make", value: make }
    });
    
    // 4. Reset model-related state
    setModelSearchTerm("");
    
    // 5. Update model list
    if (carModels[make]) {
      setAvailableModels(carModels[make]);
    } else {
      setAvailableModels([]);
    }
    
    // 6. Clear the model field
    const modelInputElement = document.querySelector('input[name="model"]') as HTMLInputElement;
    if (modelInputElement) {
      modelInputElement.value = '';
      const event = new Event('change', { bubbles: true });
      modelInputElement.dispatchEvent(event);
    }
    
    handleVehicleChange({
      target: { name: "model", value: "" }
    });
    
    // 7. Close dropdown
    setShowMakeDropdown(false);
    
    // 8. Log for debugging
    console.log("Make selection completed. New make value:", make);
  };
  
  // Helper function to handle model selection - IMPROVED VERSION
  const handleModelDropdownSelect = (model: string) => {
    console.log("DEBUG: Model selected:", model);
    
    // Multiple approaches to ensure the update sticks:
    
    // 1. Update the state directly
    setModelSearchTerm(model);
    
    // 2. Set the input field value directly via DOM
    const modelInputElement = document.querySelector('input[name="model"]') as HTMLInputElement;
    if (modelInputElement) {
      modelInputElement.value = model;
      // Dispatch change event to ensure React's event system detects it
      const event = new Event('change', { bubbles: true });
      modelInputElement.dispatchEvent(event);
    }
    
    // 3. Call the standard handler
    handleVehicleChange({
      target: { name: "model", value: model }
    });
    
    // 4. Close dropdown
    setShowModelDropdown(false);
    
    // 5. Log for debugging
    console.log("Model selection completed. New model value:", model);
  };
  
  // Function to handle phone number changes - NEW FUNCTION
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the local state for phone number without code
    setPhoneWithoutCode(e.target.value);
    
    // Get the country code from the current selected country
    const countryCode = countryCodes[customer.country] || "971"; // Default to UAE if not found
    
    // Update the full phone number in the parent component
    handleCustomerChange({
      target: {
        name: "phone",
        value: countryCode + e.target.value
      }
    });
  };
  
  // Function to handle country changes and update phone - NEW FUNCTION
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    
    // First update the country in the parent component
    handleCustomerChange(e);
    
    // Then update the phone number with the new country code
    const newCountryCode = countryCodes[newCountry] || "971";
    handleCustomerChange({
      target: {
        name: "phone",
        value: newCountryCode + phoneWithoutCode
      }
    });
  };
  
  // Close dropdowns when clicking outside - IMPROVED VERSION
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close customer search dropdown
      if (
        firstNameInputRef.current && 
        customerDropdownRef.current && 
        !firstNameInputRef.current.contains(e.target as Node) && 
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      
      // Close make dropdown
      const makeInput = document.querySelector('input[name="make"]');
      const makeDropdown = document.querySelector('.make-dropdown');
      if (
        makeInput && 
        makeDropdown && 
        !makeInput.contains(e.target as Node) && 
        !makeDropdown.contains(e.target as Node)
      ) {
        setShowMakeDropdown(false);
      }
      
      // Close model dropdown
      const modelInput = document.querySelector('input[name="model"]');
      const modelDropdown = document.querySelector('.model-dropdown');
      if (
        modelInput && 
        modelDropdown && 
        !modelInput.contains(e.target as Node) && 
        !modelDropdown.contains(e.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Additional effect to close customer dropdown when customer data is populated
  useEffect(() => {
    // If customer has data, don't keep dropdown open
    if (customer.first_name && customer.last_name && customer.phone) {
      setShowDropdown(false);
    }
  }, [customer.first_name, customer.last_name, customer.phone]);
  
  // Update availableModels when vehicle.make changes
  useEffect(() => {
    if (vehicle.make && carModels[vehicle.make]) {
      setAvailableModels(carModels[vehicle.make]);
    } else {
      setAvailableModels([]);
    }
  }, [vehicle.make]);

  // Effect to update phone number when country changes
  useEffect(() => {
    // If we have a phone number and country changes, update the full phone number
    if (phoneWithoutCode && customer.country) {
      const countryCode = countryCodes[customer.country] || "971";
      handleCustomerChange({
        target: {
          name: "phone",
          value: countryCode + phoneWithoutCode
        }
      });
    }
  }, [customer.country]);

  // Validate form fields
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Customer validation
    if (!customer.first_name) errors.first_name = "First name is required";
    if (!customer.last_name) errors.last_name = "Last name is required";
    if (!customer.phone || phoneWithoutCode === "") errors.phone = "Phone number is required";
    if (!customer.email) errors.email = "Email is required";
    if (!customer.city) errors.city = "City is required";
    if (!customer.country) errors.country = "Country is required";
    
    // Vehicle validation
    if (!vehicle.make) errors.make = "Make is required";
    if (!vehicle.model) errors.model = "Model is required";
    if (!vehicle.year) errors.year = "Year is required";
    if (!vehicle.license_number) errors.license_number = "License number is required";
    if (!vehicle.license_plate.split(" ")[0]) errors.license_region = "License region is required";
    if (!vehicle.license_code) errors.license_code = "License code is required";
    if (!vehicle.color) errors.color = "Color is required";
    if (!vehicle.vin) errors.vin = "VIN is required";
    if (!vehicle.vehicle_type) errors.vehicle_type = "Vehicle type is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle next step with validation
  const validateAndProceed = () => {
    setAttemptedSubmit(true);
    if (validateForm()) {
      handleNextStep();
    } else {
      // Scroll to the first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  return (
    <div>
      {searchError && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {searchError}</span>
        </div>
      )}
      
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name with Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={customer.first_name}
                onChange={handleFirstNameChange}
                className={`w-full p-2 border ${formErrors.first_name && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                ref={firstNameInputRef}
                data-error={!!formErrors.first_name && attemptedSubmit}
                onBlur={() => {
                  // Delay hiding dropdown to allow selection to complete
                  setTimeout(() => {
                    if (!customerDropdownRef.current?.contains(document.activeElement)) {
                      setShowDropdown(false);
                    }
                  }, 200);
                }}
              />
              {formErrors.first_name && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>
              )}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md p-3">
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Searching...</span>
                  </div>
                </div>
              )}
              
              {/* No results message */}
              {noResults && !isLoading && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border rounded-md">
                  <div className="p-2 text-gray-600">
                    No customers found. Continue to create a new customer.
                  </div>
                </div>
              )}
              
              {/* Search results dropdown */}
              {suggestions.length > 0 && showDropdown && (
                <div 
                  ref={customerDropdownRef}
                  className="absolute z-20 mt-1 w-full bg-white shadow-lg border rounded-md overflow-hidden max-h-64 overflow-y-auto search-results-dropdown"
                >
                  <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Search Results</h3>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="hover:bg-blue-50 transition-colors">
                        <div 
                          className="w-full px-4 py-3 flex items-center cursor-pointer"
                          onClick={() => selectCustomer(suggestion)}
                        >
                          <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full h-10 w-10 flex items-center justify-center font-bold mr-3">
                            {suggestion.first_name?.charAt(0) || suggestion.name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {suggestion.name || `${suggestion.first_name || ''} ${suggestion.last_name || ''}`}
                            </p>
                            <div className="flex text-xs text-gray-500 mt-1">
                              {suggestion.phone && (
                                <p className="truncate mr-3">
                                  <span className="inline-block w-4">📱</span> {suggestion.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              selectCustomer(suggestion);
                            }}
                            className="ml-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={customer.last_name}
                onChange={(e) => handleCustomerChange(e)}
                className={`w-full p-2 border ${formErrors.last_name && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.last_name && attemptedSubmit}
              />
              {formErrors.last_name && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>
              )}
            </div>
            
            {/* Phone with Country Code Selector - NEW IMPLEMENTATION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <div className="flex space-x-1">
                <div className="w-2/5">
                  <div className="relative">
                    <select 
                      name="country"
                      value={customer.country}
                      onChange={handleCountryChange}
                      className={`w-full p-2 border ${formErrors.country && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded appearance-none pr-8`}
                      required
                      data-error={!!formErrors.country && attemptedSubmit}
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          +{countryCodes[country]} {country}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                  {formErrors.country && attemptedSubmit && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
                  )}
                </div>
                <div className="w-3/5">
                  <input
                    type="text"
                    name="phoneNumber"
                    value={phoneWithoutCode}
                    onChange={handlePhoneChange}
                    placeholder="Phone number"
                    className={`w-full p-2 border ${formErrors.phone && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                    required
                    data-error={!!formErrors.phone && attemptedSubmit}
                  />
                  {formErrors.phone && attemptedSubmit && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Full number: +{countryCodes[customer.country] || "971"} {phoneWithoutCode}
              </p>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={customer.email}
                onChange={(e) => handleCustomerChange(e)}
                className={`w-full p-2 border ${formErrors.email && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.email && attemptedSubmit}
              />
              {formErrors.email && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>
            
            {/* City Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <select
                name="city"
                value={customer.city}
                onChange={(e) => handleCustomerChange(e)}
                className={`w-full p-2 border ${formErrors.city && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.city && attemptedSubmit}
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {formErrors.city && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
              )}
            </div>
            
            {/* Country Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                name="country"
                value={customer.country}
                onChange={handleCountryChange}
                className={`w-full p-2 border ${formErrors.country && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.country && attemptedSubmit}
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {formErrors.country && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make with Searchable Dropdown - IMPROVED VERSION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="make"
                  value={vehicle.make}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMakeSearchTerm(value);
                    handleVehicleChange(e);
                    setFilteredMakes(
                      carMakes.filter(make => 
                        make.toLowerCase().includes(value.toLowerCase())
                      )
                    );
                    setShowMakeDropdown(true);
                  }}
                  onFocus={() => {
                    setShowMakeDropdown(true);
                    setFilteredMakes(
                      carMakes.filter(make => 
                        make.toLowerCase().includes(vehicle.make.toLowerCase())
                      )
                    );
                  }}
                  className={`w-full p-2 border ${formErrors.make && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                  placeholder="Search make..."
                  required
                  data-error={!!formErrors.make && attemptedSubmit}
                />
                {formErrors.make && attemptedSubmit && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.make}</p>
                )}
                {showMakeDropdown && filteredMakes.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white shadow-lg border rounded-md max-h-60 overflow-auto make-dropdown">
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 uppercase">Select a Make</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {filteredMakes.map((make, index) => (
                        <li 
                          key={index} 
                          className="hover:bg-blue-50 transition-colors cursor-pointer" 
                          onClick={() => handleMakeDropdownSelect(make)}
                        >
                          <div className="w-full px-4 py-3 flex items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {make}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMakeDropdownSelect(make);
                              }}
                              className="ml-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded transition-colors"
                            >
                              Select
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Model with Searchable Dropdown - IMPROVED VERSION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="model"
                  value={vehicle.model}
                  onChange={(e) => {
                    const value = e.target.value;
                    setModelSearchTerm(value);
                    handleVehicleChange(e);
                    setShowModelDropdown(true);
                  }}
                  onFocus={() => {
                    if (vehicle.make) {
                      setShowModelDropdown(true);
                    }
                  }}
                  className={`w-full p-2 border ${formErrors.model && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                  placeholder={vehicle.make ? "Search model..." : "Select make first"}
                  disabled={!vehicle.make}
                  required
                  data-error={!!formErrors.model && attemptedSubmit}
                />
                {formErrors.model && attemptedSubmit && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.model}</p>
                )}
                {showModelDropdown && vehicle.make && (
                  <div className="absolute z-50 mt-1 w-full bg-white shadow-lg border rounded-md max-h-60 overflow-auto model-dropdown">
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 uppercase">Select a Model</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {availableModels
                        .filter(model => 
                          model.toLowerCase().includes(vehicle.model.toLowerCase())
                        )
                        .map((model, index) => (
                          <li 
                            key={index} 
                            className="hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() => handleModelDropdownSelect(model)}
                          >
                            <div className="w-full px-4 py-3 flex items-center">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {model}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleModelDropdownSelect(model);
                                }}
                                className="ml-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded transition-colors"
                              >
                                Select
                              </button>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={vehicle.year}
                onChange={handleVehicleInputChange}
                className={`w-full p-2 border ${formErrors.year && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
                data-error={!!formErrors.year && attemptedSubmit}
              />
              {formErrors.year && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.year}</p>
              )}
            </div>
            
            {/* License Plate with Region Selector and Two Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate *
              </label>
              <div className="flex space-x-2">
                <select
                  onChange={(e) => {
                    // Handle region selection
                    const region = e.target.value;
                    handleRegionSelect(region);
                    
                    // Update the full license plate with the new region
                    handleVehicleChange({
                      target: {
                        name: "license_plate",
                        value: `${region} ${vehicle.license_code || ""} ${vehicle.license_number || ""}`
                      }
                    });
                  }}
                  className={`p-2 border ${formErrors.license_region && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded w-1/4`}
                  required
                  data-error={!!formErrors.license_region && attemptedSubmit}
                  value={vehicle.license_plate.split(" ")[0] || ""}
                >
                  <option value="">Region</option>
                  {plateRegions.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="license_code"
                  maxLength={2}
                  placeholder="Code"
                  className={`w-1/4 p-2 border ${formErrors.license_code && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                  value={vehicle.license_code || ""}
                  onChange={(e) => {
                    const codeValue = e.target.value.toUpperCase();
                    
                    // Update just the code part
                    handleVehicleChange({
                      target: {
                        name: "license_code",
                        value: codeValue
                      }
                    });
                    
                    // Also update the full license plate
                    handleVehicleChange({
                      target: {
                        name: "license_plate",
                        value: `${vehicle.license_plate.split(" ")[0] || ""} ${codeValue} ${vehicle.license_number || ""}`
                      }
                    });
                  }}
                  required
                  data-error={!!formErrors.license_code && attemptedSubmit}
                />
                <input
                  type="text"
                  name="license_number"
                  placeholder="Number"
                  className={`w-2/4 p-2 border ${formErrors.license_number && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                  value={vehicle.license_number || ""}
                  onChange={(e) => {
                    const numberValue = e.target.value;
                    
                    // Update just the number part
                    handleVehicleChange({
                      target: {
                        name: "license_number",
                        value: numberValue
                      }
                    });
                    
                    // Also update the full license plate
                    handleVehicleChange({
                      target: {
                        name: "license_plate",
                        value: `${vehicle.license_plate.split(" ")[0] || ""} ${vehicle.license_code || ""} ${numberValue}`
                      }
                    });
                  }}
                  required
                  data-error={!!formErrors.license_number && attemptedSubmit}
                />
              </div>
              {(formErrors.license_region || formErrors.license_code || formErrors.license_number) && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">Complete license plate is required</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN *
              </label>
              <input
                type="text"
                name="vin"
                value={vehicle.vin}
                onChange={handleVehicleInputChange}
                className={`w-full p-2 border ${formErrors.vin && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.vin && attemptedSubmit}
              />
              {formErrors.vin && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.vin}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={vehicle.color}
                onChange={handleVehicleInputChange}
                className={`w-full p-2 border ${formErrors.color && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.color && attemptedSubmit}
              />
              {formErrors.color && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.color}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type *
              </label>
              <select
                name="vehicle_type"
                value={vehicle.vehicle_type}
                onChange={handleVehicleInputChange}
                className={`w-full p-2 border ${formErrors.vehicle_type && attemptedSubmit ? 'border-red-500' : 'border-gray-300'} rounded`}
                required
                data-error={!!formErrors.vehicle_type && attemptedSubmit}
              >
                <option value="">Select Type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Coupe">Coupe</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Convertible">Convertible</option>
                <option value="Wagon">Wagon</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.vehicle_type && attemptedSubmit && (
                <p className="text-red-500 text-xs mt-1">{formErrors.vehicle_type}</p>
              )}
            </div>
            
            {/* Vehicle Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Vehicle preview"
                    className="h-40 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={validateAndProceed}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
        >
          Next Step
        </button>
      </div>
    </div>
  );
};

export default StepOne;