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
import tableSchema from './tableSchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function TablesPage() {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const api = useAxios();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['table-list'],
    queryFn: async () => {
      const response = await api.get(`/api/inventory/table-list`);
      return response.data;
    }
  });

  const createTableMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(`/api/inventory/table-create`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-list'] });
      setOpen(false);
      setSelectedTable(null);
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch(`/api/inventory/table-detail/${selectedTable?.id}`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-list'] });
      setOpen(false);
      setSelectedTable(null);
    }
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (tableId) => {
      const response = await api.delete(`/api/inventory/table-detail/${tableId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-list'] });
    }
  });

  const tables = useMemo(() => {
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }, [data]);

  const handleOpenCreate = () => {
    setSelectedTable(null);
    setOpen(true);
  };

  const handleOpenEdit = (table) => {
    setSelectedTable(table);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTable(null);
  };

  const handleDelete = (table) => {
    setSelectedTable(table);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTable?.id) {
      deleteTableMutation.mutate(selectedTable.id, {
        onSuccess: () => {
          setDeleteOpen(false);
          setSelectedTable(null);
        }
      });
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedTable(null);
  };

  return (
    <>
      <MainCard title="Tables" secondary={<Button variant="contained" onClick={handleOpenCreate}>Add Table</Button>}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your tables and monitor regional inventory coverage.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load tables: {error?.message || 'Unknown error'}</Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tables.length > 0 ? (
                    tables.map((table, index) => {
                      const name = table?.name || `table ${index + 1}`;
                      const description = table?.description || '-';

                      return (
                        <TableRow key={table?.id || `${name}-${index}`} hover>
                          <TableCell>{name}</TableCell>
                          <TableCell>{description}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(table)}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(table)}>
                              <DeleteOutlineOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No tables found.
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
        <DialogTitle>Delete Table</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedTable?.name || 'this table'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleteTableMutation.isPending}>
            {deleteTableMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{ name: selectedTable?.name || '', description: selectedTable?.description || '' }}
            enableReinitialize
            validationSchema={tableSchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedTable?.id) {
                updateTableMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createTableMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="table-name">Name</InputLabel>
                    <OutlinedInput
                      id="table-name"
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
                    <InputLabel htmlFor="table-description">Description</InputLabel>
                    <OutlinedInput
                      id="table-description"
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
            disabled={createTableMutation.isPending || updateTableMutation.isPending}
          >
            {createTableMutation.isPending || updateTableMutation.isPending ? 'Saving...' : selectedTable ? 'Update Table' : 'Save Table'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
