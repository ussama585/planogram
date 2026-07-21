import * as Yup from 'yup';

const productSchema = Yup.object().shape({
  name: Yup.string().trim().required('Product name is required').min(2, 'Product name must be at least 2 characters'),
  category: Yup.string().trim().required('Category is required'),
  brand: Yup.string().trim().required('Brand is required'),
  sku: Yup.string().trim().required('SKU is required').min(2, 'SKU must be at least 2 characters'),
  price: Yup.number().typeError('Price must be a number').required('Price is required').min(0, 'Price must be greater than or equal to 0'),
  description: Yup.string().trim().optional(),
  stock: Yup.number().typeError('Stock must be a number').required('Stock is required').min(0, 'Stock must be greater than or equal to 0')
});

export default productSchema;
