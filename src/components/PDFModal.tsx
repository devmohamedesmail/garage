
// component/PDFModal.tsx 
/*
 * Modal for opening PDFs in the same page (IE without needing to download it)
 * This component is used to display a PDF in a modal when the user clicks on a button in the invoice table
 * It uses an iframe to display the PDF and provides a download link
 * Client Side rendering
 * Bashir
*/

"use client";
import React from "react";
import { Button } from "@/components/ui/button";

interface PdfModalProps {
  pdfUrl: string;
  onClose: () => void;
}

const PdfModal: React.FC<PdfModalProps> = ({ pdfUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      {/* Modal container */}
      <div className="relative flex flex-col w-full max-w-5xl h-[90vh] bg-white rounded-lg shadow-xl">
        
        {/* Header: title, external link, close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Invoice PDF</h2>
          <div className="flex items-center space-x-4">
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Open in External Viewer
            </a>
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          </div>
        </div>

        {/* Iframe container */}
        <div className="flex-1 overflow-auto">
          <iframe
            src={pdfUrl}
            title="Invoice PDF Preview"
            className="w-full h-full"
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
