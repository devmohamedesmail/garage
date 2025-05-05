import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const VehicleSearch = ({ onSelectVehicle }) => {
  const [searchType, setSearchType] = useState("both");
  const [carInfo, setCarInfo] = useState({
    make: "",
    model: "",
    licensePlate: ""
  });
  const [ownerInfo, setOwnerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    city: ""
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCarInfoChange = (e) => {
    setCarInfo({
      ...carInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleOwnerInfoChange = (e) => {
    setOwnerInfo({
      ...ownerInfo,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = async () => {
    // Check if at least one field is filled based on search type
    if (searchType === "car" && !carInfo.make && !carInfo.model && !carInfo.licensePlate) {
      toast.error("Please enter at least one car detail to search");
      return;
    }
    
    if (searchType === "owner" && 
        !ownerInfo.firstName && !ownerInfo.lastName && 
        !ownerInfo.email && !ownerInfo.city) {
      toast.error("Please enter at least one owner detail to search");
      return;
    }
    
    if (searchType === "both" && 
        !carInfo.make && !carInfo.model && !carInfo.licensePlate && 
        !ownerInfo.firstName && !ownerInfo.lastName && 
        !ownerInfo.email && !ownerInfo.city) {
      toast.error("Please enter at least one search detail");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/advanced-search`, {
        params: {
          carMake: carInfo.make,
          carModel: carInfo.model,
          carLicensePlate: carInfo.licensePlate,
          ownerFirstName: ownerInfo.firstName,
          ownerLastName: ownerInfo.lastName,
          ownerEmail: ownerInfo.email,
          ownerCity: ownerInfo.city,
          searchType
        }
      });
      
      setResults(response.data.vehicles);
      
      if (response.data.vehicles.length === 0) {
        toast.info("No vehicles found matching your search criteria");
      }
    } catch (error) {
      console.error("Error searching vehicles:", error);
      toast.error("Failed to search vehicles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Search Existing Vehicles</h2>
      
      {/* Search Type Selection */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="car"
              checked={searchType === "car"}
              onChange={() => setSearchType("car")}
              className="mr-2"
            />
            <span className="text-gray-700">Car Information Only</span>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="owner"
              checked={searchType === "owner"}
              onChange={() => setSearchType("owner")}
              className="mr-2"
            />
            <span className="text-gray-700">Owner Information Only</span>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="searchType"
              value="both"
              checked={searchType === "both"}
              onChange={() => setSearchType("both")}
              className="mr-2"
            />
            <span className="text-gray-700">Both Car and Owner</span>
          </label>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Car Information Fields */}
        {(searchType === "car" || searchType === "both") && (
          <div className="p-4 border border-gray-200 rounded bg-gray-50">
            <h3 className="font-semibold mb-3 text-gray-700">Car Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  name="make"
                  value={carInfo.make}
                  onChange={handleCarInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Toyota"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={carInfo.model}
                  onChange={handleCarInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Camry"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={carInfo.licensePlate}
                  onChange={handleCarInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ABC123"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Owner Information Fields */}
        {(searchType === "owner" || searchType === "both") && (
          <div className="p-4 border border-gray-200 rounded bg-gray-50">
            <h3 className="font-semibold mb-3 text-gray-700">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={ownerInfo.firstName}
                  onChange={handleOwnerInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., John"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={ownerInfo.lastName}
                  onChange={handleOwnerInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={ownerInfo.email}
                  onChange={handleOwnerInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., john.doe@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={ownerInfo.city}
                  onChange={handleOwnerInfoChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Dubai"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Search Button */}
        <div className="mt-4">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
      
      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-gray-700">Search Results</h3>
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make & Model</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.license_plate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.customer_first_name} {vehicle.customer_last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.customer_email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.customer_city || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onSelectVehicle(vehicle)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded transition-colors"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleSearch;