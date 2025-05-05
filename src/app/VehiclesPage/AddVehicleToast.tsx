import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from "@/services/api";

interface AddVehicleToastProps {
  isVisible: boolean;
  onClose: () => void;
  onAddVehicle: (data: {
    customerId: number;
    vin: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color: string;
  }) => void;
}

interface Customer {
  id: number;
  name: string;
}

const AddVehicleToast: React.FC<AddVehicleToastProps> = ({
  isVisible,
  onClose,
  onAddVehicle,
}) => {
  const [formData, setFormData] = useState({
    customerId: "",
    vin: "",
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/api/customers?page=1"); // Fetch the first page for simplicity
        const customerList = response.data.customers.map((customer: any) => ({
          id: customer.id, // Adjusted to match the backend's mapped `id`
          name: customer.name, // Backend already provides concatenated name
        }));
        setCustomers(customerList);
        setFilteredCustomers(customerList);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    };
  
    fetchCustomers();
  }, []);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setShowDropdown(true);
    setFormData((prev) => ({ ...prev, customerId: query }));

    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const handleSelectCustomer = (id: number, name: string) => {
    setFormData((prev) => ({ ...prev, customerId: id.toString() }));
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert("Please select a valid customer.");
      return;
    }
    onAddVehicle({
      customerId: parseInt(formData.customerId),
      vin: formData.vin,
      make: formData.make,
      model: formData.model,
      year: parseInt(formData.year),
      licensePlate: formData.licensePlate,
      color: formData.color,
    });
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 shadow-lg w-96 z-50">
      <h2 className="text-xl font-bold mb-4">Add New Vehicle</h2>
      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="Search Customer"
            value={
              customers.find((customer) =>
                customer.id.toString() === formData.customerId
              )?.name || formData.customerId
            }
            onChange={handleCustomerSearch}
            className="mb-2"
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          {showDropdown && filteredCustomers.length > 0 && (
            <ul className="absolute bg-white border rounded-md shadow-md max-h-40 overflow-y-auto w-full z-10">
              {filteredCustomers.map((customer) => (
                <li
                  key={customer.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectCustomer(customer.id, customer.name)}
                >
                  {customer.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Input
          type="text"
          name="vin"
          placeholder="VIN"
          value={formData.vin}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          type="text"
          name="make"
          placeholder="Make"
          value={formData.make}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          type="text"
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          type="text"
          name="licensePlate"
          placeholder="License Plate"
          value={formData.licensePlate}
          onChange={handleInputChange}
          className="mb-2"
        />
        <Input
          type="text"
          name="color"
          placeholder="Color"
          value={formData.color}
          onChange={handleInputChange}
          className="mb-2"
        />
        <div className="flex justify-end">
          <Button type="submit" className="mr-2">
            Submit
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddVehicleToast;
