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
import categorySchema from './categorySchema';

export default function CategoryPage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const handleOpenCreate = useCallback(() => {
    setSelectedCategory(null);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((category) => {
    setSelectedCategory(category);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedCategory(null);
  }, []);

  const handleDelete = useCallback((category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedCategory(null);
  }, []);

  const handleTableSearchChange = useCallback((value) => {
    setPage(0);
    setSearch(String(value || '').trim());
  }, []);

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
      'category-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/category-list',
        {
          params: {
            page: page + 1,
            page_size: rowsPerPage,
            ...(search && {
              search
            })
          }
        }
      );

      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

  const categories = useMemo(() => {
    return Array.isArray(data?.results)
      ? data.results
      : [];
  }, [data]);

  const totalCategories = Number(data?.count || 0);

  useEffect(() => {
    const totalPages = Number(data?.total_pages || 0);

    if (totalPages > 0 && page + 1 > totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [data?.total_pages, page]);

  const createCategoryMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name
      };

      const response = await api.post(
        '/api/inventory/category-create',
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['category-list']
      });

      setOpen(false);
      setSelectedCategory(null);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        id: selectedCategory?.id,
        name: values.name
      };

      const response = await api.patch(
        `/api/inventory/category-detail/${selectedCategory?.id}`,
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['category-list']
      });

      setOpen(false);
      setSelectedCategory(null);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      const response = await api.delete(
        `/api/inventory/category-detail/${categoryId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['category-list']
      });

      setDeleteOpen(false);
      setSelectedCategory(null);
    }
  });

  const handleDeleteConfirm = () => {
    if (!selectedCategory?.id) return;

    deleteCategoryMutation.mutate(selectedCategory.id);
  };

  const categoryColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (category) => category?.name || '-'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        render: (category) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEdit(category)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(category)}
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
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending;

  return (
    <>
      <MainCard
        title="Categories"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add Category
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage your Categories and their catalog details.
          </Typography>

          <ServerTable
            columns={categoryColumns}
            rows={categories}
            getRowId={(category) => category.id}
            loading={isLoading}
            fetching={isFetching}
            error={isError ? error : null}
            emptyMessage="No Categories found."
            searchValue={search}
            searchPlaceholder="Search categories..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalCategories}
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
        <DialogTitle>Delete Category</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedCategory?.name || 'this category'}
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
            disabled={deleteCategoryMutation.isPending}
          >
            {deleteCategoryMutation.isPending
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
          {selectedCategory
            ? 'Edit Category'
            : 'Add Category'}
        </DialogTitle>

        <DialogContent>
          <Formik
            initialValues={{
              name: selectedCategory?.name || ''
            }}
            enableReinitialize
            validationSchema={categorySchema}
            onSubmit={(values, { resetForm }) => {
              const mutationOptions = {
                onSuccess: () => resetForm()
              };

              if (selectedCategory?.id) {
                updateCategoryMutation.mutate(
                  values,
                  mutationOptions
                );

                return;
              }

              createCategoryMutation.mutate(
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
                id="category-form"
                onSubmit={handleSubmit}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name && errors.name
                    )}
                  >
                    <InputLabel htmlFor="category-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="category-name"
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
            form="category-form"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : selectedCategory
                ? 'Update Category'
                : 'Save Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}