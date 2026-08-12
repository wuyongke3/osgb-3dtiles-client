import axios from "axios";

const axios_video_service = axios.create({
  baseURL: "",
  timeout: 10000,
});

export default axios_video_service;
