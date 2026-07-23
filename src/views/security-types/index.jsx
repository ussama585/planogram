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
import securitySchema from './securitySchema';

export default function SecurityTypePage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSecurityType, setSelectedSecurityType] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const handleOpenCreate = useCallback(() => {
    setSelectedSecurityType(null);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((securityType) => {
    setSelectedSecurityType(securityType);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedSecurityType(null);
  }, []);

  const handleDelete = useCallback((securityType) => {
    setSelectedSecurityType(securityType);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedSecurityType(null);
  }, []);

  const handleTableSearchChange = useCallback(
    (value) => {
      const normalizedValue = String(value || '').trim();

      if (normalizedValue === search) {
        return;
      }

      setPage(0);
      setSearch(normalizedValue);
    },
    [search]
  );

  const handleTablePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setPage(0);
    setRowsPerPage(newRowsPerPage);
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'security-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/security-list',
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

  const securityTypes = useMemo(() => {
    return Array.isArray(data?.results)
      ? data.results
      : [];
  }, [data]);

  const totalSecurityTypes = Number(data?.count || 0);

  useEffect(() => {
    const totalPages = Number(data?.total_pages || 0);

    if (
      totalPages > 0 &&
      page + 1 > totalPages
    ) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [data?.total_pages, page]);

  const createSecurityMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name
      };

      const response = await api.post(
        '/api/inventory/security-create',
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['security-list']
      });

      setOpen(false);
      setSelectedSecurityType(null);
    }
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name
      };

      const response = await api.patch(
        `/api/inventory/security-detail/${selectedSecurityType?.id}`,
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['security-list']
      });

      setOpen(false);
      setSelectedSecurityType(null);
    }
  });

  const deleteSecurityMutation = useMutation({
    mutationFn: async (securityId) => {
      const response = await api.delete(
        `/api/inventory/security-detail/${securityId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['security-list']
      });

      setDeleteOpen(false);
      setSelectedSecurityType(null);
    }
  });

  const handleDeleteConfirm = () => {
    if (!selectedSecurityType?.id) {
      return;
    }

    deleteSecurityMutation.mutate(
      selectedSecurityType.id
    );
  };

  const securityColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (securityType, index) =>
          securityType?.name ||
          `Security Type ${page * rowsPerPage + index + 1
          }`
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        render: (securityType) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                handleOpenEdit(securityType)
              }
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() =>
                handleDelete(securityType)
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
    createSecurityMutation.isPending ||
    updateSecurityMutation.isPending;

  return (
    <>
      <MainCard
        title="Security Type"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add Security Type
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage your security types and monitor regional
            inventory coverage.
          </Typography>

          <ServerTable
            columns={securityColumns}
            rows={securityTypes}
            getRowId={(securityType) => securityType.id}
            loading={isLoading}
            fetching={isFetching}
            error={isError ? error : null}
            emptyMessage="No security type found."
            searchValue={search}
            searchPlaceholder="Search security types..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalSecurityTypes}
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
          Delete Security Type
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedSecurityType?.name ||
                'this security type'}
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
              deleteSecurityMutation.isPending
            }
          >
            {deleteSecurityMutation.isPending
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
          {selectedSecurityType
            ? 'Edit Security Type'
            : 'Add Security Type'}
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedSecurityType?.name || ''
            }}
            enableReinitialize
            validationSchema={securitySchema}
            onSubmit={(values, { resetForm }) => {
              const mutationOptions = {
                onSuccess: () => resetForm()
              };

              if (selectedSecurityType?.id) {
                updateSecurityMutation.mutate(
                  values,
                  mutationOptions
                );

                return;
              }

              createSecurityMutation.mutate(
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
                id="security-type-form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name && errors.name
                    )}
                  >
                    <InputLabel htmlFor="security-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="security-name"
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
            form="security-type-form"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : selectedSecurityType
                ? 'Update Security Type'
                : 'Save Security Type'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}