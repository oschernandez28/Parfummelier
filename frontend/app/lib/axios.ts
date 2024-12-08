// lib/axios.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    // You might want to add authentication headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for debugging
// api.interceptors.response.use(
//   (response) => {
//     console.log("API Response:", {
//       url: response.config.url,
//       status: response.status,
//       headers: response.headers,
//     });
//     return response;
//   },
//   (error) => {
//     console.error("API Error:", {
//       url: error.config?.url,
//       status: error.response?.status,
//       data: error.response?.data,
//     });
//     return Promise.reject(error);
//   },
// );
