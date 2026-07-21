import * as Yup from 'yup';

const brandSchema = Yup.object().shape({
  name: Yup.string().trim().required('Brand name is required').min(2, 'Brand name must be at least 2 characters'),
});

export default brandSchema;
