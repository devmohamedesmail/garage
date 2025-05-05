"use client";

import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = "max-w-2xl",
  size,
  className = ""
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  
  // Simplify the width class logic
  let widthClass = size === "full" ? "max-w-[95vw]" : maxWidth;

  // Handler to prevent modal from closing when clicking inside the modal content
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Add onClick handler to the outer container to close modal when clicking background
    <div className="fixed inset-0 z-[1000] overflow-auto bg-gray-500 bg-opacity-75 flex items-center justify-center" onClick={onClose}>
      <div className="flex justify-center items-center min-h-screen w-full">
        <div 
          onClick={handleModalContentClick}  // Stop propagation to prevent closing when clicking modal content
          className={`bg-white rounded-lg shadow-xl ${widthClass} ${className} w-full mx-auto`}
          style={{ maxHeight: '90vh' }}
        >
          {title && (
            <div className="sticky top-0 z-10 flex justify-between items-center bg-gray-100 px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              > 
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6 overflow-auto" style={{ maxHeight: title ? 'calc(90vh - 4rem)' : '90vh' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
