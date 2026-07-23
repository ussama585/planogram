import { useMemo, useRef, useState } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
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
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import MainCard from 'ui-component/cards/MainCard';
import useAxios from '../../api/useAxios';

const getUserSchema = (isEditMode) =>
  Yup.object({
    name: Yup.string().trim().required('Name is required'),
    email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
    user_type: Yup.string().oneOf(['admin', 'user'], 'Select a valid user type').required('User type is required'),
    ...(isEditMode
      ? {}
      : {
        password: Yup.string().required('Password is required')
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

  if (responseData && typeof responseData === 'object') {
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

  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    data: userData,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: ['user-list', page],
    queryFn: async () => {
      const response = await api.get('/api/accounts/user-list', {
        params: {
          page
        }
      });

      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

  const users = useMemo(() => {
    if (Array.isArray(userData?.results)) {
      return userData.results;
    }

    return [];
  }, [userData]);

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
      const response = await api.post('/api/accounts/create-user', createUserFormData(values));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-list'] });
      setOpen(false);
      setSelectedUser(null);
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
      queryClient.invalidateQueries({ queryKey: ['user-list'] });
      setOpen(false);
      setSelectedUser(null);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/api/accounts/delete-user/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-list'] });

      if (users.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      }

      setDeleteOpen(false);
      setSelectedUser(null);
    }
  });

  const handleOpenCreate = () => {
    createUserMutation.reset();
    updateUserMutation.reset();
    setShowPassword(false);
    setSelectedUser(null);
    setOpen(true);
  };

  const handleOpenEdit = (user) => {
    createUserMutation.reset();
    updateUserMutation.reset();
    setShowPassword(false);
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setShowPassword(false);
    setSelectedUser(null);
    createUserMutation.reset();
    updateUserMutation.reset();
  };

  const handleDelete = (user) => {
    deleteUserMutation.reset();
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedUser(null);
    deleteUserMutation.reset();
  };

  const handleDeleteConfirm = () => {
    if (selectedUser?.id) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const handleSubmit = (values) => {
    if (selectedUser?.id) {
      updateUserMutation.mutate(values);
      return;
    }

    createUserMutation.mutate(values);
  };

  const isSaving = createUserMutation.isPending || updateUserMutation.isPending;
  const saveError = createUserMutation.error || updateUserMutation.error;

  const totalUsers = Number(userData?.count) || 0;
  const currentPage = Number(userData?.current_page) || page;
  const totalPages = Number(userData?.total_pages) || 1;
  const hasPreviousPage = Boolean(userData?.previous) || currentPage > 1;
  const hasNextPage = Boolean(userData?.next) || currentPage < totalPages;

  return (
    <>
      <MainCard
        title="Users"
        secondary={
          <Button variant="contained" onClick={handleOpenCreate}>
            Add User
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage administrator and standard user accounts.
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                <Typography color="error">Failed to load users: {getErrorMessage(error)}</Typography>
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>User Type</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <TableRow key={user?.id || `${user?.email}-${index}`} hover>
                        <TableCell>{user?.name || '-'}</TableCell>
                        <TableCell>{user?.email || '-'}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{user?.user_type || '-'}</TableCell>
                        <TableCell>{formatDate(user?.created_at)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(user)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>

                          <IconButton size="small" color="error" onClick={() => handleDelete(user)}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              Total users: {totalUsers}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                disabled={!hasPreviousPage || isFetching}
                onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
              >
                Previous
              </Button>

              <Typography variant="body2">
                Page {currentPage} of {totalPages}
              </Typography>

              <Button
                variant="outlined"
                disabled={!hasNextPage || isFetching}
                onClick={() => setPage((currentValue) => currentValue + 1)}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </MainCard>

      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>Delete User</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name || 'this user'}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose} disabled={deleteUserMutation.isPending}>
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Add User'}</DialogTitle>

        <DialogContent>
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            enableReinitialize
            validationSchema={getUserSchema(Boolean(selectedUser?.id))}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit: submitForm }) => (
              <form onSubmit={submitForm}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {saveError && <Alert severity="error">{getErrorMessage(saveError)}</Alert>}

                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="user-name">Name</InputLabel>
                    <OutlinedInput
                      id="user-name"
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

                  <FormControl fullWidth error={Boolean(touched.email && errors.email)}>
                    <InputLabel htmlFor="user-email">Email</InputLabel>
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
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.email}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.user_type && errors.user_type)}>
                    <InputLabel id="user-type-label">User Type</InputLabel>
                    <Select
                      labelId="user-type-label"
                      id="user-type"
                      name="user_type"
                      label="User Type"
                      value={values.user_type}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>

                    {touched.user_type && errors.user_type && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.user_type}
                      </Typography>
                    )}
                  </FormControl>

                  {!selectedUser && (
                    <FormControl fullWidth error={Boolean(touched.password && errors.password)}>
                      <InputLabel htmlFor="user-password">Password</InputLabel>
                      <OutlinedInput
                        id="user-password"
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={values.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="new-password"
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((currentValue) => !currentValue)}
                              onMouseDown={(event) => event.preventDefault()}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                            </IconButton>
                          </InputAdornment>
                        }
                      />

                      {touched.password && errors.password && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
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
          <Button onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => formikRef.current?.submitForm()}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : selectedUser ? 'Update User' : 'Save User'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
