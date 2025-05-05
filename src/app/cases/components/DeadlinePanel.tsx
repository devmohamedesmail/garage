import React from "react";
import Link from "next/link";
import { Case } from "../page";
import api from "@/services/api"; // Import the API service

interface DeadlinePanelProps {
  cases: Case[];
}

const DeadlinePanel: React.FC<DeadlinePanelProps> = ({ cases }) => {
  // Format date for better display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if the date is today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (deadlineString: string) => {
    if (!deadlineString) return 0;
    
    const deadline = new Date(deadlineString);
    const today = new Date();
    
    // Reset times to compare just the dates
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = deadline.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Get class based on days remaining
  const getDeadlineClasses = (daysRemaining: number) => {
    if (daysRemaining < 0) return "text-red-600"; // Past due
    if (daysRemaining === 0) return "text-red-600 font-bold"; // Due today
    if (daysRemaining === 1) return "text-orange-500 font-bold"; // Due tomorrow
    if (daysRemaining <= 3) return "text-yellow-600"; // Coming up soon
    return "text-gray-700"; // Further away
  };

  return (
    <div>
      {cases.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {cases.map((caseItem) => {
            const daysRemaining = getDaysRemaining(caseItem.deadline_date);
            
            return (
              <li key={caseItem.case_id} className="py-3">
                <Link href={`/cases/${caseItem.case_id}`} className="block hover:bg-gray-50 rounded p-2 -m-2">
                  <div className="flex justify-between items-center">
                    <div className="truncate">
                      <span className="font-medium">{caseItem.case_number}</span>
                      {caseItem.invoice_number && (
                        <span className="text-gray-500 ml-2">
                          (Invoice #{caseItem.invoice_number})
                        </span>
                      )}
                    </div>
                    <div className={getDeadlineClasses(daysRemaining)}>
                      {formatDate(caseItem.deadline_date)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 truncate mt-1">
                    {caseItem.license_plate && (
                      <span title={`${caseItem.make} ${caseItem.model}`}>
                        {caseItem.license_plate}
                      </span>
                    )}
                    {caseItem.customer_name && (
                      <span className="ml-2">
                        - {caseItem.customer_name}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-4">No upcoming deadlines</p>
      )}
    </div>
  );
};

export default DeadlinePanel;