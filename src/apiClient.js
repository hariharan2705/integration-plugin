import axios from "axios";

export let API_KEY = "";

export const initPlugin = (config) => {
  if (!config?.apiKey) {
    throw new Error("apiKey is required");
  }

  API_KEY = config.apiKey;
};

export const apiClient = () => {
  if (!API_KEY) {
    throw new Error("Plugin not initialized. Call initPlugin() first.");
  }

  return axios.create({
    baseURL: "http://156.67.110.83:9080/gateways",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    },
  });
};