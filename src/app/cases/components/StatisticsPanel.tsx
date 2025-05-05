import React from "react";
import { Card } from "@/components/ui/card";
import { DashboardStatistics } from "../page";

interface StatisticsPanelProps {
  statistics: DashboardStatistics;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ statistics }) => {
  // Generate colors for the status items
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-purple-100 text-purple-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Cases */}
      <Card className="p-4 flex flex-col">
        <h3 className="text-sm font-medium text-gray-500">Total Cases</h3>
        <p className="text-3xl font-bold mt-2">{statistics.total_cases}</p>
      </Card>

      {/* Cases by Status */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Cases by Status</h3>
        <div className="flex flex-wrap gap-2">
          {statistics.cases_by_status.map((item, index) => (
            <div 
              key={index} 
              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}
            >
              {item.status}: {item.count}
            </div>
          ))}
        </div>
      </Card>

      {/* Time-sensitive Cases */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Time-sensitive</h3>
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            Late: {statistics.late_cases}
          </div>
          <div className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            Due Today: {statistics.due_today}
          </div>
          <div className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
            Due Tomorrow: {statistics.due_tomorrow}
          </div>
        </div>
      </Card>

      {/* Top Reasons */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Top Reasons</h3>
        <div className="space-y-1">
          {statistics.cases_by_reason.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-xs truncate max-w-[70%]" title={item.reason_name}>
                {item.reason_name}
              </span>
              <span className="text-xs font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default StatisticsPanel;