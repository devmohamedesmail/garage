import React, { useState, ChangeEvent, FormEvent } from "react";
import api from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InvoiceImagesProps {
  invoiceId: number;
  images: string[];
  onImagesUpdated: (newImages: string[]) => void;
}

export default function InvoiceImages({ invoiceId, images, onImagesUpdated }: InvoiceImagesProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload image
  const handleImageUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("invoice_id", String(invoiceId));

    try {
      const res = await api.post(
        `/invoices/${invoiceId}/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("Image uploaded successfully.");
      // Update parent component with new image
      if (res.data.imageUrl) {
        onImagesUpdated([...images, res.data.imageUrl]);
      } else {
        const updatedInvoice = await api.get(`/invoices/${invoiceId}`);
        const inv = updatedInvoice.data;
        if (inv.images && inv.images.trim().length > 0) {
          const imgs = inv.images.split(",").map((img: string) => img.trim());
          onImagesUpdated(imgs);
        }
      }
    } catch (err) {
      alert("Failed to upload image.");
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Invoice Images</h2>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((imgUrl, index) => (
            <img
              key={index}
              src={imgUrl}
              alt={`Invoice Image ${index + 1}`}
              className="w-full h-auto object-cover rounded shadow"
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No images uploaded yet.</p>
      )}
      <form onSubmit={handleImageUpload} className="mt-4 flex items-center space-x-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-200 hover:file:bg-gray-300 file:cursor-pointer"
        />
        <Button type="submit">Upload</Button>
      </form>
    </Card>
  );
}