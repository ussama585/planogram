import * as Yup from 'yup';

const regionSchema = Yup.object().shape({
  name: Yup.string().trim().required('Region name is required').min(2, 'Region name must be at least 2 characters'),
  description: Yup.string().trim().required('Description is required').min(5, 'Description must be at least 5 characters')
});

export default regionSchema;
