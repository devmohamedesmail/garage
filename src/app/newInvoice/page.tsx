"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import vehicleTypes from "./vehicle_types.json";

/* --------------------------------------------------
   1) Modal for Creating a New Customer
   -------------------------------------------------- */
interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}
function NewCustomerModal({ isOpen, onClose, onCreated }: NewCustomerModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/customers", {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        city,
        country,
      });
      alert("Customer created successfully!");
      onClose();
      onCreated();
    } catch (err) {
      console.error("Failed to create customer:", err);
      alert("Error creating customer.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
        {/* Close (X) button in top-right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold mb-4">Create New Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold mb-1">
              First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Phone</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="e.g. +1 555-5555"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">City</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="e.g. New York"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Country</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="e.g. USA"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-black rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------------------------------------
   2) Modal for Creating a New Vehicle (Locked to Customer)
   -------------------------------------------------- */
interface NewVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  defaultCustomerId: string;    // ID of the selected customer
  defaultCustomerName: string;  // Name of the selected customer
}
function NewVehicleModal({
  isOpen,
  onClose,
  onCreated,
  defaultCustomerId,
  defaultCustomerName,
}: NewVehicleModalProps) {
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [color, setColor] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    // Clear fields when modal opens
    setVin("");
    setMake("");
    setModel("");
    setYear("");
    setLicensePlate("");
    setColor("");
    setVehicleType("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Basic check that we have a valid customer
    if (!defaultCustomerId) {
      alert("No valid customer. Please select a customer first.");
      return;
    }

    // 2) Year cannot exceed current year + 1
    const currentYear = new Date().getFullYear();
    if (year && parseInt(year, 10) > currentYear + 1) {
      alert(`Year cannot exceed ${currentYear + 1}.`);
      return;
    }

    try {
      await api.post("/vehicles", {
        customer_id: parseInt(defaultCustomerId, 10),
        vin,
        make,
        model,
        year: year ? parseInt(year, 10) : null,
        license_plate: licensePlate,
        color,
        vehicle_type: vehicleType,
      });
      alert("Vehicle created successfully!");
      onClose();
      onCreated();
    } catch (err) {
      console.error("Failed to create vehicle:", err);
      alert("Error creating vehicle.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto p-6">
        {/* Close (X) button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Vehicle</h2>
        <div className="border-b border-gray-200 mb-4"></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Locked Customer */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">Customer</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2 bg-gray-100 focus:outline-none"
              value={defaultCustomerName}
              readOnly
            />
          </div>

          {/* VIN */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              VIN <span className="text-sm text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 1HGCM82633A123456"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
            />
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Make <span className="text-sm text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded p-2
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Model <span className="text-sm text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded p-2
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Corolla"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>

          {/* Year & Vehicle Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Year <span className="text-sm text-gray-400">(Optional)</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded p-2
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 2025"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-700">
                Vehicle Type <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded p-2
                           focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
              >
                <option value="">Select vehicle type...</option>
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* License Plate */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              License Plate <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. ABC-1234"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              required
            />
          </div>

          {/* Color */}
          <div>
            <label className="block font-semibold mb-1 text-gray-700">
              Color <span className="text-sm text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded p-2
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Red"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded
                         hover:bg-gray-300 focus:outline-none 
                         focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded 
                         hover:bg-blue-700 focus:outline-none 
                         focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


/* --------------------------------------------------
   3) Full-Screen Layout for CreateInvoicePage (With Dividers)
   -------------------------------------------------- */

// Extend Vehicle interface to include vehicle_type
interface Vehicle {
  vehicle_id: number;
  customer_id: number;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  vehicle_type?: string;
}

export default function CreateInvoicePage() {
  const router = useRouter();

  // Modals
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewVehicleModal, setShowNewVehicleModal] = useState(false);

  // Invoice fields
  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState("");
  const [ratio, setRatio] = useState("");
  const [images, setImages] = useState("");
  const [thingsToFix, setThingsToFix] = useState("");
  const [notes, setNotes] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [carType, setCarType] = useState("");

  // Customer selection states
  interface Customer {
    id: number;
    name: string;
  }
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCustomerLocked, setIsCustomerLocked] = useState(false);

  // Vehicle selection states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Service variations for the dropdown
  const [serviceOptions, setServiceOptions] = useState<any[]>([]);

  // Fetch data
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers?page=1");
      const data = res.data?.customers || [];
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles?page=1&limit=100");
      const data = res.data?.vehicles || [];
      setVehicles(data);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    }
  };

  const fetchServiceOptions = async () => {
    try {
      const res = await api.get("/variations");
      setServiceOptions(res.data);
    } catch (err) {
      console.error("Failed to fetch service variations:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
    fetchServiceOptions();
  }, []);

  // Update filteredVehicles when a customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      setFilteredVehicles(
        vehicles.filter((v) => v.customer_id.toString() === selectedCustomerId)
      );
    } else {
      setFilteredVehicles([]);
    }
  }, [selectedCustomerId, vehicles]);

  // Customer search & select
  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setCustomerSearchValue(query);
    setShowCustomerDropdown(true);
    setIsCustomerLocked(false);
    setSelectedCustomerId("");

    const filtered = customers.filter((cust) =>
      cust.name.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const handleSelectCustomer = (id: number, name: string) => {
    setSelectedCustomerId(id.toString());
    setCustomerSearchValue(name);
    setIsCustomerLocked(true);
    setShowCustomerDropdown(false);

    // Clear vehicle selection and carType when a customer is selected
    setSelectedVehicleId("");
    setCarType("");
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId("");
    setCustomerSearchValue("");
    setIsCustomerLocked(false);
  };

  // Vehicle selection (dropdown)
  const handleSelectVehicle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    setSelectedVehicleId(vehicleId);
    const chosenVehicle = vehicles.find(
      (v) => v.vehicle_id.toString() === vehicleId
    );
    if (chosenVehicle) {
      setCarType(chosenVehicle.vehicle_type || "");
    } else {
      setCarType("");
    }
  };

  // Submit invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert("Please select a valid customer.");
      return;
    }
    if (!selectedVehicleId) {
      alert("Please select a valid vehicle.");
      return;
    }
    if (!serviceType) {
      alert("Please select a Service Type.");
      return;
    }
    if (!totalAmount) {
      alert("Please enter a Total Amount.");
      return;
    }

    const newInvoice = {
      customer_id: selectedCustomerId,
      vehicle_id: selectedVehicleId,
      service_type: serviceType,
      price: price ? parseFloat(price) : 0,
      vat: 5,
      ratio: ratio ? parseFloat(ratio) : 0,
      images,
      things_to_fix: thingsToFix,
      notes,
      special_requests: specialRequests,
      expected_delivery_date: expectedDeliveryDate || null,
      down_payment: downPayment ? parseFloat(downPayment) : 0,
      total_amount: totalAmount ? parseFloat(totalAmount) : 0,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      car_type: carType,
    };

    try {
      const res = await api.post("/invoices", newInvoice);
      if (res.status !== 201) {
        alert("Invoice creation failed.");
        return;
      }

      const { invoice_id } = res.data; 
      if (!invoice_id) {
        alert("Invoice created, but no invoice_id returned from server.");
        return;
      }else{
        alert("Invoice created successfully!");
      }
      
      router.push(`/invoices/${invoice_id}`);

      // router.push("/invoices");
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Error creating invoice. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-1 container mx-auto p-6">
        <div className="bg-white rounded shadow-md p-6 w-full">
          <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Divider - Customer Information */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t-2 border-gray-300"></div>
              <span className="mx-4 text-gray-500 uppercase tracking-wide text-xs">
                Customer Information
              </span>
              <div className="flex-grow border-t-2 border-gray-300"></div>
            </div>

            {/* 1) Select Customer */}
            
            <div className="relative">
              <label className="block font-semibold mb-1">
                Select Customer <span className="text-red-600">*</span>
              </label>

              {/* Input + optional "Change" button side by side */}
              <div className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded p-2 pr-8
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search Customer by name..."
                    value={customerSearchValue}
                    onChange={handleCustomerSearch}
                    onFocus={() => {
                      if (!isCustomerLocked) setShowCustomerDropdown(true);
                    }}
                    readOnly={isCustomerLocked}
                  />

                  {!isCustomerLocked && (
                    <svg
                      className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>

                {isCustomerLocked ? (
                  <button
                    onClick={handleClearCustomer}
                    type="button"
                    className="ml-2 bg-gray-100 border border-gray-300 px-3 py-2 rounded
                               text-gray-700 hover:bg-gray-200 focus:outline-none
                               focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  >
                    Change
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerModal(true)}
                    className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    New Customer
                  </button>
                )}
              </div>

              {/* Dropdown list */}
              {!isCustomerLocked && showCustomerDropdown && (
                <ul
                  className="absolute left-0 right-0 mt-1 bg-white border border-gray-300
                             rounded-md shadow-md max-h-36 overflow-y-auto z-10"
                >
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((cust) => (
                      <li
                        key={cust.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSelectCustomer(cust.id, cust.name)}
                      >
                        {cust.name}
                      </li>
                    ))
                  ) : (
                    <li
                      className="p-2 text-red-600 cursor-pointer hover:bg-gray-100"
                      onClick={() => setShowNewCustomerModal(true)}
                    >
                      No results found. Create a new customer.
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* 2) Vehicle */}
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block font-semibold mb-1">
                  Vehicle <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 p-2 rounded"
                  value={selectedVehicleId}
                  onChange={handleSelectVehicle}
                >
                  <option value="">Select vehicle...</option>
                  {filteredVehicles.map((veh) => {
                    const displayValue = `${veh.license_plate} – ${veh.make} ${veh.model} (${veh.year})`;
                    return (
                      <option key={veh.vehicle_id} value={veh.vehicle_id}>
                        {displayValue}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* NEW VEHICLE: Pass the locked customer to the modal */}
              <button
                type="button"
                onClick={() => {
                  if (!selectedCustomerId) {
                    alert("Please select a valid customer first.");
                    return;
                  }
                  setShowNewVehicleModal(true);
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                New Vehicle
              </button>
            </div>

            {/* 3) Service Type */}
            <div>
              <label className="block font-semibold mb-1">
                Service Type <span className="text-red-600">*</span>
              </label>
              <select
                className="w-full border border-gray-300 p-2 rounded"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
              >
                <option value="">Select service type...</option>
                {serviceOptions.map((option) => (
                  <option key={option.variation_id} value={option.variation_name}>
                    {option.variation_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4) Car Type (read-only) */}
            <div>
              <label className="block font-semibold mb-1">Car Type (from Vehicle)</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded bg-gray-100"
                value={carType}
                readOnly
              />
            </div>

            {/* Divider - Payment Information */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t-2 border-gray-300"></div>
              <span className="mx-4 text-gray-500 uppercase tracking-wide text-xs">
                Payment Information
              </span>
              <div className="flex-grow border-t-2 border-gray-300"></div>
            </div>

            {/* 5) Materials Cost & VAT */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">
                  Materials Cost (Optional)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="e.g. 100"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  VAT <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 p-2 rounded bg-gray-100"
                  value={5}
                  readOnly
                />
              </div>
            </div>

            {/* 6) Ratio & Down Payment */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">
                  Ratio <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="e.g. 1.2"
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Down Payment</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="e.g. 50"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>
            </div>

            {/* 7) Total Amount */}
            <div>
              <label className="block font-semibold mb-1">
                Total Amount <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="e.g. 250"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>

            {/* 8) Payment Status & Payment Method */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">
                  Payment Status <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 p-2 rounded"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Payment Method <span className="text-red-600">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 p-2 rounded"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>

            {/* Divider - Notes */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t-2 border-gray-300"></div>
              <span className="mx-4 text-gray-500 uppercase tracking-wide text-xs">
                Notes
              </span>
              <div className="flex-grow border-t-2 border-gray-300"></div>
            </div>

            {/* 9) Expected Delivery Date */}
            <div>
              <label className="block font-semibold mb-1">
                Expected Delivery Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 p-2 rounded"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                required
              />
            </div>

            {/* 10) Things to Fix */}
            <div>
              <label className="block font-semibold mb-1">
                Things to Fix <span className="text-red-600">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="Describe the issues to address..."
                value={thingsToFix}
                onChange={(e) => setThingsToFix(e.target.value)}
                required
              />
            </div>

            {/* 11) Notes & Special Requests */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">Notes (Optional)</label>
                <textarea
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="Any special instructions..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>
            </div>

            {/* Divider - end */}
            <div className="border-b border-gray-300 my-6"></div>

            {/* 12) (Optional) Images Field - commented out */}
            {/* 
            <div>
              <label className="block font-semibold mb-1">Images (Optional)</label>
              <input
                type="text"
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="URL or base64"
                value={images}
                onChange={(e) => setImages(e.target.value)}
              />
            </div>
            <div className="border-b border-gray-300 my-6"></div>
            */}

            {/* 13) Create Invoice */}
            <div className="pt-4">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <NewCustomerModal
        isOpen={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        onCreated={fetchCustomers}
      />
      <NewVehicleModal
        isOpen={showNewVehicleModal}
        onClose={() => setShowNewVehicleModal(false)}
        onCreated={fetchVehicles}
        defaultCustomerId={selectedCustomerId}
        defaultCustomerName={customerSearchValue}
      />
    </div>
  );
}
