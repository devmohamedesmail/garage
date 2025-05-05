"use client";

import { useEffect, useState, ChangeEvent, FormEvent, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import JsBarcode from "jsbarcode";
import api from "../../../services/api";

// -------------------------
// INTERFACES
// -------------------------
interface Item {
  item_id: number;
  item_name: string;
  item_type: string;
  description: string;
  cost_price: number;
  quantity_on_hand: number;
  reorder_level: number;
  reorder_quantity: number;
  vendor_id: number | null;
  serial_number?: string | null;
}

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------
// MAIN COMPONENT
// -------------------------
export default function ItemDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  // Item state
  const [item, setItem] = useState<Item | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  // Edit mode states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<Item>>({});

  // Vendor list (for edit mode dropdown)
  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(true);

  // Barcode related states
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const [barcodeGenerated, setBarcodeGenerated] = useState<boolean>(false);

  // -------------------------
  // FETCH ITEM DETAILS
  // -------------------------
  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        const res = await api.get(`/items/${id}`);
        const data: Item = res.data;
        setItem(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  // -------------------------
  // FETCH VENDOR NAME IF APPLICABLE
  // -------------------------
  useEffect(() => {
    const fetchVendorName = async () => {
      if (item?.vendor_id) {
        try {
          const res = await api.get(`/vendors/${item.vendor_id}`);
          const vendorData: Vendor = res.data;
          setVendorName(vendorData.vendor_name);
        } catch (err: any) {
          console.error("Error fetching vendor name:", err.message);
          setVendorName("Not specified");
        }
      }
    };
    fetchVendorName();
  }, [item]);

  // -------------------------
  // FETCH VENDOR LIST FOR EDIT DROPDOWN
  // -------------------------
  useEffect(() => {
    const fetchVendorList = async () => {
      try {
        const res = await api.get("/vendors?limit=100");
        // Assumes endpoint returns { vendors: Vendor[], totalPages: number }
        setVendorList(res.data.vendors);
        setLoadingVendors(false);
      } catch (err: any) {
        console.error("Error fetching vendor list:", err.message);
        setLoadingVendors(false);
      }
    };
    fetchVendorList();
  }, []);

  // -------------------------
  // DEDUCT ONE ITEM HANDLER (using new endpoint)
  // -------------------------
  const handleDeductItem = async () => {
    if (!item) return;
    if (item.quantity_on_hand <= 0) {
      setMessage("Item is out of stock and cannot be deducted further.");
      return;
    }
    try {
      const res = await api.post(`/items/${item.item_id}/deduct`, { 
        notes: "Deducted via UI" 
      });
      setItem({ ...item, quantity_on_hand: res.data.new_quantity });
      setMessage("One item deducted successfully.");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // -------------------------
  // EDIT MODE HANDLERS
  // -------------------------
  const handleEdit = () => {
    if (item) {
      setEditFormData({ ...item });
      setIsEditing(true);
      setMessage("");
      setError(null);
    }
  };

  const handleEditInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      const res = await api.put(`/items/${item.item_id}`, {
        item_name: editFormData.item_name,
        item_type: editFormData.item_type,
        description: editFormData.description,
        cost_price: Number(editFormData.cost_price),
        quantity_on_hand: Number(editFormData.quantity_on_hand),
        reorder_level: Number(editFormData.reorder_level),
        reorder_quantity: Number(editFormData.reorder_quantity),
        vendor_id: editFormData.vendor_id ? Number(editFormData.vendor_id) : null,
      });
      setMessage("Item updated successfully.");
      setItem((prev) =>
        prev
          ? {
              ...prev,
              item_name: editFormData.item_name || prev.item_name,
              item_type: editFormData.item_type || prev.item_type,
              description: editFormData.description || prev.description,
              cost_price: Number(editFormData.cost_price) || prev.cost_price,
              quantity_on_hand: Number(editFormData.quantity_on_hand) || prev.quantity_on_hand,
              reorder_level: Number(editFormData.reorder_level) || prev.reorder_level,
              reorder_quantity: Number(editFormData.reorder_quantity) || prev.reorder_quantity,
              vendor_id: editFormData.vendor_id ? Number(editFormData.vendor_id) : prev.vendor_id,
            }
          : null
      );
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
    setMessage("");
    setError(null);
  };

  // -------------------------
  // BARCODE HANDLERS
  // -------------------------
  const handleGenerateBarcode = () => {
    if (!item || !item.serial_number) {
      setError("No serial number provided for this item.");
      return;
    }
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, item.serial_number, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 80,
      });
      setMessage("Barcode generated successfully.");
    }
  };

  const handleDownloadBarcode = () => {
    if (barcodeRef.current) {
      const dataURL = barcodeRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `${item?.serial_number || "barcode"}.png`;
      link.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl animate-pulse">Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-500 text-xl text-center mt-10">{error}</p>
    );
  }

  if (!item) {
    return <p className="text-xl text-center mt-10">No item found.</p>;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Navigation / Back Button */}
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline text-lg"
        >
          &larr; Back
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full p-6">
        <div className="bg-white rounded-lg shadow-md p-8 w-full">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-800">
              {item.item_name}
            </h2>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block font-medium">Item Name</label>
                <input
                  type="text"
                  name="item_name"
                  value={editFormData.item_name ?? ""}
                  onChange={handleEditInputChange}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Item Type</label>
                <input
                  type="text"
                  name="item_type"
                  value={editFormData.item_type ?? ""}
                  onChange={handleEditInputChange}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block font-medium">Description</label>
                <textarea
                  name="description"
                  value={editFormData.description ?? ""}
                  onChange={handleEditInputChange}
                  className="mt-1 p-2 border rounded w-full"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost_price"
                    value={editFormData.cost_price?.toString() ?? ""}
                    onChange={handleEditInputChange}
                    className="mt-1 p-2 border rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Quantity on Hand</label>
                  <input
                    type="number"
                    name="quantity_on_hand"
                    value={editFormData.quantity_on_hand?.toString() ?? ""}
                    onChange={handleEditInputChange}
                    className="mt-1 p-2 border rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Reorder Level</label>
                  <input
                    type="number"
                    name="reorder_level"
                    value={editFormData.reorder_level?.toString() ?? ""}
                    onChange={handleEditInputChange}
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>
                <div>
                  <label className="block font-medium">Reorder Quantity</label>
                  <input
                    type="number"
                    name="reorder_quantity"
                    value={editFormData.reorder_quantity?.toString() ?? ""}
                    onChange={handleEditInputChange}
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium">Vendor</label>
                <select
                  name="vendor_id"
                  value={editFormData.vendor_id?.toString() || ""}
                  onChange={handleEditInputChange}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">-- Select Vendor --</option>
                  {loadingVendors ? (
                    <option>Loading vendors...</option>
                  ) : (
                    vendorList.map((vendor) => (
                      <option key={vendor.vendor_id} value={vendor.vendor_id}>
                        {vendor.vendor_name}
                      </option>
                    ))
                  )
                }
                </select>
              </div>
              {/* Edit Form Buttons */}
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-gray-600 mb-6 text-lg">
                <span className="font-semibold">Type:</span> {item.item_type}
              </p>

              {/* Description Section */}
              <div className="mb-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h3 className="text-xl font-semibold mb-2 text-blue-800">
                  Description
                </h3>
                <p className="text-gray-700 text-base">
                  {item.description || "No description provided."}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Cost Price */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                  <p className="text-sm text-gray-500 uppercase">Cost Price</p>
                  <p className="text-xl font-semibold text-gray-800">
                    ${Number(item.cost_price).toFixed(2)}
                  </p>
                </div>
                {/* Quantity on Hand */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                  <p className="text-sm text-gray-500 uppercase">Quantity on Hand</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {item.quantity_on_hand}
                  </p>
                </div>
                {/* Reorder Level */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                  <p className="text-sm text-gray-500 uppercase">Reorder Level</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {item.reorder_level}
                  </p>
                </div>
                {/* Reorder Quantity */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                  <p className="text-sm text-gray-500 uppercase">Reorder Qty</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {item.reorder_quantity}
                  </p>
                </div>
                {/* Vendor */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                  <p className="text-sm text-gray-500 uppercase">Vendor</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {vendorName || "Not specified"}
                  </p>
                </div>
                {/* Serial Number */}
                <div className="bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                  <p className="text-sm text-gray-500 uppercase">Serial Number</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {item.serial_number || "Not provided"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <button
                  onClick={handleDeductItem}
                  className="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition-colors"
                >
                  Deduct One Item
                </button>
                <button
                  onClick={handleGenerateBarcode}
                  className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition-colors"
                >
                  Generate Barcode
                </button>
              </div>

              {/* Barcode Canvas and Download Button */}
              {item.serial_number && (
                <div className="mt-6">
                  <canvas ref={barcodeRef} className="border border-gray-300 mx-auto"></canvas>
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={handleDownloadBarcode}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Download Barcode
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Message Section */}
          {message && (
            <p className="mt-4 text-green-600 font-medium text-center">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 text-red-600 font-medium text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
