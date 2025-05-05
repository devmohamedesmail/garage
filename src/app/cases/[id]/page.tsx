"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api"; // Import the API service
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Case, CaseReason } from "../page";

// Remove the generateStaticParams function to fix the build error

interface CaseImage {
  image_id: number;
  case_id: number;
  image_path: string;
  uploaded_by: number;
  uploaded_by_name?: string;
  created_at: string;
}

interface CaseNote {
  note_id: number;
  case_id: number;
  user_id: number;
  note: string;
  created_at: string;
  user_name?: string;
}

interface InvoiceData {
  invoice_id: number;
  invoice_number: string;
  license_plate: string;
  make: string;
  model: string;
  customer_name: string;
  customer_phone: string;
}

interface CaseDetail {
  case: Case;
  invoice: InvoiceData;
  images: CaseImage[];
  notes: CaseNote[];
}

interface ApprovalReason {
  id: string;
  name: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<string>("");
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [resolveNotes, setResolveNotes] = useState<string>("");
  const [approvalReason, setApprovalReason] = useState<string>("approved");
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  // Predefined approval reasons
  const approvalReasons: ApprovalReason[] = [
    { id: "approved", name: "Approved" },
    { id: "approved_with_conditions", name: "Approved with Conditions" },
    { id: "approved_partial", name: "Partially Approved" },
  ];

  // Fetch the case details
  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/invoice-cases/${caseId}`);
        setCaseDetail(response.data);
      } catch (err: any) {
        console.error("Error fetching case details:", err);
        setError(err.response?.data?.error || "Failed to load case details");
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

  // Handle adding a note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim() || !caseDetail) return;
    
    try {
      setAddingNote(true);
      // Using a placeholder user ID of 1, in a real app would use the logged-in user ID
      await api.post(`/invoice-cases/${caseId}/notes`, {
        user_id: 1, // Replace with actual user ID from authentication
        note: newNote
      });
      
      // Refresh case details to show the new note
      const response = await api.get(`/invoice-cases/${caseId}`);
      setCaseDetail(response.data);
      setNewNote("");
    } catch (err: any) {
      console.error("Error adding note:", err);
      alert("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  // Handle approving a case
  const handleApproveCase = async () => {
    if (!caseDetail) return;
    
    try {
      setProcessingAction(true);
      await api.post(`/invoice-cases/${caseId}/approve`, {
        user_id: 1, // Replace with actual admin user ID from authentication
        note: resolveNotes,
        reason: approvalReason // Send the selected reason
      });
      
      alert("Case approved successfully!");
      // Reload the page to reflect the changes
      window.location.reload();
    } catch (err: any) {
      console.error("Error approving case:", err);
      alert(`Failed to approve case: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle rejecting a case
  const handleRejectCase = async () => {
    if (!caseDetail || !resolveNotes.trim()) {
      alert("You must provide a reason for rejection!");
      return;
    }
    
    try {
      setProcessingAction(true);
      await api.post(`/invoice-cases/${caseId}/reject`, {
        user_id: 1, // Replace with actual admin user ID from authentication
        note: resolveNotes
      });
      
      alert("Case rejected successfully!");
      // Reload the page to reflect the changes
      window.location.reload();
    } catch (err: any) {
      console.error("Error rejecting case:", err);
      alert(`Failed to reject case: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Get status badge color class
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return "bg-blue-100 text-blue-800";
      case 'closed':
        return "bg-gray-100 text-gray-800";
      case 'approved':
        return "bg-green-100 text-green-800";
      case 'rejected':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading case details...</div>;
  }

  if (error || !caseDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error || "Failed to load case details"}
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const { case: caseData, invoice, images, notes } = caseDetail;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Case #{caseData.case_number}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClass(caseData.status)}`}>
            {caseData.status.toUpperCase()}
          </span>
          {caseData.is_late && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
              LATE
            </span>
          )}
        </h1>
        
        <Link href="/cases">
          <Button variant="outline">Back to Cases</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Case and invoice details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Case Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <dt className="text-gray-500">Reason:</dt>
              <dd className="font-medium">{caseData.reason_name || caseData.custom_reason || "N/A"}</dd>
              
              <dt className="text-gray-500">Created By:</dt>
              <dd className="font-medium">{caseData.created_by_name || "Unknown"}</dd>
              
              <dt className="text-gray-500">Created On:</dt>
              <dd className="font-medium">{formatDate(caseData.created_at)}</dd>
              
              <dt className="text-gray-500">Deadline:</dt>
              <dd className="font-medium">{formatDate(caseData.deadline_date)}</dd>
              
              <dt className="text-gray-500">Last Updated:</dt>
              <dd className="font-medium">{formatDate(caseData.updated_at)}</dd>
              
              {caseData.assigned_to && (
                <>
                  <dt className="text-gray-500">Assigned To:</dt>
                  <dd className="font-medium">{caseData.assigned_to_name || "Unknown"}</dd>
                </>
              )}
            </dl>
          </Card>
          
          {/* Invoice details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <dt className="text-gray-500">Invoice #:</dt>
              <dd className="font-medium">
                <Link href={`/invoices/${invoice.invoice_id}`} className="text-blue-600 hover:underline">
                  {invoice.invoice_number}
                </Link>
              </dd>
              
              <dt className="text-gray-500">Vehicle:</dt>
              <dd className="font-medium">{invoice.license_plate} - {invoice.make} {invoice.model}</dd>
              
              <dt className="text-gray-500">Customer:</dt>
              <dd className="font-medium">{invoice.customer_name}</dd>
              
              <dt className="text-gray-500">Phone:</dt>
              <dd className="font-medium">{invoice.customer_phone}</dd>
            </dl>
          </Card>
          
          {/* Case description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{caseData.description}</p>
          </Card>

          {/* Case images */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Images</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {images.map(image => (
                  <div key={image.image_id} className="relative">
                    <img 
                      src={image.image_path} 
                      alt={`Case image ${image.image_id}`} 
                      className="w-full h-48 object-cover rounded-md shadow-sm"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Uploaded by {image.uploaded_by_name || "Unknown"} on {formatDate(image.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No images attached to this case.</p>
            )}
          </Card>
        </div>
        
        {/* Right column: Notes and actions */}
        <div className="space-y-6">
          {/* Admin actions (approve/reject) */}
          {caseData.status === 'open' && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Resolve Case</h2>
              <div className="space-y-4">
                {/* Approval reason dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approval Reason:</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                  >
                    {approvalReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>{reason.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
                  <textarea
                    className="w-full border rounded-md p-2 h-24"
                    placeholder="Add notes for resolution (required for rejection)"
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleApproveCase}
                    disabled={processingAction}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={handleRejectCase}
                    disabled={processingAction}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Case notes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            {/* Add note form */}
            <form onSubmit={handleAddNote} className="mb-6">
              <textarea
                className="w-full border rounded-md p-2 mb-2 h-24"
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              ></textarea>
              <Button 
                type="submit" 
                disabled={addingNote || !newNote.trim()}
              >
                {addingNote ? "Adding..." : "Add Note"}
              </Button>
            </form>
            
            {/* Notes listing */}
            <div className="space-y-4">
              {notes.length > 0 ? (
                notes.map(note => (
                  <div key={note.note_id} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{note.user_name || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{formatDate(note.created_at)}</div>
                    </div>
                    <p className="whitespace-pre-line text-gray-700">{note.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No notes yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}