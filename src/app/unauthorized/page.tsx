"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const UnauthorizedPage = () => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/login"); // Redirect to login after 5 seconds
    }, 5000);
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold text-red-500">Unauthorized Access</h2>
        <p className="mt-2">You do not have permission to view this page.</p>
        <p className="mt-2 text-sm">Redirecting to login...</p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
