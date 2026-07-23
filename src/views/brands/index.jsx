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
import brandSchema from './brandSchema';

export default function BrandsPage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const handleOpenCreate = useCallback(() => {
    setSelectedBrand(null);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((brand) => {
    setSelectedBrand(brand);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedBrand(null);
  }, []);

  const handleDelete = useCallback((brand) => {
    setSelectedBrand(brand);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedBrand(null);
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
      'brand-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/brand-list',
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

  const brands = useMemo(() => {
    return Array.isArray(data?.results)
      ? data.results
      : [];
  }, [data]);

  const totalBrands = Number(data?.count || 0);

  useEffect(() => {
    const totalPages = Number(data?.total_pages || 0);

    if (totalPages > 0 && page + 1 > totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [data?.total_pages, page]);

  const createBrandMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name
      };

      const response = await api.post(
        '/api/inventory/brand-create',
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['brand-list']
      });

      setOpen(false);
      setSelectedBrand(null);
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        id: selectedBrand?.id,
        name: values.name
      };

      const response = await api.patch(
        `/api/inventory/brand-detail/${selectedBrand?.id}`,
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['brand-list']
      });

      setOpen(false);
      setSelectedBrand(null);
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId) => {
      const response = await api.delete(
        `/api/inventory/brand-detail/${brandId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['brand-list']
      });

      setDeleteOpen(false);
      setSelectedBrand(null);
    }
  });

  const handleDeleteConfirm = () => {
    if (!selectedBrand?.id) return;

    deleteBrandMutation.mutate(selectedBrand.id);
  };

  const brandColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (brand) => brand?.name || '-'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        render: (brand) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEdit(brand)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(brand)}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [handleOpenEdit, handleDelete]
  );

  const isSaving =
    createBrandMutation.isPending ||
    updateBrandMutation.isPending;

  return (
    <>
      <MainCard
        title="Brands"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add Brand
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage your brands and their catalog details.
          </Typography>

          <ServerTable
            columns={brandColumns}
            rows={brands}
            getRowId={(brand) => brand.id}
            loading={isLoading}
            fetching={isFetching}
            error={isError ? error : null}
            emptyMessage="No brands found."
            searchValue={search}
            searchPlaceholder="Search brands..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalBrands}
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
        <DialogTitle>Delete Brand</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedBrand?.name || 'this brand'}
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
            disabled={deleteBrandMutation.isPending}
          >
            {deleteBrandMutation.isPending
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
          {selectedBrand
            ? 'Edit Brand'
            : 'Add Brand'}
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedBrand?.name || ''
            }}
            enableReinitialize
            validationSchema={brandSchema}
            onSubmit={(values, { resetForm }) => {
              const mutationOptions = {
                onSuccess: () => resetForm()
              };

              if (selectedBrand?.id) {
                updateBrandMutation.mutate(
                  values,
                  mutationOptions
                );

                return;
              }

              createBrandMutation.mutate(
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
                id="brand-form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name && errors.name
                    )}
                  >
                    <InputLabel htmlFor="brand-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="brand-name"
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
            form="brand-form"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : selectedBrand
                ? 'Update Brand'
                : 'Save Brand'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}