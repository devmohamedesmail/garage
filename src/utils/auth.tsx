import { jwtDecode } from "jwt-decode";

export const getUserRole = (): string | null => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded.roleName; // Assuming role is stored as "roleName" in JWT
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }
  return null;
};
