/**
 * Environment configuration utility
 * Centralizes access to environment variables with fallback values
 */

export const envConfig = {
  // API URL - defaults to localhost:3000/api if not set in environment
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  
  // App URL - defaults to localhost:3001 if not set in environment
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
};

export default envConfig;