import * as Yup from 'yup';

const categorySchema = Yup.object().shape({
  name: Yup.string().trim().required('Category name is required').min(2, 'Category name must be at least 2 characters'),
});

export default categorySchema;
