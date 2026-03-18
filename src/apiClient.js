import axios from "axios";

let API_BASE = "";
let API_KEY = "";

export const initPlugin = (config) => {
  API_BASE = config.apiUrl;
  API_KEY = config.apiKey;
};

export const apiClient = () => {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY
    }
  });
};