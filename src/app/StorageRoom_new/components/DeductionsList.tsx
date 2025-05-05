import { useState, useEffect } from "react";
import DeductionItem from "./DeductionItem";
import { FaPlus } from "react-icons/fa";

interface ItemInfo {
  item_id: number;
  item_name: string;
  item_type: string;
  quantity_on_hand: number;
  cost_price: number;
  description: string;
}

interface Deduction {
  serial_number: string;
  quantity: number;
  itemInfo?: ItemInfo;
}

interface DeductionsListProps {
  deductions: Deduction[];
  onDeductionChange: (index: number, field: "serial_number" | "quantity", value: string) => void;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
  lastScannedIndex: number | null;
  loadingSerials?: Record<string, boolean>;
  onSerialKeyDown?: (e: React.KeyboardEvent, index: number) => void;
}

const DeductionsList = ({
  deductions,
  onDeductionChange,
  onRemoveRow,
  onAddRow,
  lastScannedIndex,
  loadingSerials = {},
  onSerialKeyDown
}: DeductionsListProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // When a new scan happens, highlight it briefly
  useEffect(() => {
    if (lastScannedIndex !== null) {
      setHighlightedIndex(lastScannedIndex);
      const timer = setTimeout(() => {
        setHighlightedIndex(null);
      }, 2000); // Remove highlight after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [lastScannedIndex]);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Items to Deduct</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {deductions.length} {deductions.length === 1 ? "item" : "items"}
        </span>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        Scan item barcodes or manually add rows below.
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto mb-4 pr-1">
        {deductions.map((d, i) => (
          <DeductionItem
            key={i}
            index={i}
            serialNumber={d.serial_number}
            quantity={d.quantity}
            itemInfo={d.itemInfo}
            onChange={onDeductionChange}
            onRemove={onRemoveRow}
            isHighlighted={i === highlightedIndex}
            isLoading={loadingSerials[d.serial_number]}
            onSerialKeyDown={onSerialKeyDown ? (e) => onSerialKeyDown(e, i) : undefined}
          />
        ))}
        {deductions.length === 0 && (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500">
            No items added yet. Scan an item or use the "Add Item" button.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onAddRow}
        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <FaPlus /> Add Another Item
      </button>
    </div>
  );
};

export default DeductionsList;
