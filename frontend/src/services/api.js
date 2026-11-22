import axios from "axios";

const api = axios.create({
  baseURL: "https://retail-ai-hl03.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
