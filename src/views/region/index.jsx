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
import regionSchema from './regionSchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function RegionPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const api = useAxios();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['region-list'],
    queryFn: async () => {
      const response = await api.get(`/api/inventory/region-list`);
      return response.data;
    }
  });

  const createRegionMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(`/api/inventory/region-create`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['region-list'] });
      setOpen(false);
      setSelectedRegion(null);
    }
  });

  const updateRegionMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch(`/api/inventory/region-detail/${selectedRegion?.id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['region-list'] });
      setOpen(false);
      setSelectedRegion(null);
    }
  });

  const deleteRegionMutation = useMutation({
    mutationFn: async (regionId) => {
      const response = await api.delete(`/api/inventory/region-detail/${regionId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['region-list'] });
    }
  });

  const regions = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const handleOpenCreate = () => {
    setSelectedRegion(null);
    setOpen(true);
  };

  const handleOpenEdit = (region) => {
    setSelectedRegion(region);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRegion(null);
  };

  const handleDelete = (region) => {
    setSelectedRegion(region);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedRegion?.id) {
      deleteRegionMutation.mutate(selectedRegion.id, {
        onSuccess: () => {
          setDeleteOpen(false);
          setSelectedRegion(null);
        }
      });
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedRegion(null);
  };

  return (
    <>
      <MainCard title="Regions" secondary={<Button variant="contained" onClick={handleOpenCreate}>Add Region</Button>}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your regions and monitor regional inventory coverage.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load regions: {error?.message || 'Unknown error'}</Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regions.length > 0 ? (
                    regions.map((region, index) => {
                      const name = region?.name || region?.region_name || region?.title || `Region ${index + 1}`;
                      const status = region?.status || region?.is_active ? 'Active' : 'Inactive';
                      const description = region?.description || '-';

                      return (
                        <TableRow key={region?.id || `${name}-${index}`} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell>{status}</TableCell>
                          <TableCell>{description}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(region)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(region)}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No regions found.
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
        <DialogTitle>Delete Region</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedRegion?.name || 'this region'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteRegionMutation.isPending}>
            {deleteRegionMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRegion ? 'Edit Region' : 'Add Region'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ name: selectedRegion?.name || '', description: selectedRegion?.description || '' }}
            enableReinitialize
            validationSchema={regionSchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedRegion?.id) {
                updateRegionMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createRegionMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                  <InputLabel htmlFor="region-name">Name</InputLabel>
                  <OutlinedInput
                    id="region-name"
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

                <FormControl fullWidth error={Boolean(touched.description && errors.description)}>
                  <InputLabel htmlFor="region-description">Description</InputLabel>
                  <OutlinedInput
                    id="region-description"
                    name="description"
                    label="Description"
                    multiline
                    minRows={3}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {touched.description && errors.description && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.description}
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
            disabled={createRegionMutation.isPending || updateRegionMutation.isPending}
          >
            {createRegionMutation.isPending || updateRegionMutation.isPending ? 'Saving...' : selectedRegion ? 'Update Region' : 'Save Region'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
