import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const loginUser = async (payload) => {
  const response = await axios.post(`${baseURL}api/accounts/login`, payload);
  console.log(response,"responseresponse")
  return response?.data?.data;
};
