import * as Yup from 'yup';

const recordSchema = Yup.object({
  region: Yup.string().required('Region is required'),
  store: Yup.string().required('Store is required'),
  table_type: Yup.string().required('Table type is required'),
  product: Yup.string().required('Product is required'),
  security_type: Yup.string().required('Security type is required'),
  table_number: Yup.number()
    .typeError('Table number must be a number')
    .integer('Table number must be an integer')
    .min(1, 'Table number must be at least 1')
    .required('Table number is required'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .integer('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .required('Quantity is required'),
  keyboard: Yup.string().nullable(),
  pen: Yup.string().nullable()
});

export default recordSchema;
