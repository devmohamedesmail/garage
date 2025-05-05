import React, { useState, useEffect } from "react";
import api from "@/services/api";

interface ServiceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceAdded: (newService: { variation_id: number; variation_name: string }) => void;
  variations?: Variation[];
  refreshVariations?: () => Promise<Variation[]>;
}

interface Stage {
  stage_id: number;
  stage_name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface VariationStage {
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

type TabType = 'add' | 'view';

const ServiceTypeModal: React.FC<ServiceTypeModalProps> = ({ 
  isOpen, 
  onClose, 
  onServiceAdded,
  variations: propVariations,
  refreshVariations: propRefreshVariations
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('view');
  
  // Add new service type state
  const [serviceName, setServiceName] = useState("");
  const [stages, setStages] = useState<VariationStage[]>([]);
  const [availableStages, setAvailableStages] = useState<Stage[]>([]);
  
  // View existing service types state
  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  
  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStages();
      fetchVariations();
    }
  }, [isOpen]);

  // Fetch available stages for creating new service types
  const fetchAvailableStages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/stages");
      setAvailableStages(response.data);
    } catch (error) {
      console.error("Error fetching stages:", error);
      setError("Failed to load available stages. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch existing variations (service types)
  const fetchVariations = async () => {
    try {
      setIsLoading(true);
      if (propVariations) {
        setVariations(propVariations);
      } else {
        const response = await api.get("/variations");
        setVariations(response.data);
      }
    } catch (error) {
      console.error("Error fetching variations:", error);
      setError("Failed to load existing service types. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch variation details with stages
  const fetchVariationDetails = async (variationId: number) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/variations/${variationId}`);
      setSelectedVariation(response.data);
    } catch (error) {
      console.error("Error fetching variation details:", error);
      setError("Failed to load service type details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for adding a stage to new service type
  const handleAddStage = () => {
    if (availableStages.length === 0) return;
    
    const newStage: VariationStage = {
      stage_id: availableStages[0].stage_id,
      stage_order: stages.length + 1
    };
    
    setStages([...stages, newStage]);
  };

  // Handler for changing stage in new service type
  const handleStageChange = (index: number, stageId: number) => {
    const updatedStages = [...stages];
    updatedStages[index].stage_id = stageId;
    setStages(updatedStages);
  };

  // Handler for creating new service type
  const handleSubmit = async () => {
    if (!serviceName.trim()) {
      setError("Service name is required");
      return;
    }

    if (stages.length === 0) {
      setError("At least one stage must be added");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/variations", {
        variation_name: serviceName,
        stages: stages.map(stage => ({
          stage_id: stage.stage_id,
          stage_order: stage.stage_order
        }))
      });

      if (response.data) {
        onServiceAdded({
          variation_id: response.data.variation_id,
          variation_name: serviceName
        });
        
        // Reset form and refresh data
        setServiceName("");
        setStages([]);
        
        if (propRefreshVariations) {
          const refreshedVariations = await propRefreshVariations();
          setVariations(refreshedVariations);
        } else {
          fetchVariations();
        }
        
        setActiveTab('view'); // Switch to view tab to show the newly created service
      }
    } catch (error) {
      console.error("Error creating service type:", error);
      setError("Failed to create service type. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get stage name by ID
  const getStageName = (stageId: number): string => {
    const stage = availableStages.find(s => s.stage_id === stageId);
    return stage ? stage.stage_name : `Stage ${stageId}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Service Types</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'view' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('view')}
          >
            Existing Service Types
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('add')}
          >
            Add New Service Type
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 mx-4 my-2 rounded">
            {error}
          </div>
        )}

        {/* Add New Service Type Tab */}
        {activeTab === 'add' && (
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Service Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Enter service type name"
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Service Stages</label>
              </div>
              
              {isLoading && !availableStages.length ? (
                <div className="p-4 text-center text-gray-500">Loading stages...</div>
              ) : (
                <>
                  {stages.length === 0 ? (
                    <div className="text-sm text-gray-500 mb-2">No stages added yet</div>
                  ) : (
                    <ul className="mb-2 space-y-2">
                      {stages.map((stage, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <select
                            value={stage.stage_id}
                            onChange={(e) => handleStageChange(index, Number(e.target.value))}
                            className="flex-1 p-2 border rounded"
                          >
                            {availableStages.map(s => (
                              <option key={s.stage_id} value={s.stage_id}>
                                {s.stage_name}
                              </option>
                            ))}
                          </select>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="py-2 px-4 bg-black text-white font-semibold rounded hover:bg-gray-800"
                  >
                    Add Stage
                  </button>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isLoading ? "Creating..." : "Create Service Type"}
              </button>
            </div>
          </div>
        )}

        {/* View Existing Service Types Tab */}
        {activeTab === 'view' && (
          <div className="p-4">
            {isLoading && !variations.length ? (
              <div className="p-4 text-center text-gray-500">Loading service types...</div>
            ) : (
              <div className="space-y-4">
                {/* List of variations */}
                <div className="border rounded overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {variations.map(variation => (
                        <tr key={variation.variation_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap">{variation.variation_id}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{variation.variation_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => {
                                fetchVariationDetails(variation.variation_id);
                                setSelectedVariation(variation);
                              }}
                            >
                              View Stages
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected variation details */}
                {selectedVariation && (
                  <div className="border rounded p-4 mt-4">
                    <h3 className="text-lg font-medium mb-2">{selectedVariation.variation_name} - Stages</h3>
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading stages...</div>
                    ) : (
                      <>
                        {selectedVariation.stages && selectedVariation.stages.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedVariation.stages.map((stage, index) => (
                              <li key={index} className="flex items-center">
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                                  {stage.stage_order}
                                </span>
                                <span>
                                  {stage.stage_name || getStageName(stage.stage_id)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">No stages defined for this service type.</p>
                        )}
                      </>
                    )}
                    
                    <div className="mt-4">
                      <button 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => {
                          onServiceAdded({
                            variation_id: selectedVariation.variation_id,
                            variation_name: selectedVariation.variation_name
                          });
                          onClose();
                        }}
                      >
                        Select This Service Type
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTypeModal;