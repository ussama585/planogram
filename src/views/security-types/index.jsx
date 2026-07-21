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
import securitySchema from './securitySchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function SecurityTypePage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSecurityType, setSelectedSecurityType] = useState(null);
  const api = useAxios();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['security-list'],
    queryFn: async () => {
      const response = await api.get(`/api/inventory/security-list`);
      return response.data;
    }
  });

  const createSecurityMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(`/api/inventory/security-create`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-list'] });
      setOpen(false);
      setSelectedSecurityType(null);
    }
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch(`/api/inventory/security-detail/${selectedSecurityType?.id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-list'] });
      setOpen(false);
      setSelectedSecurityType(null);
    }
  });

  const deleteSecurityMutation = useMutation({
    mutationFn: async (securityId) => {
      const response = await api.delete(`/api/inventory/security-detail/${securityId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-list'] });
    }
  });

  const securityTypes = useMemo(() => {
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }, [data]);

  const handleOpenCreate = () => {
    setSelectedSecurityType(null);
    setOpen(true);
  };

  const handleOpenEdit = (security) => {
    setSelectedSecurityType(security);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSecurityType(null);
  };

  const handleDelete = (security) => {
    setSelectedSecurityType(security);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedSecurityType?.id) {
      deleteSecurityMutation.mutate(selectedSecurityType.id, {
        onSuccess: () => {
          setDeleteOpen(false);
          setSelectedSecurityType(null);
        }
      });
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedSecurityType(null);
  };

  return (
    <>
      <MainCard title="Security Type" secondary={<Button variant="contained" onClick={handleOpenCreate}>Add Security Type</Button>}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your security types and monitor regional inventory coverage.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load security types: {error?.message || 'Unknown error'}</Typography>
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
                  {securityTypes.length > 0 ? (
                    securityTypes.map((security, index) => {
                      const name = security?.name;

                      return (
                        <TableRow key={security?.id} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(security)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(security)}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No security type found.
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
        <DialogTitle>Delete Security Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedSecurityType?.name || 'this security type'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteSecurityMutation.isPending}>
            {deleteSecurityMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedSecurityType ? 'Edit Security Type' : 'Add Security Type'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ name: selectedSecurityType?.name || '', description: selectedSecurityType?.description || '' }}
            enableReinitialize
            validationSchema={securitySchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedSecurityType?.id) {
                updateSecurityMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createSecurityMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="security-name">Name</InputLabel>
                    <OutlinedInput
                      id="security-name"
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
            disabled={createSecurityMutation.isPending || updateSecurityMutation.isPending}
          >
            {createSecurityMutation.isPending || updateSecurityMutation.isPending ? 'Saving...' : selectedSecurityType ? 'Update Security Type' : 'Save Security Type'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
