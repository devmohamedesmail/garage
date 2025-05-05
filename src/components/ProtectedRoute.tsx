"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "../utils/auth";

type ProtectedRouteProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const role = getUserRole();

  useEffect(() => {
    if (!role || !allowedRoles.includes(role)) {
      router.push("/unauthorized"); // Redirect if role is not allowed
    } else {
      setLoading(false); // Allow rendering if role is valid
    }
  }, [role, router, allowedRoles]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
