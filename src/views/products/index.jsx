import { useMemo, useState } from 'react';
import { Formik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// material-ui
import { IconButton, MenuItem, Select } from '@mui/material';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import useAxios from '../../api/useAxios';
import productSchema from './productSchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

const getOptionName = (option) => {
  if (typeof option === 'string') {
    return option;
  }

  return option?.name || option?.category_name || option?.brand_name || option?.title || '';
};

export default function ProductsPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const api = useAxios();
  const queryClient = useQueryClient();

  const {
    data: productData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['product-list'],
    queryFn: async () => {
      const response = await api.get('/api/inventory/product-list');
      return response.data;
    }
  });

  const { data: categoryOptionsData } = useQuery({
    queryKey: ['category-name-list'],
    queryFn: async () => {
      const response = await api.get('/api/inventory/category-name-list');
      return response.data;
    }
  });

  const { data: brandOptionsData } = useQuery({
    queryKey: ['brand-name-list'],
    queryFn: async () => {
      const response = await api.get('/api/inventory/brand-name-list');
      return response.data;
    }
  });

  const categoryOptions = useMemo(() => {
    if (Array.isArray(categoryOptionsData?.results)) return categoryOptionsData.results;

    return [];
  }, [categoryOptionsData]);

  const brandOptions = useMemo(() => {
    if (Array.isArray(brandOptionsData?.results)) return brandOptionsData.results;

    return [];
  }, [brandOptionsData]);

  const products = useMemo(() => {
    if (Array.isArray(productData)) return productData;
    if (Array.isArray(productData?.results)) return productData.results;
    if (Array.isArray(productData?.data)) return productData.data;

    return [];
  }, [productData]);

  const createProductMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
        category: values.category,
        brand: values.brand,
        sku: values.sku,
        price: values.price,
        description: values.description || '',
        stock: values.stock
      };

      const response = await api.post('/api/inventory/product-create', payload);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-list'] });
      setOpen(false);
      setSelectedProduct(null);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        id: selectedProduct?.id,
        name: values.name,
        category: values.category,
        brand: values.brand,
        sku: values.sku,
        price: values.price,
        description: values.description || '',
        stock: values.stock,
        status: values.status ?? true
      };

      const response = await api.patch(
        `/api/inventory/product-detail/${selectedProduct?.id}`,
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-list'] });
      setOpen(false);
      setSelectedProduct(null);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(`/api/inventory/product-detail/${productId}`);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-list'] });
      setDeleteOpen(false);
      setSelectedProduct(null);
    }
  });

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setOpen(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProduct?.id) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <MainCard
        title="Products"
        secondary={
          <Button variant="contained" onClick={handleOpenCreate}>
            Add Product
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your products, stock, and pricing.
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">
                  Failed to load products: {error?.message || 'Unknown error'}
                </Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {products.length > 0 ? (
                    products.map((product, index) => {
                      const name = product?.name || `Product ${index + 1}`;
                      const sku = product?.sku || '-';
                      const brand = getOptionName(product?.brand) || '-';
                      const category = getOptionName(product?.category) || '-';
                      const status = product?.status ? 'Active' : 'Inactive';

                      return (
                        <TableRow key={product?.id || `${name}-${index}`} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell>{sku}</TableCell>
                          <TableCell>{brand}</TableCell>
                          <TableCell>{category}</TableCell>
                          <TableCell>{status}</TableCell>

                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenEdit(product)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(product)}
                            >
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Stack>
      </MainCard>

      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Product</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{selectedProduct?.name || 'this product'}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedProduct?.name || '',
              category: getOptionName(selectedProduct?.category),
              brand: getOptionName(selectedProduct?.brand),
              sku: selectedProduct?.sku || '',
              price: selectedProduct?.price || '',
              description: selectedProduct?.description || '',
              stock: selectedProduct?.stock || '',
              status: selectedProduct?.status ?? true
            }}
            enableReinitialize
            validationSchema={productSchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedProduct?.id) {
                updateProductMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createProductMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue
            }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="product-name">Name</InputLabel>

                    <OutlinedInput
                      id="product-name"
                      name="name"
                      label="Name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.name && errors.name && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.name}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(touched.category && errors.category)}
                  >
                    <InputLabel id="product-category-label">Category</InputLabel>

                    <Select
                      labelId="product-category-label"
                      id="product-category"
                      name="category"
                      label="Category"
                      value={values.category}
                      onChange={(event) =>
                        setFieldValue('category', event.target.value)
                      }
                      onBlur={handleBlur}
                    >
                      {categoryOptions.map((category) => {
                        const categoryName = getOptionName(category);

                        if (!categoryName) {
                          return null;
                        }

                        return (
                          <MenuItem
                            key={category?.id || categoryName}
                            value={categoryName}
                          >
                            {categoryName}
                          </MenuItem>
                        );
                      })}
                    </Select>

                    {touched.category && errors.category && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.category}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.brand && errors.brand)}>
                    <InputLabel id="product-brand-label">Brand</InputLabel>

                    <Select
                      labelId="product-brand-label"
                      id="product-brand"
                      name="brand"
                      label="Brand"
                      value={values.brand}
                      onChange={(event) =>
                        setFieldValue('brand', event.target.value)
                      }
                      onBlur={handleBlur}
                    >
                      {brandOptions.map((brand) => {
                        const brandName = getOptionName(brand);

                        if (!brandName) {
                          return null;
                        }

                        return (
                          <MenuItem
                            key={brand?.id || brandName}
                            value={brandName}
                          >
                            {brandName}
                          </MenuItem>
                        );
                      })}
                    </Select>

                    {touched.brand && errors.brand && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.brand}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.sku && errors.sku)}>
                    <InputLabel htmlFor="product-sku">SKU</InputLabel>

                    <OutlinedInput
                      id="product-sku"
                      name="sku"
                      label="SKU"
                      value={values.sku}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.sku && errors.sku && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.sku}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.price && errors.price)}>
                    <InputLabel htmlFor="product-price">Price</InputLabel>

                    <OutlinedInput
                      id="product-price"
                      name="price"
                      label="Price"
                      type="number"
                      value={values.price}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.price && errors.price && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.price}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.stock && errors.stock)}>
                    <InputLabel htmlFor="product-stock">Stock</InputLabel>

                    <OutlinedInput
                      id="product-stock"
                      name="stock"
                      label="Stock"
                      type="number"
                      value={values.stock}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.stock && errors.stock && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.stock}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel htmlFor="product-description">Description</InputLabel>

                    <OutlinedInput
                      id="product-description"
                      name="description"
                      label="Description"
                      multiline
                      minRows={3}
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </FormControl>
                </Stack>
              </form>
            )}
          </Formik>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>

          <Button
            variant="contained"
            onClick={() => {
              const form = document.querySelector('form');

              if (form) {
                form.requestSubmit();
              }
            }}
            disabled={
              createProductMutation.isPending ||
              updateProductMutation.isPending
            }
          >
            {createProductMutation.isPending || updateProductMutation.isPending
              ? 'Saving...'
              : selectedProduct
                ? 'Update Product'
                : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}