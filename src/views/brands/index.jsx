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
import brandSchema from './brandSchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function BrandsPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const api = useAxios();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['brand-list'],
    queryFn: async () => {
      const response = await api.get(`/api/inventory/brand-list`);
      return response.data;
    }
  });

  const createBrandMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
      };
      const response = await api.post(`/api/inventory/brand-create`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-list'] });
      setOpen(false);
      setSelectedBrand(null);
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        id: selectedBrand?.id,
        name: values.name,
      };
      const response = await api.patch(`/api/inventory/brand-detail/${selectedBrand?.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-list'] });
      setOpen(false);
      setSelectedBrand(null);
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId) => {
      const response = await api.delete(`/api/inventory/brand-detail/${brandId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-list'] });
    }
  });

  const brands = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const handleOpenCreate = () => {
    setSelectedBrand(null);
    setOpen(true);
  };

  const handleOpenEdit = (brand) => {
    setSelectedBrand(brand);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedBrand(null);
  };

  const handleDelete = (brand) => {
    setSelectedBrand(brand);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedBrand?.id) {
      deleteBrandMutation.mutate(selectedBrand.id, {
        onSuccess: () => {
          setDeleteOpen(false);
          setSelectedBrand(null);
        }
      });
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedBrand(null);
  };

  return (
    <>
      <MainCard title="Brands" secondary={<Button variant="contained" onClick={handleOpenCreate}>Add Brand</Button>}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your brands and their catalog details.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load brands: {error?.message || 'Unknown error'}</Typography>
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
                  {brands.length > 0 ? (
                    brands.map((brand, index) => {
                      const name = brand?.name;

                      return (
                        <TableRow key={brand?.id || `${name}-${index}`} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(brand)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(brand)}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No brands found.
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
        <DialogTitle>Delete Brand</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedBrand?.name || 'this brand'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteBrandMutation.isPending}>
            {deleteBrandMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedBrand ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ name: selectedBrand?.name || '', description: selectedBrand?.description || '' }}
            enableReinitialize
            validationSchema={brandSchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedBrand?.id) {
                updateBrandMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createBrandMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="brand-name">Name</InputLabel>
                    <OutlinedInput
                      id="brand-name"
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
            disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
          >
            {createBrandMutation.isPending || updateBrandMutation.isPending ? 'Saving...' : selectedBrand ? 'Update Brand' : 'Save Brand'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
