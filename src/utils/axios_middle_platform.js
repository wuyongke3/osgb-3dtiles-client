import axios from "axios";

const service = axios.create({
  baseURL: "http://10.143.232.53:7004/prod-api/data-governance-web",
  timeout: 10000,
});

export const service9909 = axios.create({
  baseURL: "http://10.143.232.53:9909/dcp-api/api",
  timeout: 10000,
});

export default service;
