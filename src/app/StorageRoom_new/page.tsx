"use client";

import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { FaBoxOpen, FaQuestionCircle, FaCheck } from "react-icons/fa";
import StaffCodeInput from "./components/StaffCodeInput";
import ScannerInput from "./components/ScannerInput";
import DeductionsList from "./components/DeductionsList";
import FeedbackMessage from "./components/FeedbackMessage";
import SummaryPanel from "./components/SummaryPanel";
import HelpModal from "./components/HelpModal";
import api from "@/services/api";

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

export default function StorageRoomDeductionPage() {
  const router = useRouter();

  const [staffCode, setStaffCode] = useState<string>("");
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastScannedIndex, setLastScannedIndex] = useState<number | null>(null);
  const [loadingSerials, setLoadingSerials] = useState<Record<string, boolean>>({});
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  const fetchItemInfo = async (serialNumber: string, index: number) => {
    setLoadingSerials((prev) => ({ ...prev, [serialNumber]: true }));

    try {
      const res = await api.get(`/items/serial/${serialNumber}`);

      if (!res.status || res.status >= 400) {
        if (index >= 0 && index < deductions.length) {
          setDeductions((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index].itemInfo = undefined;
            }
            return updated;
          });
        }

        setError(`Could not find item: ${serialNumber}`);
        setTimeout(() => setError(""), 3000);
        setLoadingSerials((prev) => ({ ...prev, [serialNumber]: false }));
        return;
      }

      try {
        const data = res.data;

        if (index >= 0 && index < deductions.length) {
          setDeductions((prev) => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index].itemInfo = data;
            }
            return updated;
          });
        }
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        setError("Invalid response format from server");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err: any) {
      console.error("Error fetching item info:", err);
      setError(`Connection error: ${err.message}`);
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoadingSerials((prev) => ({ ...prev, [serialNumber]: false }));
    }
  };

  const handleScanBlur = () => {
    setTimeout(() => {
      if (document.activeElement?.id !== "staffCodeInput") {
        scanInputRef.current?.focus();
      }
    }, 100);
  };

  const handleAddRow = () => {
    setDeductions((prev) => [...prev, { serial_number: "", quantity: 1 }]);
  };

  const handleDeductionChange = (
    index: number,
    field: "serial_number" | "quantity",
    value: string
  ) => {
    setDeductions((prev) => {
      const updated = [...prev];
      if (field === "serial_number") {
        updated[index].serial_number = value;
        if (value.trim()) {
          const serialNumber = value.trim();
          const timer = setTimeout(() => {
            fetchItemInfo(serialNumber, index);
          }, 500);
          return updated;
        } else {
          updated[index].itemInfo = undefined;
        }
      } else {
        updated[index].quantity = +value;
      }
      return updated;
    });
  };

  const handleSerialKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const serialNumber = deductions[index].serial_number.trim();
      if (serialNumber) {
        fetchItemInfo(serialNumber, index);
      }
    }
  };

  const handleRemoveRow = (index: number) => {
    setDeductions((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleScanKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!scanInputRef.current || scanInputRef.current.value == null) {
        return;
      }

      const scannedSerial = scanInputRef.current.value.trim();
      if (!scannedSerial) return;

      scanInputRef.current.value = "";

      const existingIndex = deductions.findIndex(
        (d) => d.serial_number.toLowerCase() === scannedSerial.toLowerCase()
      );

      if (existingIndex > -1) {
        setDeductions((prev) => {
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        });
        setLastScannedIndex(existingIndex);
      } else {
        setDeductions((prev) => [
          ...prev,
          { serial_number: scannedSerial, quantity: 1 },
        ]);
        const newIndex = deductions.length;
        setLastScannedIndex(newIndex);
        fetchItemInfo(scannedSerial, newIndex);
      }

      setError("");
      setMessage("Item scanned successfully");

      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  const handleSubmitWithConfirmation = (e: FormEvent) => {
    e.preventDefault();
    if (deductions.length === 0) {
      setError("No items to deduct. Please scan or add at least one item.");
      return;
    }
    setShowConfirmation(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirmation(false);

    setError("");
    setMessage("");
    setIsSubmitting(true);

    if (!staffCode.trim()) {
      setError("Please enter your staff code.");
      setIsSubmitting(false);
      return;
    }

    for (let i = 0; i < deductions.length; i++) {
      if (!deductions[i].serial_number.trim()) {
        setError(`Row ${i + 1}: Serial number is empty.`);
        setIsSubmitting(false);
        return;
      }
      if (deductions[i].quantity < 1) {
        setError(
          `Row ${i + 1}: Quantity must be at least 1 (currently ${deductions[i].quantity}).`
        );
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await api.post("/items/deduct_batch", {
        staff_code: staffCode,
        items: deductions,
      });

      if (res.status >= 400) {
        throw new Error(res.data?.error || "Failed to deduct items.");
      }

      setMessage(res.data?.message || "Items deducted successfully!");

      setDeductions([]);
      setStaffCode("");
    } catch (err: any) {
      setError(err.message || "Failed to deduct items.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotals = () => {
    const totalItems = deductions.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = deductions.reduce((sum, item) => {
      const price = item.itemInfo?.cost_price || 0;
      return sum + (price * item.quantity);
    }, 0);

    return { totalItems, totalValue };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FaBoxOpen className="text-3xl" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  Storage Room - Batch Deduction
                </h1>
              </div>
              <button
                onClick={() => setShowHelp(true)}
                className="bg-blue-700 hover:bg-blue-800 p-2 rounded-full text-white"
                aria-label="Show help"
              >
                <FaQuestionCircle size={24} />
              </button>
            </div>
          </div>

          <ScannerInput
            inputRef={scanInputRef}
            onKeyDown={handleScanKeyDown}
            onBlur={handleScanBlur}
          />

          <form onSubmit={handleSubmitWithConfirmation} className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <StaffCodeInput
                  staffCode={staffCode}
                  onChange={setStaffCode}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-800 mb-2 text-lg">How to Use:</h3>
                  <ol className="text-blue-700 list-decimal list-inside space-y-2">
                    <li className="text-base">Enter your staff code above</li>
                    <li className="text-base">Scan each item's barcode or add items manually</li>
                    <li className="text-base">Adjust quantities if needed</li>
                    <li className="text-base">Click "Deduct Items" when finished</li>
                  </ol>
                </div>

                <SummaryPanel {...calculateTotals()} />

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-medium transition-colors
                      ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-700"}`}
                  >
                    {isSubmitting ? "Processing..." : (
                      <span className="flex items-center justify-center gap-2">
                        <FaCheck /> Deduct Items
                      </span>
                    )}
                  </button>
                </div>

                <FeedbackMessage message={message} error={error} />
              </div>

              <div>
                <DeductionsList
                  deductions={deductions}
                  onDeductionChange={handleDeductionChange}
                  onRemoveRow={handleRemoveRow}
                  onAddRow={handleAddRow}
                  lastScannedIndex={lastScannedIndex}
                  loadingSerials={loadingSerials}
                  onSerialKeyDown={handleSerialKeyDown}
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Deduction</h3>
            <p className="mb-6">
              Are you sure you want to deduct {deductions.length} items from the storage room?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
