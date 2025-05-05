import axios from 'axios';

// Set default base URL from environment variable
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://gms-api-k646.onrender.com';

const garageApi = axios.create({
  baseURL: baseURL,
  timeout: 15000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Export API with methods and defaults
const api = {
  // Methods
  get: garageApi.get.bind(garageApi),
  post: garageApi.post.bind(garageApi),
  put: garageApi.put.bind(garageApi),
  delete: garageApi.delete.bind(garageApi),
  patch: garageApi.patch.bind(garageApi),
  
  // Add defaults object with baseURL
  defaults: {
    baseURL: baseURL
  }
};

export default api;
