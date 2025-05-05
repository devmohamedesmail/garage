import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import api from "@/services/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkOrder {
  work_order_id: number;
  status: string;
  start_date: string;
  end_date: string | null;
  estimated_cost: string | null;
  final_cost?: string | null;
  notes: string;
  supervisor: string;
  is_completed: number;
  // add more fields if desired
}

interface Supervisor {
  user_id: number;
  supervisor_name: string;
}

interface Variation {
  variation_id: number;
  variation_name: string;
}

interface Invoice {
  invoice_id: number;
  work_order_id: number;
}

interface WorkOrderSectionProps {
  invoice: Invoice | null;
  workOrder: WorkOrder | null;
  onWorkOrderCreated: (workOrderId: number) => void;
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

export default function WorkOrderSection({ invoice, workOrder, onWorkOrderCreated }: WorkOrderSectionProps) {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [workOrderData, setWorkOrderData] = useState({
    assigned_supervisor: "",
    notes: "",
    variation_id: ""
  });
  const [workOrderMessage, setWorkOrderMessage] = useState<string>("");

  // Fetch supervisors for assignment
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const res = await api.get("/supervisors");
        setSupervisors(res.data);
      } catch (err) {
        console.error("Failed to fetch supervisors.", err);
      }
    };
    fetchSupervisors();
  }, []);

  // Fetch variations for dynamic stage workflows
  useEffect(() => {
    const fetchVariations = async () => {
      try {
        const res = await api.get("/variations");
        setVariations(res.data); 
      } catch (err) {
        console.error("Failed to fetch variations.", err);
      }
    };
    fetchVariations();
  }, []);

  // Handle work order form changes
  const handleWorkOrderChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setWorkOrderData({
      ...workOrderData,
      [e.target.name]: e.target.value,
    });
  };

  // Create work order (using new variation_id flow)
  const handleWorkOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    // Make sure user selected a supervisor (aka assigned_technician) and variation
    if (!workOrderData.assigned_supervisor) {
      alert("Please select a supervisor.");
      return;
    }
    if (!workOrderData.variation_id) {
      alert("Please select a variation.");
      return;
    }

    const payload = {
      invoice_id: invoice.invoice_id,
      assigned_technician: parseInt(workOrderData.assigned_supervisor, 10),
      variation_id: parseInt(workOrderData.variation_id, 10),
      notes: workOrderData.notes
    };

    try {
      const response = await api.post("/work_orders", payload);
      setWorkOrderMessage("Work order created successfully.");
      
      const newWOId = response.data.work_order_id;
      onWorkOrderCreated(newWOId);
      
    } catch (err) {
      setWorkOrderMessage("Failed to create work order.");
    }
  };

  if (workOrder) {
    return (
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Issued Work Order</h2>
        <dl className="divide-y divide-gray-200">
          <div className="py-2 flex">
            <dt className="font-semibold w-1/3">Work Order ID</dt>
            <dd className="w-2/3">{workOrder.work_order_id}</dd>
          </div>
          <div className="py-2 flex">
            <dt className="font-semibold w-1/3">Status</dt>
            <dd className="w-2/3">{workOrder.status}</dd>
          </div>
          <div className="py-2 flex">
            <dt className="font-semibold w-1/3">Supervisor</dt>
            <dd className="w-2/3">{workOrder.supervisor}</dd>
          </div>
          <div className="py-2 flex">
            <dt className="font-semibold w-1/3">Start Date</dt>
            <dd className="w-2/3">{formatDateString(workOrder.start_date)}</dd>
          </div>
          {workOrder.end_date && (
            <div className="py-2 flex">
              <dt className="font-semibold w-1/3">End Date</dt>
              <dd className="w-2/3">{formatDateString(workOrder.end_date)}</dd>
            </div>
          )}
          <div className="py-2 flex">
            <dt className="font-semibold w-1/3">Notes</dt>
            <dd className="w-2/3">{workOrder.notes}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/work-orders/${workOrder.work_order_id}`} passHref>
            <Button>View Work Order</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Create Work Order</h2>
      <form onSubmit={handleWorkOrderSubmit}>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Assign Supervisor (Technician):</label>
          <select
            name="assigned_supervisor"
            value={workOrderData.assigned_supervisor}
            onChange={handleWorkOrderChange}
            className="border rounded p-2 w-full"
          >
            <option value="">Select a Supervisor</option>
            {supervisors.map((sup) => (
              <option key={sup.user_id} value={sup.user_id}>
                {sup.supervisor_name}
              </option>
            ))}
          </select>
        </div>

        {/* Variation dropdown */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Select Variation:</label>
          <select
            name="variation_id"
            value={workOrderData.variation_id}
            onChange={handleWorkOrderChange}
            className="border rounded p-2 w-full"
          >
            <option value="">-- Choose a Workflow --</option>
            {variations.map((v) => (
              <option key={v.variation_id} value={v.variation_id}>
                {v.variation_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Work Order Notes:</label>
          <textarea
            name="notes"
            value={workOrderData.notes}
            onChange={handleWorkOrderChange}
            className="border rounded p-2 w-full"
          />
        </div>
        <Button type="submit">Create Work Order</Button>
      </form>
      {workOrderMessage && (
        <p className="mt-2 text-green-600">{workOrderMessage}</p>
      )}
    </Card>
  );
}