"use client";

import React, { useEffect, useState, ChangeEvent, FormEvent, useMemo } from "react";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "react-hot-toast";

/* ===========================================
   INTERFACES
=========================================== */
interface Stage {
  stage_id: number;
  stage_name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface VariationStage {
  variation_stage_id?: number;
  stage_id: number;
  stage_order: number;
  stage_name?: string;
}

interface Variation {
  variation_id: number;
  variation_name: string;
  stages?: VariationStage[];
  created_at?: string;
  updated_at?: string;
}

// NEW: for items returned by /api/stage_usage
interface StageUsageItem {
  stage_id: number;
  stage_name: string;
  description?: string;
  used_in: {
    variation_id: number;
    variation_name: string;
  }[];
}

// NEW: Interface for revert reasons
interface RevertReason {
  reason_id: number;
  reason_text: string;
  is_default: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export default function StageVariationSettingsPage() {
  /* ===========================================
     STATE: STAGES
  =========================================== */
  const [stages, setStages] = useState<Stage[]>([]);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  // stageUsage is an array of StageUsageItem
  const [stageUsage, setStageUsage] = useState<StageUsageItem[]>([]);

  /* ===========================================
     STATE: VARIATIONS
  =========================================== */
  const [variations, setVariations] = useState<Variation[]>([]);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);

  /* ===========================================
     STATE: CREATE NEW VARIATION
  =========================================== */
  const [newVariation, setNewVariation] = useState<Variation>({
    variation_id: 0, // 0 = not yet in DB
    variation_name: "",
    stages: [],
  });

  /* ===========================================
     STATE: REVERT REASONS (NEW)
  =========================================== */
  const [revertReasons, setRevertReasons] = useState<RevertReason[]>([]);
  const [newReasonText, setNewReasonText] = useState("");
  const [editingReason, setEditingReason] = useState<RevertReason | null>(null);
  const [reasonsLoading, setReasonsLoading] = useState(false);

  /* ===========================================
     MESSAGES
  =========================================== */
  const [message, setMessage] = useState<string>("");
  const [stageMessage, setStageMessage] = useState<string>("");
  const [reasonMessage, setReasonMessage] = useState<string>("");

  /* ===========================================
     FETCH DATA ON MOUNT
  =========================================== */
  useEffect(() => {
    fetchStages();
    fetchVariations();
    fetchStageUsage();
    fetchRevertReasons(); // New fetch call
  }, []);

  const fetchStages = async () => {
    try {
      const res = await api.get("/stages");
      setStages(res.data);
    } catch (error) {
      console.error("Error fetching stages:", error);
    }
  };

  const fetchVariations = async () => {
    try {
      const res = await api.get("/variations");
      setVariations(res.data);
    } catch (error) {
      console.error("Error fetching variations:", error);
    }
  };

  const fetchStageUsage = async () => {
    try {
      const res = await api.get("/stage_usage");
      setStageUsage(res.data);
    } catch (error) {
      console.error("Error fetching stage usage:", error);
      // Set empty array as fallback if API fails
      setStageUsage([]);
    }
  };

  // NEW: Fetch revert reasons
  const fetchRevertReasons = async () => {
    setReasonsLoading(true);
    try {
      const res = await api.get("/revert-reasons");
      setRevertReasons(res.data);
    } catch (error) {
      console.error("Error fetching revert reasons:", error);
      toast.error("Failed to load revert reasons");
    } finally {
      setReasonsLoading(false);
    }
  };

  /* ===========================================
     STAGE USAGE MAP (Optional)
  =========================================== */
  // If you still want to build a map of stage->variations from the "raw" variations array,
  // you can keep the code below. But if you're using /api/stage_usage, you might not need it.
  const stageUsageMap = useMemo(() => {
    const usage: Record<number, Variation[]> = {};
    for (const st of stages) {
      usage[st.stage_id] = [];
    }
    for (const v of variations) {
      for (const vs of v.stages || []) {
        if (usage[vs.stage_id]) {
          usage[vs.stage_id].push(v);
        } else {
          usage[vs.stage_id] = [v];
        }
      }
    }
    return usage;
  }, [stages, variations]);

