import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import MainCard from 'ui-component/cards/MainCard';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import useAxios from '../../api/useAxios';

const getUserSchema = (isEditMode) =>
  Yup.object({
    name: Yup.string()
      .trim()
      .required('Name is required'),
    email: Yup.string()
      .trim()
      .email('Enter a valid email')
      .required('Email is required'),
    user_type: Yup.string()
      .oneOf(
        ['admin', 'user'],
        'Select a valid user type'
      )
      .required('User type is required'),
    ...(isEditMode
      ? {}
      : {
        password: Yup.string()
          .required('Password is required')
      })
  });

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (
    responseData &&
    typeof responseData === 'object'
  ) {
    const firstError = Object.values(responseData)[0];

    if (Array.isArray(firstError)) {
      return firstError[0];
    }

    if (typeof firstError === 'string') {
      return firstError;
    }
  }

  return error?.message || 'Something went wrong.';
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString();
};

const createUserFormData = (values) => {
  const formData = new FormData();

  formData.append('name', values.name.trim());
  formData.append('email', values.email.trim());
  formData.append('user_type', values.user_type);
  formData.append('password', values.password);

  return formData;
};

const createUpdateFormData = (values) => {
  const formData = new FormData();

  formData.append('name', values.name.trim());
  formData.append('email', values.email.trim());
  formData.append('user_type', values.user_type);

  return formData;
};

