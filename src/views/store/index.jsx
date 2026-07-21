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
import storeSchema from './storeSchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function StorePage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const api = useAxios();
  const queryClient = useQueryClient();

  const { data: storeData, isLoading, isError, error } = useQuery({
    queryKey: ['store-list'],
    queryFn: async () => {
      const response = await api.get('/api/inventory/store-list');
      return response.data;
    }
  });

  const { data: regionOptionsData } = useQuery({
    queryKey: ['region-name-list'],
    queryFn: async () => {
      const response = await api.get('/api/inventory/region-name-list');
      return response.data;
    }
  });

  const regionOptions = useMemo(() => {
    if (Array.isArray(regionOptionsData?.results)) return regionOptionsData.results;
    return [];
  }, [regionOptionsData]);

  const stores = useMemo(() => {
    if (Array.isArray(storeData?.results)) return storeData.results;
    return [];
  }, [storeData]);

  const createStoreMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
        store_code: values.store_code,
        branch_code: values.branch_code,
        region: values.region,
        city: values.city,
        area: values.area
      };
      const response = await api.post('/api/inventory/store-create', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-list'] });
      setOpen(false);
      setSelectedStore(null);
    }
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        id: selectedStore?.id,
        name: values.name,
        store_code: values.store_code,
        branch_code: values.branch_code,
        region: values.region,
        region_name: values.region_name,
        city: values.city,
        area: values.area,
        is_active: values.is_active ?? true
      };
      const response = await api.patch(`/api/inventory/store-detail/${selectedStore?.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-list'] });
      setOpen(false);
      setSelectedStore(null);
    }
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId) => {
      const response = await api.delete(`/api/inventory/store-detail/${storeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-list'] });
      setDeleteOpen(false);
      setSelectedStore(null);
    }
  });

  const handleOpenCreate = () => {
    setSelectedStore(null);
    setOpen(true);
  };

  const handleOpenEdit = (store) => {
    setSelectedStore(store);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStore(null);
  };

  const handleDelete = (store) => {
    setSelectedStore(store);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedStore?.id) {
      deleteStoreMutation.mutate(selectedStore.id);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedStore(null);
  };

  return (
    <>
      <MainCard title="Stores" secondary={<Button variant="contained" onClick={handleOpenCreate}>Add Store</Button>}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your stores and their regional coverage.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load stores: {error?.message || 'Unknown error'}</Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Store Code</TableCell>
                    <TableCell>Branch Code</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stores.length > 0 ? (
                    stores.map((store, index) => {
                      const name = store?.name || `Store ${index + 1}`;
                      const storeCode = store?.store_code || '-';
                      const branchCode = store?.branch_code || '-';
                      const regionName = store?.region_name || store?.region || '-';
                      const city = store?.city || '-';
                      const area = store?.area || '-';

                      return (
                        <TableRow key={store?.id || `${name}-${index}`} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell>{storeCode}</TableCell>
                          <TableCell>{branchCode}</TableCell>
                          <TableCell>{regionName}</TableCell>
                          <TableCell>{city}</TableCell>
                          <TableCell>{area}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(store)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(store)}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No stores found.
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
        <DialogTitle>Delete Store</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedStore?.name || 'this store'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteStoreMutation.isPending}>
            {deleteStoreMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedStore ? 'Edit Store' : 'Add Store'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              name: selectedStore?.name || '',
              store_code: selectedStore?.store_code || '',
              branch_code: selectedStore?.branch_code || '',
              region: selectedStore?.region || '',
              region_name: selectedStore?.region_name || '',
              city: selectedStore?.city || '',
              area: selectedStore?.area || '',
              is_active: selectedStore?.is_active ?? true
            }}
            enableReinitialize
            validationSchema={storeSchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedStore?.id) {
                updateStoreMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createStoreMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="store-name">Name</InputLabel>
                    <OutlinedInput id="store-name" name="name" label="Name" value={values.name} onChange={handleChange} onBlur={handleBlur} />
                    {touched.name && errors.name && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.name}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.store_code && errors.store_code)}>
                    <InputLabel htmlFor="store-code">Store Code</InputLabel>
                    <OutlinedInput id="store-code" name="store_code" label="Store Code" value={values.store_code} onChange={handleChange} onBlur={handleBlur} />
                    {touched.store_code && errors.store_code && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.store_code}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.branch_code && errors.branch_code)}>
                    <InputLabel htmlFor="branch-code">Branch Code</InputLabel>
                    <OutlinedInput id="branch-code" name="branch_code" label="Branch Code" value={values.branch_code} onChange={handleChange} onBlur={handleBlur} />
                    {touched.branch_code && errors.branch_code && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.branch_code}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.region && errors.region)}>
                    <InputLabel id="store-region-label">Region</InputLabel>
                    <Select
                      labelId="store-region-label"
                      id="store-region"
                      name="region"
                      label="Region"
                      value={values.region}
                      onChange={(event) => {
                        const selectedRegion = regionOptions.find((option) => option?.id === event.target.value);
                        setFieldValue('region', event.target.value);
                        setFieldValue('region_name', selectedRegion?.name || selectedRegion?.region_name || '');
                      }}
                      onBlur={handleBlur}
                    >
                      {regionOptions.map((region) => (
                        <MenuItem key={region?.id} value={region?.id}>
                          {region?.name || region?.region_name || region?.title || region?.id}
                        </MenuItem>
                      ))}
                    </Select>
                    {touched.region && errors.region && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.region}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.city && errors.city)}>
                    <InputLabel htmlFor="store-city">City</InputLabel>
                    <OutlinedInput id="store-city" name="city" label="City" value={values.city} onChange={handleChange} onBlur={handleBlur} />
                    {touched.city && errors.city && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.city}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.area && errors.area)}>
                    <InputLabel htmlFor="store-area">Area</InputLabel>
                    <OutlinedInput id="store-area" name="area" label="Area" value={values.area} onChange={handleChange} onBlur={handleBlur} />
                    {touched.area && errors.area && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.area}
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
            disabled={createStoreMutation.isPending || updateStoreMutation.isPending}
          >
            {createStoreMutation.isPending || updateStoreMutation.isPending ? 'Saving...' : selectedStore ? 'Update Store' : 'Save Store'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
