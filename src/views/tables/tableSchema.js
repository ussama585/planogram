import * as Yup from 'yup';

const tableSchema = Yup.object().shape({
  name: Yup.string().trim().required('Table name is required').min(2, 'Table name must be at least 2 characters'),
  description: Yup.string().trim().required('Description is required').min(5, 'Description must be at least 5 characters')
});

export default tableSchema;
