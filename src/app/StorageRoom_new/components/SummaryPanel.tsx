import React from 'react';
import { FaBoxes, FaMoneyBill } from 'react-icons/fa';

interface SummaryPanelProps {
  totalItems: number;
  totalValue: number;
}

const SummaryPanel = ({ totalItems, totalValue }: SummaryPanelProps) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-gray-800 mb-3 text-lg">Summary</h3>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FaBoxes className="text-blue-600" />
          <div>
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="text-xl font-bold">{totalItems}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FaMoneyBill className="text-green-600" />
          <div>
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-xl font-bold">{totalValue.toFixed(2)} AED</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
