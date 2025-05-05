"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AddAppointmentToast from "./AddAppointmentToast";
import api from "@/services/api";

interface Appointment {
  id: number;
  customerName: string;
  vehicle: string;
  serviceDate: string;
  technician: string;
  status: string;
}

const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch existing appointments from GET /api/appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get("/appointments");
      const fetchedAppointments = response.data.map((appointment: any) => ({
        id: appointment.appointment_id,
        customerName: `${appointment.customer_first_name} ${appointment.customer_last_name}`,
        vehicle: `${appointment.vehicle_make} ${appointment.vehicle_model} (${appointment.vehicle_license_plate})`,
        serviceDate: appointment.date_time, // or appointment.service_date if your column is actually "service_date"
        technician: appointment.technician_name || "Unassigned",
        status: appointment.status || "Scheduled",
      }));

      setAppointments(fetchedAppointments);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch appointments.");
      setLoading(false);
    }
  };

  // Run fetchAppointments on mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Called when child form is submitted
  const createAppointment = async (data: {
    customerId: number;
    vehicleId: number;
    date: string;        // from the <input type="date" />
    technician: string;  // or number if you prefer
    serviceType: string;
    notes: string;
  }) => {
    try {
      // EXACTLY match your server's request body
      await api.post("/appointments", {
        customer_id: data.customerId,
        vehicle_id: data.vehicleId,
        service_date: data.date,         // server wants "service_date"
        technician_id: data.technician,  // server wants "technician_id"
        service_type: data.serviceType,
        notes: data.notes,
      });

      // After successful POST, re-fetch updated appointments
      await fetchAppointments();
    } catch (error) {
      console.error("Failed to create appointment:", error);
      alert("Could not create appointment. Check console for errors.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button onClick={() => setShowModal(true)}>Add New Appointment</Button>
      </div>

      <Card className="p-4">
        {appointments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="py-2">
                <p>
                  <strong>Customer:</strong> {appointment.customerName}
                </p>
                <p>
                  <strong>Vehicle:</strong> {appointment.vehicle}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(appointment.serviceDate).toLocaleString()}
                </p>
                <p>
                  <strong>Technician:</strong> {appointment.technician}
                </p>
                <p>
                  <strong>Status:</strong> {appointment.status}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No appointments found.</p>
        )}
      </Card>

      {/* Our add-appointment modal */}
      <AddAppointmentToast
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        onAddAppointment={createAppointment}
      />
    </div>
  );
};

export default AppointmentsPage;
