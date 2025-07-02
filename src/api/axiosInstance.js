import axios from "axios";

const axiosInstance = axios.create({
  // baseURL: "http://localhost:3000",
  baseURL: "https://quizapi.hizkiajonathanbudiana.my.id",
  withCredentials: true,
});

export default axiosInstance;
