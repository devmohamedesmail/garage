"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "../Common/Modal";
import JsBarcode from "jsbarcode";
import { FiDownload, FiPrinter } from "react-icons/fi";

interface BarcodeDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    item_id?: number | string;
    item_name: string;
    serial_number?: string;
  } | null;
}

export default function BarcodeDisplayModal({
  isOpen,
  onClose,
  item
}: BarcodeDisplayModalProps) {
  const [error, setError] = useState<string>("");
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  
  // Generate a barcode when the modal opens and an item is available
  useEffect(() => {
    if (isOpen && item && barcodeRef.current) {
      try {
        // Use serial number if available
        const barcodeValue = item.serial_number;
        
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          height: 80,
          text: `${barcodeValue}`
        });
        
        setBarcodeGenerated(true);
        setError("");
      } catch (err) {
        console.error("Error generating barcode:", err);
        setError("Could not generate barcode. Please check the item information.");
        setBarcodeGenerated(false);
      }
    }
  }, [isOpen, item]);

  // Download barcode as PNG
  const handleDownloadBarcode = () => {
    if (barcodeRef.current) {
      const dataURL = barcodeRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      const fileName = item?.serial_number || `item-${item?.item_id}`;
      link.download = `barcode-${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Print barcode
  const handlePrintBarcode = () => {
    if (barcodeRef.current) {
      const dataURL = barcodeRef.current.toDataURL("image/png");
      const windowContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                text-align: center;
                font-family: Arial, sans-serif;
              }
              .barcode-container {
                margin: 20px auto;
              }
              .item-info {
                font-size: 14px;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="item-info">
                <strong>${item?.item_name || 'Unknown Item'}</strong>
                <br/>
                ID: ${item?.item_id || 'N/A'} 
                ${item?.serial_number ? `<br/>Serial: ${item.serial_number}` : ''}
              </div>
              <img src="${dataURL}" alt="Barcode" />
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(windowContent);
        printWindow.document.close();
      } else {
        alert("Please allow pop-ups to print the barcode");
      }
    }
  };

  if (!item) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Item Barcode" 
      maxWidth="max-w-md"
    >
      <div className="p-2">
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Item Created Successfully!</h3>
          <p className="text-sm text-blue-600">
            Item <strong>{item.item_name}</strong> has been added to your inventory.
            {item.item_id && <> (ID: {item.item_id})</>}
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 p-4 rounded-md mb-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="flex justify-center my-6">
              <canvas ref={barcodeRef} className="border border-gray-300 p-2 bg-white"></canvas>
            </div>
            
            <div className="text-center text-gray-500 text-sm mb-4">
              {item.serial_number ? (
                <p>Barcode generated using serial number: <strong>{item.serial_number}</strong></p>
              ) : (
                <p>Barcode generated using item ID: <strong>{item.item_id}</strong></p>
              )}
            </div>

            <div className="flex space-x-3 justify-center mt-4">
              <button
                onClick={handleDownloadBarcode}
                disabled={!barcodeGenerated}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <FiDownload className="mr-2" />
                Download
              </button>
              <button
                onClick={handlePrintBarcode}
                disabled={!barcodeGenerated}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <FiPrinter className="mr-2" />
                Print
              </button>
            </div>
          </>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}