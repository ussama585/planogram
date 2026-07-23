import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import { Formik } from 'formik';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import MainCard from 'ui-component/cards/MainCard';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import useAxios from '../../api/useAxios';
import productSchema from './productSchema';

const getOptionName = (option) => {
  if (typeof option === 'string') {
    return option;
  }

  return (
    option?.name ||
    option?.category_name ||
    option?.brand_name ||
    option?.title ||
    ''
  );
};

export default function ProductsPage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const handleOpenCreate = useCallback(() => {
    setSelectedProduct(null);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((product) => {
    setSelectedProduct(product);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleDelete = useCallback((product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleTableSearchChange = useCallback((value) => {
    const normalizedValue = String(value || '').trim();

    setSearch((previousSearch) => {
      if (previousSearch === normalizedValue) {
        return previousSearch;
      }

      setPage(0);
      return normalizedValue;
    });
  }, []);

  const handleTablePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const {
    data: productData,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'product-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/product-list',
        {
          params: {
            page: page + 1,
            page_size: rowsPerPage,
            ...(search && {
              search
            })
          }
        }
      );

      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

  const { data: categoryOptionsData } = useQuery({
    queryKey: ['category-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/category-name-list'
      );

      return response.data;
    }
  });

  const { data: brandOptionsData } = useQuery({
    queryKey: ['brand-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/brand-name-list'
      );

      return response.data;
    }
  });

  const categoryOptions = useMemo(() => {
    if (Array.isArray(categoryOptionsData?.results)) {
      return categoryOptionsData.results;
    }

    if (Array.isArray(categoryOptionsData)) {
      return categoryOptionsData;
    }

    return [];
  }, [categoryOptionsData]);

  const brandOptions = useMemo(() => {
    if (Array.isArray(brandOptionsData?.results)) {
      return brandOptionsData.results;
    }

    if (Array.isArray(brandOptionsData)) {
      return brandOptionsData;
    }

    return [];
  }, [brandOptionsData]);

  const products = useMemo(() => {
    return Array.isArray(productData?.results)
      ? productData.results
      : [];
  }, [productData]);

  const totalProducts = Number(productData?.count || 0);

  useEffect(() => {
    const totalPages = Number(
      productData?.total_pages || 0
    );

    if (
      totalPages > 0 &&
      page + 1 > totalPages
    ) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [productData?.total_pages, page]);

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

      const response = await api.post(
        '/api/inventory/product-create',
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product-list']
      });

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
      queryClient.invalidateQueries({
        queryKey: ['product-list']
      });

      setOpen(false);
      setSelectedProduct(null);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      const response = await api.delete(
        `/api/inventory/product-detail/${productId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product-list']
      });

      setDeleteOpen(false);
      setSelectedProduct(null);
    }
  });

  const handleDeleteConfirm = () => {
    if (!selectedProduct?.id) return;

    deleteProductMutation.mutate(selectedProduct.id);
  };

  const productColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (product, index) =>
          product?.name ||
          `Product ${page * rowsPerPage + index + 1}`
      },
      {
        id: 'sku',
        label: 'SKU',
        render: (product) =>
          product?.sku || '-'
      },
      {
        id: 'brand',
        label: 'Brand',
        render: (product) =>
          getOptionName(product?.brand) || '-'
      },
      {
        id: 'category',
        label: 'Category',
        render: (product) =>
          getOptionName(product?.category) || '-'
      },
      {
        id: 'status',
        label: 'Status',
        render: (product) =>
          product?.status ? 'Active' : 'Inactive'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        render: (product) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                handleOpenEdit(product)
              }
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() =>
                handleDelete(product)
              }
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [
      page,
      rowsPerPage,
      handleOpenEdit,
      handleDelete
    ]
  );

  const isSaving =
    createProductMutation.isPending ||
    updateProductMutation.isPending;

  return (
    <>
      <MainCard
        title="Products"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add Product
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage your products, stock, and pricing.
          </Typography>

          <ServerTable
            columns={productColumns}
            rows={products}
            getRowId={(product) => product.id}
            loading={isLoading}
            fetching={isFetching}
            error={isError ? error : null}
            emptyMessage="No products found."
            searchValue={search}
            searchPlaceholder="Search products..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalProducts}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={
              handleRowsPerPageChange
            }
          />
        </Stack>
      </MainCard>

      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Product
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedProduct?.name ||
                'this product'}
            </strong>
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={
              deleteProductMutation.isPending
            }
          >
            {deleteProductMutation.isPending
              ? 'Deleting...'
              : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedProduct
            ? 'Edit Product'
            : 'Add Product'}
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedProduct?.name || '',
              category: getOptionName(
                selectedProduct?.category
              ),
              brand: getOptionName(
                selectedProduct?.brand
              ),
              sku: selectedProduct?.sku || '',
              price: selectedProduct?.price || '',
              description:
                selectedProduct?.description || '',
              stock: selectedProduct?.stock ?? '',
              status:
                selectedProduct?.status ?? true
            }}
            enableReinitialize
            validationSchema={productSchema}
            onSubmit={(values, { resetForm }) => {
              const mutationOptions = {
                onSuccess: () => resetForm()
              };

              if (selectedProduct?.id) {
                updateProductMutation.mutate(
                  values,
                  mutationOptions
                );

                return;
              }

              createProductMutation.mutate(
                values,
                mutationOptions
              );
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
              <form
                id="product-form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name &&
                      errors.name
                    )}
                  >
                    <InputLabel htmlFor="product-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="product-name"
                      name="name"
                      label="Name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.name &&
                      errors.name && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.name}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.category &&
                      errors.category
                    )}
                  >
                    <InputLabel id="product-category-label">
                      Category
                    </InputLabel>

                    <Select
                      labelId="product-category-label"
                      id="product-category"
                      name="category"
                      label="Category"
                      value={values.category}
                      onChange={(event) =>
                        setFieldValue(
                          'category',
                          event.target.value
                        )
                      }
                      onBlur={handleBlur}
                    >
                      {categoryOptions.map(
                        (category) => {
                          const categoryName =
                            getOptionName(category);

                          if (!categoryName) {
                            return null;
                          }

                          return (
                            <MenuItem
                              key={
                                category?.id ||
                                categoryName
                              }
                              value={categoryName}
                            >
                              {categoryName}
                            </MenuItem>
                          );
                        }
                      )}
                    </Select>

                    {touched.category &&
                      errors.category && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.category}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.brand &&
                      errors.brand
                    )}
                  >
                    <InputLabel id="product-brand-label">
                      Brand
                    </InputLabel>

                    <Select
                      labelId="product-brand-label"
                      id="product-brand"
                      name="brand"
                      label="Brand"
                      value={values.brand}
                      onChange={(event) =>
                        setFieldValue(
                          'brand',
                          event.target.value
                        )
                      }
                      onBlur={handleBlur}
                    >
                      {brandOptions.map((brand) => {
                        const brandName =
                          getOptionName(brand);

                        if (!brandName) {
                          return null;
                        }

                        return (
                          <MenuItem
                            key={
                              brand?.id ||
                              brandName
                            }
                            value={brandName}
                          >
                            {brandName}
                          </MenuItem>
                        );
                      })}
                    </Select>

                    {touched.brand &&
                      errors.brand && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.brand}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.sku && errors.sku
                    )}
                  >
                    <InputLabel htmlFor="product-sku">
                      SKU
                    </InputLabel>

                    <OutlinedInput
                      id="product-sku"
                      name="sku"
                      label="SKU"
                      value={values.sku}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.sku &&
                      errors.sku && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.sku}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.price &&
                      errors.price
                    )}
                  >
                    <InputLabel htmlFor="product-price">
                      Price
                    </InputLabel>

                    <OutlinedInput
                      id="product-price"
                      name="price"
                      label="Price"
                      type="number"
                      value={values.price}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.price &&
                      errors.price && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.price}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.stock &&
                      errors.stock
                    )}
                  >
                    <InputLabel htmlFor="product-stock">
                      Stock
                    </InputLabel>

                    <OutlinedInput
                      id="product-stock"
                      name="stock"
                      label="Stock"
                      type="number"
                      value={values.stock}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.stock &&
                      errors.stock && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.stock}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel htmlFor="product-description">
                      Description
                    </InputLabel>

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
          <Button onClick={handleClose}>
            Cancel
          </Button>

          <Button
            variant="contained"
            type="submit"
            form="product-form"
            disabled={isSaving}
          >
            {isSaving
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