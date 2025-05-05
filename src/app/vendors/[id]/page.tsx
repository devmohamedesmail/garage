"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/services/api"; // Import the API service

interface Vendor {
  vendor_id: number;
  vendor_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

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
}

export default function VendorDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  // State for Vendor details
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loadingVendor, setLoadingVendor] = useState<boolean>(true);
  // State for updating the comment field
  const [updatedComment, setUpdatedComment] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // State for items provided by the vendor
  const [vendorItems, setVendorItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);

  // Fetch vendor details
  useEffect(() => {
    if (!id) return;
    const fetchVendor = async () => {
      try {
        const response = await api.get(`/vendors/${id}`);
        const data: Vendor = response.data;
        setVendor(data);
        // Prepopulate the comment update area
        setUpdatedComment(data.comment || "");
        setLoadingVendor(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch vendor details");
        setLoadingVendor(false);
      }
    };
    fetchVendor();
  }, [id]);

  // Fetch items provided by the vendor
  useEffect(() => {
    if (!id) return;
    const fetchVendorItems = async () => {
      try {
        const response = await api.get(`/items/by_vendor/${id}`);
        const data: Item[] = response.data;
        setVendorItems(data);
        setLoadingItems(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch items provided by vendor");
        setLoadingItems(false);
      }
    };
    fetchVendorItems();
  }, [id]);

  // Handler for updating the vendor comment
  const handleUpdateComment = async () => {
    if (!vendor) return;
    try {
      const response = await api.put(`/vendors/${vendor.vendor_id}`, {
        vendor_name: vendor.vendor_name,
        contact_person: vendor.contact_person,
        phone: vendor.phone,
        email: vendor.email,
        address: vendor.address,
        comment: updatedComment
      });
      
      setMessage("Comment updated successfully");
      
      // Optionally refetch vendor details to update the UI
      const updatedResponse = await api.get(`/vendors/${vendor.vendor_id}`);
      const updatedVendor: Vendor = updatedResponse.data;
      setVendor(updatedVendor);
      setUpdatedComment(updatedVendor.comment || "");
    } catch (err: any) {
      setError(err.message || "Failed to update vendor comment");
    }
  };

  // Handler for changes to the comment text area
  const handleCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUpdatedComment(e.target.value);
  };

  // Handler for clicking an item row – navigate to the item details page
  const handleItemClick = (itemId: number) => {
    router.push(`/inventory/${itemId}`);
  };

  if (loadingVendor) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <p className="text-xl animate-pulse">Loading vendor details...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-xl text-center mt-10">{error}</p>;
  }

  if (!vendor) {
    return <p className="text-xl text-center mt-10">Vendor not found.</p>;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline text-lg"
        >
          &larr; Back
        </button>
      </div>

      {/* Vendor Details */}
      <div className="w-full px-4 md:px-10 flex-grow">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full mb-10">
          <h1 className="text-4xl font-bold mb-6 text-gray-800">
            {vendor.vendor_name}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-700 uppercase">Contact Person</p>
              <p className="text-2xl font-semibold text-gray-800">
                {vendor.contact_person || "Not specified"}
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-700 uppercase">Phone</p>
              <p className="text-2xl font-semibold text-gray-800">
                {vendor.phone || "Not specified"}
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-700 uppercase">Email</p>
              <p className="text-2xl font-semibold text-gray-800">
                {vendor.email || "Not specified"}
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-sm text-blue-700 uppercase">Address</p>
              <p className="text-2xl font-semibold text-gray-800">
                {vendor.address || "Not specified"}
              </p>
            </div>
          </div>

          {/* Comment Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Vendor Comment
            </h2>
            <textarea
              value={updatedComment}
              onChange={handleCommentChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              rows={4}
              placeholder="Enter vendor comment here..."
            ></textarea>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpdateComment}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition-colors"
              >
                Update Comment
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              <span className="font-medium">Created:</span>{" "}
              {new Date(vendor.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Updated:</span>{" "}
              {new Date(vendor.updated_at).toLocaleString()}
            </p>
          </div>
          
          {/* Message/Error */}
          {message && <p className="mt-4 text-green-600 font-medium text-center">{message}</p>}
          {error && <p className="mt-4 text-red-600 font-medium text-center">{error}</p>}
        </div>

        {/* Items Provided by Vendor */}
        <div className="bg-white rounded-lg shadow-lg p-8 w-full">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Items Provided by {vendor.vendor_name}
          </h2>
          {loadingItems ? (
            <p className="text-center">Loading items...</p>
          ) : vendorItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendorItems.map((item) => (
                    <tr
                      key={item.item_id}
                      onClick={() => router.push(`/inventory/${item.item_id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">{item.item_name}</td>
                      <td className="px-4 py-3">{item.item_type}</td>
                      <td className="px-4 py-3">${Number(item.cost_price).toFixed(2)}</td>
                      <td className="px-4 py-3">{item.quantity_on_hand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center">No items found for this vendor.</p>
          )}
        </div>
      </div>
    </div>
  );
}
