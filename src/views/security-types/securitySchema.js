import * as Yup from 'yup';

const securitySchema = Yup.object().shape({
  name: Yup.string().trim().required('Name is required').min(2, 'Name must be at least 2 characters'),
});

export default securitySchema;
