import * as Yup from 'yup';

const loginSchema = Yup.object().shape({
  email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: Yup.string().trim().min(6, 'Password must be at least 6 characters').required('Password is required')
});

export default loginSchema;
