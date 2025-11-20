import axios from "axios";
import storage from "@/services/storage";
import config from "@/config";

// Create a global Axios instance
const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include Authorization header
api.interceptors.request.use((request) => {
  const token = storage.getToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

export default api;
