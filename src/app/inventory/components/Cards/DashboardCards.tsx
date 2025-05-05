import React, { useEffect, useState } from "react";
import { useOrderCounts } from "../../hooks/useOrderCounts";

interface DashboardCardsProps {
  pendingRequisitions: number;
  onRequisitionsClick: () => void;
  onOrdersTodayClick: () => void;
  onOrdersTomorrowClick: () => void;
}

const DashboardCard = ({ title, value, onClick, icon, color, isLoading }) => {
  return (
    <div 
      className={`${color} p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {isLoading ? "..." : value}
          </p>
        </div>
        <div className="text-2xl text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function DashboardCards({
  pendingRequisitions,
  onRequisitionsClick,
  onOrdersTodayClick,
  onOrdersTomorrowClick
}: DashboardCardsProps) {
  // Use the custom hook to get real-time order counts
  const { counts, loading } = useOrderCounts();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <DashboardCard
        title="Unhandled Requisitions"
        value={pendingRequisitions}
        onClick={onRequisitionsClick}
        icon="📋"
        color="bg-yellow-100"
        isLoading={false}
      />
      <DashboardCard
        title="Orders Expected Today"
        value={counts.todayCount}
        onClick={onOrdersTodayClick}
        icon="📦"
        color="bg-blue-100"
        isLoading={loading}
      />
      <DashboardCard
        title="Orders Expected Tomorrow"
        value={counts.tomorrowCount}
        onClick={onOrdersTomorrowClick}
        icon="🚚"
        color="bg-green-100"
        isLoading={loading}
      />
    </div>
  );
}
