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
import tableSchema from './tableSchema';

export default function TablesPage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const handleOpenCreate = useCallback(() => {
    setSelectedTable(null);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((table) => {
    setSelectedTable(table);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedTable(null);
  }, []);

  const handleDelete = useCallback((table) => {
    setSelectedTable(table);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedTable(null);
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
    data,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'table-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/table-list',
        {
          params: {
            page: page + 1,
            page_size: rowsPerPage,
            ...(search && { search })
          }
        }
      );

      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

  const tables = useMemo(() => {
    return Array.isArray(data?.results)
      ? data.results
      : [];
  }, [data]);

  const totalTables = Number(data?.count || 0);

  useEffect(() => {
    const totalPages = Number(data?.total_pages || 0);

    if (
      totalPages > 0 &&
      page + 1 > totalPages
    ) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [data?.total_pages, page]);

  const createTableMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
        description: values.description || ''
      };

      const response = await api.post(
        '/api/inventory/table-create',
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['table-list']
      });

      setOpen(false);
      setSelectedTable(null);
    }
  });

  const updateTableMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
        description: values.description || ''
      };

      const response = await api.patch(
        `/api/inventory/table-detail/${selectedTable?.id}`,
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['table-list']
      });

      setOpen(false);
      setSelectedTable(null);
    }
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (tableId) => {
      const response = await api.delete(
        `/api/inventory/table-detail/${tableId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['table-list']
      });

      setDeleteOpen(false);
      setSelectedTable(null);
    }
  });

  const handleDeleteConfirm = () => {
    if (!selectedTable?.id) return;

    deleteTableMutation.mutate(selectedTable.id);
  };

  const tableColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (table, index) =>
          table?.name ||
          `Table ${page * rowsPerPage + index + 1}`
      },
      {
        id: 'description',
        label: 'Description',
        render: (table) =>
          table?.description || '-'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        render: (table) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEdit(table)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(table)}
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
    createTableMutation.isPending ||
    updateTableMutation.isPending;

  return (
    <>
      <MainCard
        title="Tables"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add Table
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage your tables and monitor regional inventory coverage.
          </Typography>

          <ServerTable
            columns={tableColumns}
            rows={tables}
            getRowId={(table) => table.id}
            loading={isLoading}
            fetching={isFetching}
            error={isError ? error : null}
            emptyMessage="No tables found."
            searchValue={search}
            searchPlaceholder="Search tables..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalTables}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Stack>
      </MainCard>

      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Table</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedTable?.name || 'this table'}
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
            disabled={deleteTableMutation.isPending}
          >
            {deleteTableMutation.isPending
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
          {selectedTable
            ? 'Edit Table'
            : 'Add Table'}
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedTable?.name || '',
              description:
                selectedTable?.description || ''
            }}
            enableReinitialize
            validationSchema={tableSchema}
            onSubmit={(values, { resetForm }) => {
              const mutationOptions = {
                onSuccess: () => resetForm()
              };

              if (selectedTable?.id) {
                updateTableMutation.mutate(
                  values,
                  mutationOptions
                );

                return;
              }

              createTableMutation.mutate(
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
              handleSubmit
            }) => (
              <form
                id="table-form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name && errors.name
                    )}
                  >
                    <InputLabel htmlFor="table-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="table-name"
                      name="name"
                      label="Name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.name && errors.name && (
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
                      touched.description &&
                      errors.description
                    )}
                  >
                    <InputLabel htmlFor="table-description">
                      Description
                    </InputLabel>

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

                    {touched.description &&
                      errors.description && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
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
          <Button onClick={handleClose}>
            Cancel
          </Button>

          <Button
            variant="contained"
            type="submit"
            form="table-form"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : selectedTable
                ? 'Update Table'
                : 'Save Table'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}