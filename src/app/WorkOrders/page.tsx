"use client";

import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// Define the API response structure
interface WorkOrderAPI {
  work_order_id: number;
  invoice_number?: number;
  invoice_name: string;
  license_plate: string;
  first_name: string;
  last_name: string;
  make: string;
  model: string;
  color: string;
  supervisor: string;
  status: string;
  is_completed: boolean;
}

interface WorkOrder {
  id: number;
  invoiceNo: string;
  invoiceName: string;
  numberPlate: string;
  customerName: string;
  carInfo: string;
  supervisor: string;
  stage: string;
  isCompleted: boolean;
}

interface Car {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface StatusSummary {
  status: string;
  count: number;
}

const WorkOrdersPage: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [stages, setStages] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [cars, setCars] = useState<Car[]>([]);
  const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([]);
  const router = useRouter();

  // For adding new work orders
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedCar, setSelectedCar] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState({
    status: "",
    startDate: "",
    endDate: "",
    notes: "",
    invoiceNo: ""
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NEW STATES for the "stage-based" modal
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageWorkOrders, setStageWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedStatusStage, setSelectedStatusStage] = useState("");

  // Fetch cars from the backend
  const fetchCars = async () => {
    try {
      const response = await api.get("/vehicles");
      setCars(
        response.data.vehicles.map((v: any) => ({
          id: v.vehicle_id,
          name: `${v.make} ${v.model}`,
        }))
      );
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  // Fetch technicians (users) from the backend
  const fetchTechnicians = async () => {
    try {
      const response = await api.get("/users");
      setTechnicians(
        response.data.map((u: any) => ({
          id: u.user_id,
          name: `${u.first_name} ${u.last_name}`,
        }))
      );
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  // Fetch status summary from the backend
  const fetchStatusSummary = async () => {
    try {
      const response = await api.get("/work_orders/status_summary");
      setStatusSummary(response.data.statusSummary);
    } catch (error) {
      console.error("Error fetching status summary:", error);
    }
  };

  // Submit the new work order
  const handleSubmit = async () => {
    if (
      !selectedCar ||
      !selectedTechnician ||
      !additionalInfo.status ||
      !additionalInfo.startDate
    ) {
      alert("Please fill in all required fields!");
      return;
    }
    if (!additionalInfo.invoiceNo) {
      alert("Please provide a valid Invoice Number!");
      return;
    }
  
    try {
      await api.post("/work_orders", {
        invoice_id: parseInt(additionalInfo.invoiceNo, 10),
        vehicle_id: selectedCar,
        assigned_technician: selectedTechnician,
        status: additionalInfo.status,
        start_date: additionalInfo.startDate,
        end_date: additionalInfo.endDate,
        notes: additionalInfo.notes,
      });
      
      alert("Work order created successfully!");
      setIsModalOpen(false); 
      fetchWorkOrders(page);
      fetchStatusSummary();
    } catch (error) {
      console.error("Error creating work order:", error);
      alert("Failed to create work order.");
    }
  };

  const fetchWorkOrders = async (page: number, searchQuery = "") => {
    setLoading(true);
    try {
      const response = await api.get("/work_orders", {
        params: {
          page,
          search: searchQuery,
          stage_id: selectedStage || undefined,
          supervisor_id: selectedSupervisor || undefined,
        },
      });

      const { workOrders: fetchedOrders, totalPages: fetchedTotalPages } = response.data;

      // Map the backend response to our frontend interface
      const orders = fetchedOrders.map((order: WorkOrderAPI) => ({
        id: order.work_order_id,
        invoiceNo: order.invoice_number ? order.invoice_number.toString() : "N/A",
        invoiceName: order.invoice_name,
        numberPlate: order.license_plate,
        customerName: `${order.first_name} ${order.last_name}`,
        carInfo: `${order.make} ${order.model} - ${order.color}`,
        supervisor: order.supervisor || "Unknown",
        stage: order.status,
        isCompleted: order.is_completed,
      }));

      setWorkOrders(orders);
      setFilteredWorkOrders(orders);
      setTotalPages(fetchedTotalPages);

      // Collect unique stages and supervisors for filters
      setStages(Array.from(new Set(orders.map((o) => o.stage))));
      setSupervisors(Array.from(new Set(orders.map((o) => o.supervisor))));
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = [...workOrders];
    if (selectedStage) {
      filtered = filtered.filter((order) => order.stage === selectedStage);
    }
    if (selectedSupervisor) {
      filtered = filtered.filter((order) => order.supervisor === selectedSupervisor);
    }
    setFilteredWorkOrders(filtered);
  };

  const handleSearch = () => {
    // Reset to page 1 when searching
    fetchWorkOrders(1, search);
    setPage(1);
  };

  // Handle click on a status summary card
  const handleStatusClick = async (stage: string) => {
    try {
      setSelectedStatusStage(stage);
      const response = await api.get("/work_orders", {
        params: {
          page: 1,
          search: "",
          stage_id: stage,
        },
      });

      const { workOrders: fetchedOrders } = response.data;
      const mapped = fetchedOrders.map((order: WorkOrderAPI) => ({
        id: order.work_order_id,
        invoiceNo: order.invoice_number ? order.invoice_number.toString() : "N/A",
        invoiceName: order.invoice_name,
        numberPlate: order.license_plate,
        customerName: `${order.first_name} ${order.last_name}`,
        carInfo: `${order.make} ${order.model} - ${order.color}`,
        supervisor: order.supervisor || "Unknown",
        stage: order.status,
        isCompleted: order.is_completed,
      }));
      setStageWorkOrders(mapped);
      setShowStageModal(true);

    } catch (error) {
      console.error("Error fetching work orders for stage:", error);
    }
  };

  function getStageBadgeClasses(stage: string) {
    const lower = stage.toLowerCase();
  
    if (lower.includes("finished")) {
      return "bg-blue-100 text-blue-800";
    } else if (lower.includes("paused")) {
      return "bg-yellow-100 text-yellow-800";
    } else if (lower.includes("closed")) {
      return "bg-green-100 text-green-800";
    }
    // else if (lower.includes("delayed")) {
    //   return "bg-red-100 text-red-800";
    // }

    // Fallback
    return "bg-orange-100 text-orange-800";
  }

  useEffect(() => {
    fetchWorkOrders(page);
    fetchStatusSummary();
  }, [page]);

  useEffect(() => {
    fetchCars();
    fetchTechnicians();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Quick Status Summary Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Work Orders Status Summary</h2>
        {statusSummary.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {statusSummary.map((summary) => (
              //if the status is "Closed", display nothing
              summary.status === "Closed" ? null : (
              <button
                key={summary.status}
                className="p-4 bg-white rounded-lg shadow flex flex-col items-center hover:bg-gray-50"
                onClick={() => handleStatusClick(summary.status)}
              >
                <h3 className="text-lg font-semibold mb-2">{summary.status}</h3>
                <p className="text-2xl font-bold text-blue-600">{summary.count}</p>
                <p className="text-sm text-gray-500">cars</p>
              </button>
            )))}
          </div>
        ) : (
          <div>Loading status summary...</div>
        )}
      </div>

      {/* Search + Filters Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        {/* First row: Search bar + Search button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Input and Button */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Search by Invoice Number, license plate, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 md:w-96"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Second row: Stage dropdown, Supervisor dropdown, Filter & Reset */}
          <div className="flex items-center space-x-2 justify-end">
            <select
              className="p-2 border rounded"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="">Select Stage</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>

            <select
              className="p-2 border rounded"
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
            >
              <option value="">Select Supervisor</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor} value={supervisor}>
                  {supervisor}
                </option>
              ))}
            </select>

            <Button onClick={handleFilter}>Filter</Button>
            <Button
              onClick={() => {
                setSelectedStage("");
                setSelectedSupervisor("");
                setFilteredWorkOrders(workOrders);
              }}
              variant="secondary"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>


      {/* Work Orders Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">Work Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Car Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Supervisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Stage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredWorkOrders.length > 0 ? (
                filteredWorkOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/work-orders/${order.id}`)}
                    className={`
                      cursor-pointer 
                      ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} 
                      hover:bg-gray-100
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.invoiceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.carInfo}{" "}
                      <span className="text-gray-400 ml-1">
                        [{order.numberPlate}]
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.supervisor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {/* 2) Use the helper to get a colored badge for the stage */}
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStageBadgeClasses(order.stage)}`}
                      >
                        {order.stage}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No work orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Modal for Adding New Work Order */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New Work Order</h2>

            {/* Invoice Number Entry */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Invoice Number</label>
              <Input
                type="text"
                placeholder="Enter invoice number"
                value={additionalInfo.invoiceNo}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({ ...prev, invoiceNo: e.target.value }))
                }
              />
            </div>

            {/* Car Dropdown */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Select Car</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
              >
                <option value="">Select a car</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Technician Dropdown */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Select Technician</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
              >
                <option value="">Select a technician</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Info */}
            <div className="mb-4">
              <label className="block font-semibold mb-2">Status</label>
              <Input
                type="text"
                placeholder="Enter status"
                value={additionalInfo.status}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({ ...prev, status: e.target.value }))
                }
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2">Start Date</label>
              <Input
                type="date"
                value={additionalInfo.startDate}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2">End Date</label>
              <Input
                type="date"
                value={additionalInfo.endDate}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-2">Notes</label>
              <Input
                type="text"
                placeholder="Add any notes (optional)"
                value={additionalInfo.notes}
                onChange={(e) =>
                  setAdditionalInfo((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end">
              <Button
                className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
                onClick={handleSubmit}
              >
                Submit
              </Button>
              <Button
                className="bg-red-500 text-white px-4 py-2 rounded-md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Show all work orders in a particular stage */}
      {showStageModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Work Orders in <span className="text-blue-600">{selectedStatusStage}</span>
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowStageModal(false)}
                className="text-red-500"
              >
                X
              </Button>
            </div>

            {stageWorkOrders.length > 0 ? (
              <div className="overflow-y-auto max-h-[70vh]">
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Number Plate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Customer Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          Car Info
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stageWorkOrders.map((wo, idx) => (
                        <tr
                          key={wo.id}
                          onClick={() => router.push(`/work-orders/${wo.id}`)}
                          className={`
                            cursor-pointer
                            ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            hover:bg-gray-100
                          `}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {wo.invoiceName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {wo.numberPlate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {wo.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {wo.carInfo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p>No work orders found in this stage.</p>
            )}
          </div>
        </div>
      )}


      
    </div>
  );
};

export default WorkOrdersPage;
