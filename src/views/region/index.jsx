import { useCallback, useMemo, useState } from 'react';
import { Formik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
import regionSchema from './regionSchema';
import useAxios from 'api/useAxios';

export default function RegionPage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchValue, setSearchValue] = useState('');

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'region-list',
      page,
      rowsPerPage,
      searchValue
    ],
    queryFn: async () => {
      const response = await api.get('/api/inventory/region-list', {
        params: {
          page: page + 1,
          page_size: rowsPerPage,
          ...(searchValue && {
            search: searchValue
          })
        }
      });

      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

  const regions = useMemo(() => {
    return Array.isArray(data?.results) ? data.results : [];
  }, [data]);

  const totalCount = useMemo(() => {
    return Number(
      data?.count ??
      data?.total_count ??
      data?.total ??
      regions.length
    );
  }, [data, regions.length]);

  const createRegionMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(
        '/api/inventory/region-create',
        values
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['region-list']
      });

      setOpen(false);
      setSelectedRegion(null);
    }
  });

  const updateRegionMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch(
        `/api/inventory/region-detail/${selectedRegion?.id}`,
        values
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['region-list']
      });

      setOpen(false);
      setSelectedRegion(null);
    }
  });

  const deleteRegionMutation = useMutation({
    mutationFn: async (regionId) => {
      const response = await api.delete(
        `/api/inventory/region-detail/${regionId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['region-list']
      });

      if (regions.length === 1 && page > 0) {
        setPage((currentPage) => currentPage - 1);
      }

      setDeleteOpen(false);
      setSelectedRegion(null);
    }
  });

  const handleOpenCreate = () => {
    setSelectedRegion(null);
    setOpen(true);
  };

  const handleOpenEdit = useCallback((region) => {
    setSelectedRegion(region);
    setOpen(true);
  }, []);

  const handleClose = () => {
    if (
      createRegionMutation.isPending ||
      updateRegionMutation.isPending
    ) {
      return;
    }

    setOpen(false);
    setSelectedRegion(null);
  };

  const handleDelete = useCallback((region) => {
    setSelectedRegion(region);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = () => {
    if (deleteRegionMutation.isPending) {
      return;
    }

    setDeleteOpen(false);
    setSelectedRegion(null);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRegion?.id) {
      return;
    }

    deleteRegionMutation.mutate(selectedRegion.id);
  };

  const handleSearchChange = useCallback((newSearchValue) => {
    setSearchValue(newSearchValue);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (region, rowIndex) =>
          region?.name || `Region ${rowIndex + 1}`
      },
      {
        id: 'is_active',
        label: 'Status',
        render: (region) =>
          region?.is_active ? 'Active' : 'Inactive'
      },
      {
        id: 'description',
        label: 'Description',
        render: (region) => region?.description || '-'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (region) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEdit(region)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(region)}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [handleDelete, handleOpenEdit]
  );

  const saving =
    createRegionMutation.isPending ||
    updateRegionMutation.isPending;

  const mutationError =
    createRegionMutation.error ||
    updateRegionMutation.error;

  return (
    <>
      <MainCard
        title="Regions"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add Region
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your regions and monitor regional inventory
            coverage.
          </Typography>

          <ServerTable
            columns={columns}
            rows={regions}
            getRowId={(region) => region?.id}
            loading={isLoading || isFetching}
            error={isError ? error : null}
            emptyMessage="No regions found."
            searchValue={searchValue}
            searchPlaceholder="Search regions..."
            onSearchChange={handleSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            searchDelay={500}
          />
        </Stack>
      </MainCard>

      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Region</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedRegion?.name || 'this region'}
            </strong>
            ?
          </Typography>

          {deleteRegionMutation.isError && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 2 }}
            >
              {deleteRegionMutation.error?.response?.data?.message ||
                deleteRegionMutation.error?.message ||
                'Failed to delete region.'}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteClose}
            disabled={deleteRegionMutation.isPending}
          >
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteRegionMutation.isPending}
          >
            {deleteRegionMutation.isPending
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
          {selectedRegion ? 'Edit Region' : 'Add Region'}
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedRegion?.name || '',
              description: selectedRegion?.description || ''
            }}
            enableReinitialize
            validationSchema={regionSchema}
            onSubmit={(values) => {
              if (selectedRegion?.id) {
                updateRegionMutation.mutate(values);
                return;
              }

              createRegionMutation.mutate(values);
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
                id="region-form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name && errors.name
                    )}
                  >
                    <InputLabel htmlFor="region-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="region-name"
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
                    <InputLabel htmlFor="region-description">
                      Description
                    </InputLabel>

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

                  {mutationError && (
                    <Typography
                      variant="body2"
                      color="error"
                    >
                      {mutationError?.response?.data?.message ||
                        mutationError?.message ||
                        'Failed to save region.'}
                    </Typography>
                  )}
                </Stack>
              </form>
            )}
          </Formik>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="region-form"
            variant="contained"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : selectedRegion
                ? 'Update Region'
                : 'Save Region'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}