  /* ===========================================
     1) ADD NEW STAGE
  =========================================== */
  const handleAddNewStage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) {
      setStageMessage("Please enter a stage name.");
      return;
    }
    try {
      await api.post("/stages", {
        stage_name: newStageName,
        description: newStageDescription,
      });
      setStageMessage("Stage added successfully.");
      setNewStageName("");
      setNewStageDescription("");
      fetchStages();
      fetchStageUsage();
    } catch (error) {
      console.error("Error adding stage:", error);
      setStageMessage("Error adding stage.");
    }
  };

  /* ===========================================
     2) EDIT/UPDATE A STAGE
  =========================================== */
  const handleStageEditClick = (stage: Stage) => {
    setEditingStage({ ...stage }); // clone
  };

  const handleStageEditChange = (field: keyof Stage, value: string) => {
    if (!editingStage) return;
    setEditingStage({ ...editingStage, [field]: value });
  };

  const handleStageUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;
    try {
      await api.put(`/stages/${editingStage.stage_id}`, {
        stage_name: editingStage.stage_name,
        description: editingStage.description,
      });
      setStageMessage("Stage updated successfully.");
      setEditingStage(null);
      fetchStages();
      fetchStageUsage();
    } catch (err) {
      console.error("Error updating stage:", err);
      setStageMessage("Error updating stage.");
    }
  };

  const handleStageUpdateCancel = () => {
    setEditingStage(null);
  };

  /* ===========================================
     3) DELETE A STAGE
  =========================================== */
  const handleStageDelete = async (stage_id: number) => {
    if (!confirm("Are you sure you want to delete this stage?")) return;
    try {
      await api.delete(`/stages/${stage_id}`);
      setStageMessage("Stage deleted successfully.");
      fetchStages();
      fetchStageUsage();
    } catch (err) {
      console.error("Error deleting stage:", err);
      setStageMessage("Error deleting stage.");
    }
  };

  /* ===========================================
     4) CREATE NEW VARIATION
  =========================================== */
  const handleNewVariationChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewVariation({
      ...newVariation,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddVariationStageRow = () => {
    if (!newVariation.stages) newVariation.stages = [];
    const newVs: VariationStage = {
      stage_id: stages.length > 0 ? stages[0].stage_id : 0,
      stage_order: newVariation.stages.length + 1,
    };
    setNewVariation({
      ...newVariation,
      stages: [...newVariation.stages, newVs],
    });
  };

  const handleNewVariationStageChange = (
    index: number,
    field: keyof VariationStage,
    value: any
  ) => {
    if (!newVariation.stages) return;
    const updated = [...newVariation.stages];
    updated[index] = {
      ...updated[index],
      [field]: field === "stage_order" ? parseInt(value, 10) : value,
    };
    setNewVariation({ ...newVariation, stages: updated });
  };

  const handleNewVariationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        variation_name: newVariation.variation_name,
        stages: newVariation.stages || [],
      };
      await api.post("/variations", payload);
      setMessage("Variation created successfully.");
      setNewVariation({ variation_id: 0, variation_name: "", stages: [] });
      fetchVariations();
    } catch (error: any) {
      console.error("Error creating variation:", error);
      setMessage("Error creating variation: " + error.message);
    }
  };

  /* ===========================================
     5) EDIT/UPDATE A VARIATION
  =========================================== */
  const handleEditVariationClick = async (variation_id: number) => {
    try {
      const res = await api.get(`/variations/${variation_id}`);
      setEditingVariation(res.data);
    } catch (error) {
      console.error("Error fetching variation details:", error);
    }
  };

  const handleEditVariationChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editingVariation) return;
    setEditingVariation({
      ...editingVariation,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddEditVariationStageRow = () => {
    if (!editingVariation) return;
    const newVs: VariationStage = {
      stage_id: stages.length > 0 ? stages[0].stage_id : 0,
      stage_order: (editingVariation.stages?.length || 0) + 1,
    };
    setEditingVariation({
      ...editingVariation,
      stages: [...(editingVariation.stages || []), newVs],
    });
  };

  const handleEditVariationStageChange = (
    index: number,
    field: keyof VariationStage,
    value: any
  ) => {
    if (!editingVariation || !editingVariation.stages) return;
    const updated = [...editingVariation.stages];
    updated[index] = {
      ...updated[index],
      [field]: field === "stage_order" ? parseInt(value, 10) : value,
    };
    setEditingVariation({ ...editingVariation, stages: updated });
  };

  const handleEditVariationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingVariation) return;
    try {
      const payload = {
        variation_name: editingVariation.variation_name,
        stages: editingVariation.stages || [],
      };
      await api.put(
        `/variations/${editingVariation.variation_id}`,
        payload
      );
      setMessage("Variation updated successfully.");
      setEditingVariation(null);
      fetchVariations();
    } catch (error: any) {
      console.error("Error updating variation:", error);
      setMessage("Error updating variation: " + error.message);
    }
  };

  const handleEditVariationCancel = () => {
    setEditingVariation(null);
  };

  /* ===========================================
     6) DELETE A VARIATION
  =========================================== */
  const handleDeleteVariation = async (variation_id: number) => {
    if (!confirm("Are you sure you want to delete this variation?")) return;
    try {
      await api.delete(`/variations/${variation_id}`);
      setMessage("Variation deleted successfully.");
      fetchVariations();
    } catch (error: any) {
      console.error("Error deleting variation:", error);
      setMessage("Error deleting variation: " + error.message);
    }
  };

  /* ===========================================
     7) ADD NEW REVERT REASON (NEW)
  =========================================== */
  const handleAddRevertReason = async (e: FormEvent) => {
    e.preventDefault();
    if (!newReasonText.trim()) {
      setReasonMessage("Please enter a reason text.");
      return;
    }
    
    try {
      // In a real app, get the current user ID from auth context
      const currentUserId = 1; // Example user ID
      
      await api.post("/revert-reasons", {
        reason_text: newReasonText,
        created_by: currentUserId
      });
      
      setReasonMessage("Revert reason added successfully.");
      setNewReasonText("");
      fetchRevertReasons();
    } catch (error: any) {
      console.error("Error adding revert reason:", error);
      
      // Check if it's a duplicate reason error
      if (error.response?.status === 409) {
        setReasonMessage("This reason already exists.");
      } else {
        setReasonMessage("Error adding revert reason: " + (error.response?.data?.error || error.message));
      }
    }
  };

  /* ===========================================
     8) EDIT/UPDATE A REVERT REASON (NEW)
  =========================================== */
  const handleReasonEditClick = (reason: RevertReason) => {
    setEditingReason({ ...reason }); // clone
  };

  const handleReasonEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editingReason) return;
    setEditingReason({
      ...editingReason,
      reason_text: e.target.value
    });
  };

  const handleReasonUpdate = async () => {
    if (!editingReason) return;
    if (!editingReason.reason_text.trim()) {
      setReasonMessage("Reason text cannot be empty.");
      return;
    }
    
    try {
      await api.put(`/revert-reasons/${editingReason.reason_id}`, {
        reason_text: editingReason.reason_text
      });
      
      setReasonMessage("Revert reason updated successfully.");
      setEditingReason(null);
      fetchRevertReasons();
    } catch (error: any) {
      console.error("Error updating revert reason:", error);
      
      if (error.response?.status === 409) {
        setReasonMessage("A reason with this text already exists.");
      } else if (error.response?.status === 403) {
        setReasonMessage("Default reasons cannot be modified.");
      } else {
        setReasonMessage("Error updating revert reason: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleReasonUpdateCancel = () => {
    setEditingReason(null);
  };

  /* ===========================================
     9) DELETE A REVERT REASON (NEW)
  =========================================== */
  const handleDeleteRevertReason = async (reasonId: number) => {
    if (!confirm("Are you sure you want to delete this revert reason?")) return;
    
    try {
      await api.delete(`/revert-reasons/${reasonId}`);
      setReasonMessage("Revert reason deleted successfully.");
      fetchRevertReasons();
    } catch (error: any) {
      console.error("Error deleting revert reason:", error);
      
      if (error.response?.status === 403) {
        setReasonMessage("Default reasons cannot be deleted.");
      } else {
        setReasonMessage("Error deleting revert reason: " + (error.response?.data?.error || error.message));
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6">Stage & Variation Management</h1>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      {/* =============================
          ADD NEW STAGE
      ============================= */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Add New Stage</h2>
        <form onSubmit={handleAddNewStage}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Stage Name:</label>
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              className="border rounded p-2 w-full"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Description:</label>
            <textarea
              value={newStageDescription}
              onChange={(e) => setNewStageDescription(e.target.value)}
              className="border rounded p-2 w-full"
              rows={3}
            />
          </div>

          <Button type="submit">Add Stage</Button>
        </form>
        {stageMessage && <p className="mt-2 text-green-600">{stageMessage}</p>}
      </Card>

      {/* =============================
          LIST OF STAGES
      ============================= */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">All Stages</h2>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Stage ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Description</th>
              <th className="px-4 py-2 border">Used in Variations</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => {
              // find usage object in stageUsage array
              const usageObj = stageUsage.find(
                (obj: StageUsageItem) => obj.stage_id === stage.stage_id
              );
              // fallback to empty array if not found
              const usedIn = usageObj ? usageObj.used_in : [];

              if (editingStage?.stage_id === stage.stage_id) {
                // Inline editing row
                return (
                  <tr key={stage.stage_id}>
                    <td className="px-4 py-2 border">{stage.stage_id}</td>
                    <td className="px-4 py-2 border">
                      <input
                        type="text"
                        className="border p-1 w-full"
                        value={editingStage.stage_name}
                        onChange={(e) =>
                          handleStageEditChange("stage_name", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      <textarea
                        className="border p-1 w-full"
                        rows={2}
                        value={editingStage.description || ""}
                        onChange={(e) =>
                          handleStageEditChange("description", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-2 border">
                      {usedIn.map((v) => v.variation_name).join(", ")}
                    </td>
                    <td className="px-4 py-2 border">
                      <Button className="mr-2" onClick={handleStageUpdate}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleStageUpdateCancel}>
                        Cancel
                      </Button>
                    </td>
                  </tr>
                );
              } else {
                // Normal row
                return (
                  <tr key={stage.stage_id}>
                    <td className="px-4 py-2 border">{stage.stage_id}</td>
                    <td className="px-4 py-2 border">{stage.stage_name}</td>
                    <td className="px-4 py-2 border">{stage.description}</td>
                    <td className="px-4 py-2 border">
                      {usedIn.map((v) => v.variation_name).join(", ")}
                    </td>
                    <td className="px-4 py-2 border">
                      <Button
                        className="mr-2"
                        variant="outline"
                        onClick={() => handleStageEditClick(stage)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStageDelete(stage.stage_id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </Card>

      {/* =============================
          ADD NEW VARIATION
      ============================= */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Add New Variation</h2>
        <form onSubmit={handleNewVariationSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Variation Name:</label>
            <input
              type="text"
              name="variation_name"
              value={newVariation.variation_name}
              onChange={handleNewVariationChange}
              className="border rounded p-2 w-full"
              required
            />
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Stages</h3>
            {(newVariation.stages || []).map((vs, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  value={vs.stage_id}
                  onChange={(e) =>
                    handleNewVariationStageChange(
                      index,
                      "stage_id",
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="border rounded p-2"
                >
                  {stages.map((s) => (
                    <option key={s.stage_id} value={s.stage_id}>
                      {s.stage_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={vs.stage_order}
                  onChange={(e) =>
                    handleNewVariationStageChange(index, "stage_order", e.target.value)
                  }
                  className="border rounded p-2 w-20"
                  min={1}
                />
              </div>
            ))}
            <Button type="button" onClick={handleAddVariationStageRow}>
              Add Stage
            </Button>
          </div>
          <Button type="submit">Create Variation</Button>
        </form>
      </Card>

      {/* =============================
          LIST EXISTING VARIATIONS
      ============================= */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Existing Variations</h2>
        {variations.length === 0 ? (
          <p>No variations found.</p>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr key={v.variation_id}>
                  <td className="px-4 py-2 border">{v.variation_id}</td>
                  <td className="px-4 py-2 border">{v.variation_name}</td>
                  <td className="px-4 py-2 border">
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() => handleEditVariationClick(v.variation_id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteVariation(v.variation_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* =============================
          EDIT VARIATION (INLINE FORM)
      ============================= */}
      {editingVariation && (
        <Card className="p-4 mb-6">
          <h2 className="text-xl font-bold mb-2">Edit Variation</h2>
          <form onSubmit={handleEditVariationSubmit}>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Variation Name:</label>
              <input
                type="text"
                name="variation_name"
                value={editingVariation.variation_name}
                onChange={handleEditVariationChange}
                className="border rounded p-2 w-full"
                required
              />
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-1">Stages</h3>
              {(editingVariation.stages || []).map((vs, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <select
                    value={vs.stage_id}
                    onChange={(e) =>
                      handleEditVariationStageChange(
                        index,
                        "stage_id",
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="border rounded p-2"
                  >
                    {stages.map((s) => (
                      <option key={s.stage_id} value={s.stage_id}>
                        {s.stage_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={vs.stage_order}
                    onChange={(e) =>
                      handleEditVariationStageChange(index, "stage_order", e.target.value)
                    }
                    className="border rounded p-2 w-20"
                    min={1}
                  />
                </div>
              ))}
              <Button type="button" onClick={handleAddEditVariationStageRow}>
                Add Stage
              </Button>
            </div>
            <Button type="submit">Update Variation</Button>
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={handleEditVariationCancel}
            >
              Cancel
            </Button>
          </form>
        </Card>
      )}

      {/* =============================
          ADD NEW REVERT REASON (NEW)
      ============================= */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Add New Revert Reason</h2>
        <form onSubmit={handleAddRevertReason}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Reason Text:</label>
            <input
              type="text"
              value={newReasonText}
              onChange={(e) => setNewReasonText(e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="Enter a new reason for reverting stages"
              required
            />
          </div>
          <Button type="submit">Add Revert Reason</Button>
        </form>
        {reasonMessage && <p className="mt-2 text-green-600">{reasonMessage}</p>}
      </Card>

      {/* =============================
          LIST EXISTING REVERT REASONS (NEW)
      ============================= */}
      <Card className="p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Stage Revert Reasons</h2>
        {reasonsLoading ? (
          <p>Loading revert reasons...</p>
        ) : revertReasons.length === 0 ? (
          <p>No revert reasons found.</p>
        ) : (
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Reason Text</th>
                <th className="px-4 py-2 border">Type</th>
                <th className="px-4 py-2 border">Created At</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {revertReasons.map((reason) => {
                if (editingReason?.reason_id === reason.reason_id) {
                  // Inline editing row
                  return (
                    <tr key={reason.reason_id}>
                      <td className="px-4 py-2 border">{reason.reason_id}</td>
                      <td className="px-4 py-2 border">
                        <input
                          type="text"
                          className="border p-1 w-full"
                          value={editingReason.reason_text}
                          onChange={handleReasonEditChange}
                        />
                      </td>
                      <td className="px-4 py-2 border">
                        {reason.is_default ? "Default" : "Custom"}
                      </td>
                      <td className="px-4 py-2 border">
                        {new Date(reason.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border">
                        <Button className="mr-2" onClick={handleReasonUpdate}>
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleReasonUpdateCancel}>
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  );
                } else {
                  // Normal row
                  return (
                    <tr key={reason.reason_id}>
                      <td className="px-4 py-2 border">{reason.reason_id}</td>
                      <td className="px-4 py-2 border">{reason.reason_text}</td>
                      <td className="px-4 py-2 border">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            reason.is_default 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {reason.is_default ? "Default" : "Custom"}
                        </span>
                      </td>
                      <td className="px-4 py-2 border">
                        {new Date(reason.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 border">
                        {!reason.is_default && (
                          <>
                            <Button
                              className="mr-2"
                              variant="outline"
                              onClick={() => handleReasonEditClick(reason)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteRevertReason(reason.reason_id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        {reason.is_default && (
                          <span className="text-gray-500 italic">System Default</span>
                        )}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}