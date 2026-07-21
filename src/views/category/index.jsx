import { useMemo, useState } from 'react';
import { Formik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// material-ui
import { IconButton } from '@mui/material';
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import categorySchema from './categorySchema';

export default function CategoryPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const api = useAxios();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['category-list'],
    queryFn: async () => {
      const response = await api.get(`/api/inventory/category-list`);
      return response.data;
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
      };
      const response = await api.post(`/api/inventory/category-create`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      setOpen(false);
      setSelectedCategory(null);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        id: selectedCategory?.id,
        name: values.name,
      };
      const response = await api.patch(`/api/inventory/category-detail/${selectedCategory?.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      setOpen(false);
      setSelectedCategory(null);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      const response = await api.delete(`/api/inventory/category-detail/${categoryId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
    }
  });

  const categories = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCategory?.id) {
      deleteCategoryMutation.mutate(selectedCategory.id, {
        onSuccess: () => {
          setDeleteOpen(false);
          setSelectedCategory(null);
        }
      });
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedCategory(null);
  };

  return (
    <>
      <MainCard title="Categories" secondary={<Button variant="contained" onClick={handleOpenCreate}>Add Category</Button>}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your Categories and their catalog details.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load categories: {error?.message || 'Unknown error'}</Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.length > 0 ? (
                    categories.map((category, index) => {
                      const name = category?.name;

                      return (
                        <TableRow key={category?.id || `${name}-${index}`} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(category)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(category)}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No Categories found.
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
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedCategory?.name || 'this category'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteCategoryMutation.isPending}>
            {deleteCategoryMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ name: selectedCategory?.name || '', description: selectedCategory?.description || '' }}
            enableReinitialize
            validationSchema={categorySchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedCategory?.id) {
                updateCategoryMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createCategoryMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="category-name">Name</InputLabel>
                    <OutlinedInput
                      id="category-name"
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
              if (form) form.requestSubmit();
            }}
            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          >
            {createCategoryMutation.isPending || updateCategoryMutation.isPending ? 'Saving...' : selectedCategory ? 'Update Category' : 'Save Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
