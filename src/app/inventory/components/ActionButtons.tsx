import React from "react";
import { useRouter } from "next/navigation";

interface ActionButtonsProps {
  onNewItemClick: () => void;
  onNewVendorClick: () => void;
  onNewOrderClick: () => void;
}

const ActionButton = ({ label, onClick, icon, color }) => {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white px-4 py-2 rounded-md hover:opacity-90 flex items-center space-x-2 transition-colors`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default function ActionButtons({
  onNewItemClick,
  onNewVendorClick,
  onNewOrderClick
}: ActionButtonsProps) {
  const router = useRouter();

  const handleViewStatistics = () => {
    router.push("/inventory/statistics");
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <ActionButton
        label="Add New Item"
        onClick={onNewItemClick}
        icon="+"
        color="bg-blue-600"
      />
      <ActionButton
        label="Add New Vendor"
        onClick={onNewVendorClick}
        icon="+"
        color="bg-green-600"
      />
      <ActionButton
        label="Add New Order"
        onClick={onNewOrderClick}
        icon="+"
        color="bg-purple-600"
      />
      <ActionButton
        label="View Statistics"
        onClick={handleViewStatistics}
        icon="📊"
        color="bg-amber-600"
      />
    </div>
  );
}
