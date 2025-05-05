import { ChangeEvent, useState } from "react";
import { FaBarcode, FaTrash, FaSpinner } from "react-icons/fa";

interface ItemInfo {
  item_id: number;
  item_name: string;
  item_type: string;
  quantity_on_hand: number;
  cost_price: number;
  description: string;
}

interface DeductionItemProps {
  serialNumber: string;
  quantity: number;
  index: number;
  itemInfo?: ItemInfo;
  onChange: (index: number, field: "serial_number" | "quantity", value: string) => void;
  onRemove: (index: number) => void;
  isHighlighted?: boolean;
  isLoading?: boolean;
  onSerialKeyDown?: (e: React.KeyboardEvent) => void;
}

const DeductionItem = ({
  serialNumber,
  quantity,
  index,
  itemInfo,
  onChange,
  onRemove,
  isHighlighted = false,
  isLoading = false,
  onSerialKeyDown,
}: DeductionItemProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`flex flex-col mb-2 border ${
        isHighlighted
          ? "border-green-500 bg-green-50"
          : isFocused
          ? "border-blue-300 shadow-sm"
          : "border-gray-200"
      } p-3 rounded-lg transition-all duration-300`}
    >
      <div className="flex space-x-2 items-center">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <FaBarcode />
          </div>
          <input
            type="text"
            placeholder="Serial Number"
            value={serialNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(index, "serial_number", e.target.value)
            }
            onKeyDown={onSerialKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <FaSpinner className="animate-spin text-blue-500" />
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            placeholder="Qty"
            min={1}
            value={quantity}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange(index, "quantity", e.target.value)
            }
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-20 py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="bg-red-50 hover:bg-red-100 p-2 rounded-full text-red-600 hover:text-red-700 transition-colors"
          aria-label="Remove item"
        >
          <FaTrash />
        </button>
      </div>

      {itemInfo && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md text-sm">
          <div className="font-medium text-blue-900">{itemInfo.item_name}</div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-blue-800">Type: {itemInfo.item_type}</span>
            <span className="text-xs text-blue-800">
              Available: <span className={itemInfo.quantity_on_hand < quantity ? "text-red-600 font-bold" : "text-green-700 font-bold"}>
                {itemInfo.quantity_on_hand}
              </span>
            </span>
          </div>
          {itemInfo.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-1">{itemInfo.description}</div>
          )}
          {itemInfo.quantity_on_hand < quantity && (
            <div className="text-xs text-red-600 mt-1 font-medium">
              Warning: Quantity exceeds available stock!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeductionItem;
