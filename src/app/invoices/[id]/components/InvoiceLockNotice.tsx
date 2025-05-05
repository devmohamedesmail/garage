import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InvoiceLockNoticeProps {
  onRequestEditAccess: () => void;
  hasActiveEditCase: boolean;
  editCaseStatus?: string;
  editCaseNumber?: string;
}

export default function InvoiceLockNotice({ 
  onRequestEditAccess, 
  hasActiveEditCase, 
  editCaseStatus, 
  editCaseNumber 
}: InvoiceLockNoticeProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col items-center text-center py-4">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 w-full max-w-2xl mx-auto">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <h2 className="text-2xl font-bold text-yellow-700 mb-4">Invoice Locked</h2>
          
          <p className="mb-6 text-yellow-700 text-lg">
            This invoice is currently locked for editing. To make changes, you need to request edit access.
          </p>
          
          {!hasActiveEditCase ? (
            <div>
              <Button 
                onClick={onRequestEditAccess} 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 text-lg"
              >
                Request Edit Access
              </Button>
              <p className="text-sm mt-2 text-gray-600">
                This will create a case for admin approval
              </p>
            </div>
          ) : (
            <div className={`p-4 rounded ${
              editCaseStatus === 'approved' ? 
                'bg-green-100 border border-green-300 text-green-800' : 
                'bg-blue-100 border border-blue-300 text-blue-800'
            }`}>
              <div className="font-bold mb-1">
                {editCaseStatus === 'approved' ? 
                  'Your edit request has been approved!' : 
                  'Edit request is pending approval'
                }
              </div>
              <p>
                {editCaseStatus === 'approved' ? 
                  'You can now edit this invoice. When you finish making changes, please re-lock the invoice.' : 
                  `Your request to edit this invoice (Case #${editCaseNumber}) is currently ${editCaseStatus}. Please wait for admin approval.`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}