import * as Yup from 'yup';

const storeSchema = Yup.object().shape({
  name: Yup.string().trim().required('Store name is required').min(2, 'Store name must be at least 2 characters'),
  store_code: Yup.string().trim().required('Store code is required').min(2, 'Store code must be at least 2 characters'),
  branch_code: Yup.string().trim().required('Branch code is required').min(2, 'Branch code must be at least 2 characters'),
  region: Yup.string().trim().required('Region is required'),
  city: Yup.string().trim().required('City is required').min(2, 'City must be at least 2 characters'),
  area: Yup.string().trim().required('Area is required').min(2, 'Area must be at least 2 characters')
});

export default storeSchema;
