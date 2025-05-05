import React from "react";
import Link from "next/link";
import { Case } from "../page";
import api from "@/services/api"; // Import the API service

interface LatePanelProps {
  cases: Case[];
}

const LatePanel: React.FC<LatePanelProps> = ({ cases }) => {
  // Calculate days late
  const getDaysLate = (deadlineString: string) => {
    if (!deadlineString) return 0;
    
    const deadline = new Date(deadlineString);
    const today = new Date();
    
    // Reset times to compare just the dates
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = today.getTime() - deadline.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Get severity class based on how many days late
  const getSeverityClass = (daysLate: number) => {
    if (daysLate >= 7) return "border-l-4 border-red-600 pl-3"; // Very late
    if (daysLate >= 3) return "border-l-4 border-orange-500 pl-3"; // Moderately late
    return "border-l-4 border-yellow-400 pl-3"; // Recently late
  };

  return (
    <div>
      {cases.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {cases.map((caseItem) => {
            const daysLate = getDaysLate(caseItem.deadline_date);
            
            return (
              <li key={caseItem.case_id} className={`py-3 ${getSeverityClass(daysLate)}`}>
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
                    <div className="text-red-600 font-bold">
                      {daysLate} {daysLate === 1 ? "day" : "days"} late
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
                  <div className="text-sm text-gray-500 mt-1 truncate">
                    Reason: {caseItem.reason_name}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-4">No late cases (good job!)</p>
      )}
    </div>
  );
};

export default LatePanel;