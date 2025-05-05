import React from 'react';
import { FaTimes, FaBarcode, FaUserShield, FaList, FaSave } from 'react-icons/fa';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal = ({ onClose }: HelpModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Storage Room Help Guide</h2>
          <button 
            onClick={onClose}
            className="bg-blue-700 hover:bg-blue-800 rounded-full p-2"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">How to Use This Page</h3>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3 bg-blue-50 p-3 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-3">
                <FaUserShield size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Step 1: Enter Staff Code</h4>
                <p>Enter your staff code in the first box. This is required to continue.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3 bg-blue-50 p-3 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-3">
                <FaBarcode size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Step 2: Scan Items or Add Manually</h4>
                <p>Use a barcode scanner to scan items, or click "Add Another Item" to enter them manually.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3 bg-blue-50 p-3 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-3">
                <FaList size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Step 3: Adjust Quantities</h4>
                <p>If needed, change the quantity for each item. You can also remove items by clicking the trash icon.</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3 bg-blue-50 p-3 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-3">
                <FaSave size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Step 4: Complete Deduction</h4>
                <p>When you're done, click the "Deduct Items" button to submit.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-bold text-lg text-yellow-800">Need Help?</h4>
            <p className="text-yellow-800">If you have any issues, please contact the supervisor.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