export default function UserManagementPage() {
  const api = useAxios();
  const queryClient = useQueryClient();
  const formikRef = useRef(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setSelectedUser(null);
    setShowPassword(false);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((user) => {
    setSelectedUser(user);
    setShowPassword(false);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedUser(null);
    setShowPassword(false);
  }, []);

  const handleDelete = useCallback((user) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedUser(null);
  }, []);

  const handleTableSearchChange = useCallback((value) => {
    const normalizedValue = String(value || '').trim();

    setSearch((currentSearch) => {
      if (currentSearch === normalizedValue) {
        return currentSearch;
      }

      setPage(0);

      return normalizedValue;
    });
  }, []);

  const handleTablePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage) => {
      setRowsPerPage(newRowsPerPage);
      setPage(0);
    },
    []
  );

  const {
    data: userData,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'user-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/accounts/user-list',
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

  const users = useMemo(() => {
    return Array.isArray(userData?.results)
      ? userData.results
      : [];
  }, [userData]);

  const totalUsers = Number(userData?.count || 0);

  useEffect(() => {
    const totalPages = Number(
      userData?.total_pages || 0
    );

    if (
      totalPages > 0 &&
      page >= totalPages
    ) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [userData?.total_pages, page]);

  const initialValues = useMemo(
    () => ({
      name: selectedUser?.name || '',
      email: selectedUser?.email || '',
      user_type: selectedUser?.user_type || 'user',
      password: ''
    }),
    [selectedUser]
  );

  const createUserMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(
        '/api/accounts/create-user',
        createUserFormData(values)
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-list']
      });

      setOpen(false);
      setSelectedUser(null);
      setShowPassword(false);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.patch(
        `/api/accounts/update-user/${selectedUser?.id}`,
        createUpdateFormData(values)
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user-list']
      });

      setOpen(false);
      setSelectedUser(null);
      setShowPassword(false);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(
        `/api/accounts/delete-user/${userId}`
      );

      return response.data;
    },
    onSuccess: () => {
      setDeleteOpen(false);
      setSelectedUser(null);

      if (users.length === 1 && page > 0) {
        setPage((currentPage) =>
          Math.max(currentPage - 1, 0)
        );

        return;
      }

      queryClient.invalidateQueries({
        queryKey: [
          'user-list',
          page,
          rowsPerPage,
          search
        ],
        exact: true
      });
    }
  });

  const handleDeleteConfirm = () => {
    if (!selectedUser?.id) {
      return;
    }

    deleteUserMutation.mutate(selectedUser.id);
  };

  const handleSubmit = (values) => {
    if (selectedUser?.id) {
      updateUserMutation.mutate(values);
      return;
    }

    createUserMutation.mutate(values);
  };

  const userColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (user) => user?.name || '-'
      },
      {
        id: 'email',
        label: 'Email',
        render: (user) => user?.email || '-'
      },
      {
        id: 'user_type',
        label: 'User Type',
        cellSx: {
          textTransform: 'capitalize'
        },
        render: (user) => user?.user_type || '-'
      },
      {
        id: 'created_at',
        label: 'Created At',
        cellSx: {
          minWidth: 180,
          whiteSpace: 'nowrap'
        },
        render: (user) =>
          formatDate(user?.created_at)
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        cellSx: {
          minWidth: 100,
          whiteSpace: 'nowrap'
        },
        render: (user) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEdit(user)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(user)}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [
      handleOpenEdit,
      handleDelete
    ]
  );

  const isSaving =
    createUserMutation.isPending ||
    updateUserMutation.isPending;

  const saveError =
    createUserMutation.error ||
    updateUserMutation.error;

  return (
    <>
      <MainCard
        title="Users"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
          >
            Add User
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage administrator and standard user accounts.
          </Typography>

          <ServerTable
            columns={userColumns}
            rows={users}
            getRowId={(user) => user.id}
            loading={isLoading}
            fetching={isFetching}
            error={
              isError
                ? {
                  message: getErrorMessage(error)
                }
                : null
            }
            emptyMessage="No users found."
            searchValue={search}
            searchPlaceholder="Search users..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalUsers}
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
        <DialogTitle>Delete User</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {selectedUser?.name || 'this user'}
            </strong>
            ?
          </Typography>

          {deleteUserMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getErrorMessage(
                deleteUserMutation.error
              )}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteClose}
            disabled={deleteUserMutation.isPending}
          >
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending
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
          {selectedUser
            ? 'Edit User'
            : 'Add User'}
        </DialogTitle>

        <DialogContent>
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            enableReinitialize
            validationSchema={getUserSchema(
              Boolean(selectedUser?.id)
            )}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit: submitForm
            }) => (
              <form
                id="user-form"
                onSubmit={submitForm}
              >
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {saveError && (
                    <Alert severity="error">
                      {getErrorMessage(saveError)}
                    </Alert>
                  )}

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.name && errors.name
                    )}
                  >
                    <InputLabel htmlFor="user-name">
                      Name
                    </InputLabel>

                    <OutlinedInput
                      id="user-name"
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
                      touched.email && errors.email
                    )}
                  >
                    <InputLabel htmlFor="user-email">
                      Email
                    </InputLabel>

                    <OutlinedInput
                      id="user-email"
                      name="email"
                      label="Email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.email && errors.email && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {errors.email}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.user_type &&
                      errors.user_type
                    )}
                  >
                    <InputLabel id="user-type-label">
                      User Type
                    </InputLabel>

                    <Select
                      labelId="user-type-label"
                      id="user-type"
                      name="user_type"
                      label="User Type"
                      value={values.user_type}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value="user">
                        User
                      </MenuItem>

                      <MenuItem value="admin">
                        Admin
                      </MenuItem>
                    </Select>

                    {touched.user_type &&
                      errors.user_type && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.user_type}
                        </Typography>
                      )}
                  </FormControl>

                  {!selectedUser && (
                    <FormControl
                      fullWidth
                      error={Boolean(
                        touched.password &&
                        errors.password
                      )}
                    >
                      <InputLabel htmlFor="user-password">
                        Password
                      </InputLabel>

                      <OutlinedInput
                        id="user-password"
                        name="password"
                        label="Password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="new-password"
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword
                                  ? 'Hide password'
                                  : 'Show password'
                              }
                              onClick={() =>
                                setShowPassword(
                                  (currentValue) =>
                                    !currentValue
                                )
                              }
                              onMouseDown={(event) =>
                                event.preventDefault()
                              }
                              edge="end"
                            >
                              {showPassword
                                ? (
                                  <VisibilityOutlinedIcon />
                                )
                                : (
                                  <VisibilityOffOutlinedIcon />
                                )}
                            </IconButton>
                          </InputAdornment>
                        }
                      />

                      {touched.password &&
                        errors.password && (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ mt: 0.5 }}
                          >
                            {errors.password}
                          </Typography>
                        )}
                    </FormControl>
                  )}
                </Stack>
              </form>
            )}
          </Formik>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            type="submit"
            form="user-form"
            disabled={isSaving}
          >
            {isSaving
              ? 'Saving...'
              : selectedUser
                ? 'Update User'
                : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}