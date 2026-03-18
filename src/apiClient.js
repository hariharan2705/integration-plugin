import axios from "axios";

let API_KEY = "";

export const initPlugin = (config) => {
  API_KEY = config.apiKey;
};

export const apiClient = () => {
  return axios.create({
    baseURL: "http://156.67.110.83:9080/gateways/",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY
    }
  });
};