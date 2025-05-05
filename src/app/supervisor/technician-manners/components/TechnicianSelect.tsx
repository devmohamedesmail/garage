import React from 'react';

interface Technician {
  user_id: number;
  first_name: string;
  last_name: string;
  staff_code: string;
}

interface TechnicianSelectProps {
  technicians: Technician[];
  selectedTechnician: Technician | null;
  onSelectTechnician: (technician: Technician | null) => void;
}

const TechnicianSelect: React.FC<TechnicianSelectProps> = ({
  technicians,
  selectedTechnician,
  onSelectTechnician,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full">
        <select
          className="w-full p-2 border border-gray-300 rounded-md"
          value={selectedTechnician?.user_id || ''}
          onChange={(e) => {
            const techId = Number(e.target.value);
            const selected = technicians.find((t) => t.user_id === techId) || null;
            onSelectTechnician(selected);
          }}
        >
          <option value="">Select a technician</option>
          {technicians.map((tech) => (
            <option key={tech.user_id} value={tech.user_id}>
              {tech.first_name} {tech.last_name} ({tech.staff_code || 'No Code'})
            </option>
          ))}
        </select>
      </div>
      
      {selectedTechnician && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-medium text-blue-900">
            Selected Technician:
          </h3>
          <p className="text-blue-800">
            {selectedTechnician.first_name} {selectedTechnician.last_name} ({selectedTechnician.staff_code || 'No Code'})
          </p>
        </div>
      )}
    </div>
  );
};

export default TechnicianSelect;