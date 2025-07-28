import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ3ODU3ODE5LCJpYXQiOjE3NDcyNTMwMTksImp0aSI6ImYxYzI5OWI4M2U0NTQwNDJiODU0Mzg1NDY4MDIxYzc4IiwidXNlcl9pZCI6Mn0.kjuprBH5vyOQmpVk40tNftiwzZk8sp9b9sXlAyIhvRY");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
