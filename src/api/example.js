import useAxios from './useAxios';

export const fetchExampleData = async () => {
  const axiosInstance = useAxios();
  return axiosInstance.get('/users');
};
