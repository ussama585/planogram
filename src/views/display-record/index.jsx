import { useMemo, useRef, useState } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

import MainCard from 'ui-component/cards/MainCard';
import useAxios from '../../api/useAxios';

const recordSchema = Yup.object({
  product: Yup.string().required('Product is required'),
  store: Yup.string().required('Store is required'),
  table_type: Yup.string().required('Table type is required'),
  security_type: Yup.string().required('Security type is required'),
  table_number: Yup.number()
    .typeError('Table number must be a number')
    .integer('Table number must be an integer')
    .min(1, 'Table number must be at least 1')
    .required('Table number is required'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .integer('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .required('Quantity is required'),
  keyboard: Yup.string().nullable(),
  pen: Yup.string().nullable()
});

const getListFromResponse = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.data?.results)) {
    return responseData.data.results;
  }

  return [];
};

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const getOptionId = (options, currentValue) => {
  if (
    currentValue === null ||
    currentValue === undefined ||
    currentValue === ''
  ) {
    return '';
  }

  if (
    typeof currentValue === 'object' &&
    currentValue?.id !== undefined
  ) {
    return String(currentValue.id);
  }

  const optionById = options.find(
    (option) => String(option?.id) === String(currentValue)
  );

  if (optionById) {
    return String(optionById.id);
  }

  const optionByName = options.find(
    (option) =>
      normalizeText(option?.name) === normalizeText(currentValue)
  );

  return optionByName ? String(optionByName.id) : '';
};

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

const SelectField = ({
  id,
  label,
  name,
  value,
  options,
  error,
  touched,
  onChange,
  onBlur,
  loading
}) => {
  return (
    <FormControl fullWidth error={Boolean(touched && error)}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>

      <Select
        labelId={`${id}-label`}
        id={id}
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={loading}
      >
        {options.map((option) => (
          <MenuItem key={option?.id} value={String(option?.id)}>
            {option?.name || option?.id}
          </MenuItem>
        ))}
      </Select>

      {touched && error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </FormControl>
  );
};

export default function DisplayRecordsPage() {
  const api = useAxios();
  const queryClient = useQueryClient();
  const formikRef = useRef(null);

  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const {
    data: recordData,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: ['display-record-list', page],
    queryFn: async () => {
      const response = await api.get('/api/inventory/record-list', {
        params: {
          page
        }
      });

      return response.data;
    },
    placeholderData: (previousData) => previousData
  });

  const {
    data: productOptionsData,
    isLoading: isProductsLoading
  } = useQuery({
    queryKey: ['product-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/product-name-list'
      );

      return response.data;
    }
  });

  const {
    data: storeOptionsData,
    isLoading: isStoresLoading
  } = useQuery({
    queryKey: ['store-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/store-name-list'
      );

      return response.data;
    }
  });

  const {
    data: tableOptionsData,
    isLoading: isTableTypesLoading
  } = useQuery({
    queryKey: ['table-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/table-name-list'
      );

      return response.data;
    }
  });

  const {
    data: securityOptionsData,
    isLoading: isSecurityTypesLoading
  } = useQuery({
    queryKey: ['security-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/security-name-list'
      );

      return response.data;
    }
  });

  const records = useMemo(
    () => getListFromResponse(recordData),
    [recordData]
  );

  const productOptions = useMemo(
    () => getListFromResponse(productOptionsData),
    [productOptionsData]
  );

  const storeOptions = useMemo(
    () => getListFromResponse(storeOptionsData),
    [storeOptionsData]
  );

  const tableTypeOptions = useMemo(
    () => getListFromResponse(tableOptionsData),
    [tableOptionsData]
  );

  const securityTypeOptions = useMemo(
    () => getListFromResponse(securityOptionsData),
    [securityOptionsData]
  );

  const optionsLoading =
    isProductsLoading ||
    isStoresLoading ||
    isTableTypesLoading ||
    isSecurityTypesLoading;

  const initialValues = useMemo(
    () => ({
      product: getOptionId(
        productOptions,
        selectedRecord?.product_id ??
        selectedRecord?.product_name
      ),
      store: getOptionId(
        storeOptions,
        selectedRecord?.store_id ??
        selectedRecord?.store_name
      ),
      table_type: getOptionId(
        tableTypeOptions,
        selectedRecord?.table_type_id ??
        selectedRecord?.table_type_name
      ),
      security_type: getOptionId(
        securityTypeOptions,
        selectedRecord?.security_type_id ??
        selectedRecord?.security_type_name
      ),
      table_number: selectedRecord?.table_number ?? '',
      quantity: selectedRecord?.quantity ?? 1,
      keyboard: selectedRecord?.keyboard ?? '',
      pen: selectedRecord?.pen ?? ''
    }),
    [
      selectedRecord,
      productOptions,
      storeOptions,
      tableTypeOptions,
      securityTypeOptions
    ]
  );

  const createRecordMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        product: Number(values.product),
        store: Number(values.store),
        table_type: Number(values.table_type),
        security_type: Number(values.security_type),
        table_number: Number(values.table_number),
        quantity: Number(values.quantity),
        keyboard: values.keyboard?.trim() || '',
        pen: values.pen?.trim() || ''
      };

      const response = await api.post(
        '/api/inventory/record-create',
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['display-record-list']
      });

      setOpen(false);
      setSelectedRecord(null);
    }
  });

  const updateRecordMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        product: Number(values.product),
        store: Number(values.store),
        table_type: Number(values.table_type),
        security_type: Number(values.security_type),
        table_number: Number(values.table_number),
        quantity: Number(values.quantity),
        keyboard: values.keyboard?.trim() || '',
        pen: values.pen?.trim() || ''
      };

      const response = await api.patch(
        `/api/inventory/record-detail/${selectedRecord?.id}`,
        payload
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['display-record-list']
      });

      setOpen(false);
      setSelectedRecord(null);
    }
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await api.delete(
        `/api/inventory/record-detail/${recordId}`
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['display-record-list']
      });

      setDeleteOpen(false);
      setSelectedRecord(null);
    }
  });

  const handleOpenCreate = () => {
    setSelectedRecord(null);
    setOpen(true);
  };

  const handleOpenEdit = (record) => {
    setSelectedRecord(record);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRecord(null);
  };

  const handleDelete = (record) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedRecord(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedRecord?.id) {
      deleteRecordMutation.mutate(selectedRecord.id);
    }
  };

  const handleSubmit = (values) => {
    if (selectedRecord?.id) {
      updateRecordMutation.mutate(values);
      return;
    }

    createRecordMutation.mutate(values);
  };

  const isSaving =
    createRecordMutation.isPending ||
    updateRecordMutation.isPending;

  const saveError =
    createRecordMutation.error ||
    updateRecordMutation.error;

  const totalRecords = Number(recordData?.count) || 0;
  const currentPage = Number(recordData?.current_page) || page;
  const totalPages = Number(recordData?.total_pages) || 1;
  const hasPreviousPage = Boolean(recordData?.previous);
  const hasNextPage = Boolean(recordData?.next);

  return (
    <>
      <MainCard
        title="Display Records"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            disabled={optionsLoading}
          >
            Add Display Record
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage products assigned to stores, tables and security
            types.
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            {isLoading ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ py: 6 }}
              >
                <CircularProgress />
              </Stack>
            ) : isError ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ py: 6 }}
              >
                <Typography color="error">
                  Failed to load display records:{' '}
                  {getErrorMessage(error)}
                </Typography>
              </Stack>
            ) : (
              <Table
                size="small"
                sx={{
                  minWidth: 1700
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Product SKU</TableCell>
                    <TableCell>Branch Code</TableCell>
                    <TableCell>Store Code</TableCell>
                    <TableCell>Store</TableCell>
                    <TableCell>Table Type</TableCell>
                    <TableCell>Security Type</TableCell>
                    <TableCell>Table #</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Keyboard</TableCell>
                    <TableCell>Pen</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.length > 0 ? (
                    records.map((record, index) => (
                      <TableRow
                        key={record?.id || `display-record-${index}`}
                        hover
                      >
                        <TableCell
                          sx={{
                            minWidth: 260,
                            maxWidth: 360
                          }}
                        >
                          <Typography
                            variant="body2"
                            title={record?.product_name}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {record?.product_name || '-'}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {record?.product_sku || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.branch_code || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.store_code || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.store_name || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.table_type_name || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.security_type_name || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.table_number ?? '-'}
                        </TableCell>

                        <TableCell>
                          {record?.quantity ?? '-'}
                        </TableCell>

                        <TableCell>
                          {record?.keyboard || '-'}
                        </TableCell>

                        <TableCell>
                          {record?.pen || '-'}
                        </TableCell>

                        <TableCell>
                          {formatDate(record?.created_at)}
                        </TableCell>

                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(record)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(record)}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={13} align="center">
                        No display records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>

          <Stack
            direction={{
              xs: 'column',
              sm: 'row'
            }}
            alignItems={{
              xs: 'flex-start',
              sm: 'center'
            }}
            justifyContent="space-between"
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              Total records: {totalRecords}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                disabled={!hasPreviousPage || isFetching}
                onClick={() => {
                  setPage((currentValue) =>
                    Math.max(1, currentValue - 1)
                  );
                }}
              >
                Previous
              </Button>

              <Typography variant="body2">
                Page {currentPage} of {totalPages}
              </Typography>

              <Button
                variant="outlined"
                disabled={!hasNextPage || isFetching}
                onClick={() => {
                  setPage((currentValue) => currentValue + 1);
                }}
              >
                Next
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </MainCard>

      <Dialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Display Record</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete the display record for{' '}
            <strong>
              {selectedRecord?.product_name || 'this product'}
            </strong>
            ?
          </Typography>

          {deleteRecordMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getErrorMessage(deleteRecordMutation.error)}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteClose}
            disabled={deleteRecordMutation.isPending}
          >
            No
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteRecordMutation.isPending}
          >
            {deleteRecordMutation.isPending
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
          {selectedRecord
            ? 'Edit Display Record'
            : 'Add Display Record'}
        </DialogTitle>

        <DialogContent>
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            enableReinitialize
            validationSchema={recordSchema}
            onSubmit={handleSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
              handleSubmit: submitForm
            }) => (
              <form onSubmit={submitForm}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {saveError && (
                    <Alert severity="error">
                      {getErrorMessage(saveError)}
                    </Alert>
                  )}

                  <SelectField
                    id="display-record-product"
                    name="product"
                    label="Product"
                    value={values.product}
                    options={productOptions}
                    loading={isProductsLoading}
                    touched={touched.product}
                    error={errors.product}
                    onChange={(event) =>
                      setFieldValue('product', event.target.value)
                    }
                    onBlur={handleBlur}
                  />

                  <SelectField
                    id="display-record-store"
                    name="store"
                    label="Store"
                    value={values.store}
                    options={storeOptions}
                    loading={isStoresLoading}
                    touched={touched.store}
                    error={errors.store}
                    onChange={(event) =>
                      setFieldValue('store', event.target.value)
                    }
                    onBlur={handleBlur}
                  />

                  <SelectField
                    id="display-record-table-type"
                    name="table_type"
                    label="Table Type"
                    value={values.table_type}
                    options={tableTypeOptions}
                    loading={isTableTypesLoading}
                    touched={touched.table_type}
                    error={errors.table_type}
                    onChange={(event) =>
                      setFieldValue('table_type', event.target.value)
                    }
                    onBlur={handleBlur}
                  />

                  <SelectField
                    id="display-record-security-type"
                    name="security_type"
                    label="Security Type"
                    value={values.security_type}
                    options={securityTypeOptions}
                    loading={isSecurityTypesLoading}
                    touched={touched.security_type}
                    error={errors.security_type}
                    onChange={(event) =>
                      setFieldValue(
                        'security_type',
                        event.target.value
                      )
                    }
                    onBlur={handleBlur}
                  />

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.table_number &&
                      errors.table_number
                    )}
                  >
                    <InputLabel htmlFor="display-record-table-number">
                      Table Number
                    </InputLabel>

                    <OutlinedInput
                      id="display-record-table-number"
                      name="table_number"
                      label="Table Number"
                      type="number"
                      value={values.table_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.table_number &&
                      errors.table_number && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mt: 0.5 }}
                        >
                          {errors.table_number}
                        </Typography>
                      )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(
                      touched.quantity && errors.quantity
                    )}
                  >
                    <InputLabel htmlFor="display-record-quantity">
                      Quantity
                    </InputLabel>

                    <OutlinedInput
                      id="display-record-quantity"
                      name="quantity"
                      label="Quantity"
                      type="number"
                      value={values.quantity}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    {touched.quantity && errors.quantity && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5 }}
                      >
                        {errors.quantity}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel htmlFor="display-record-keyboard">
                      Keyboard
                    </InputLabel>

                    <OutlinedInput
                      id="display-record-keyboard"
                      name="keyboard"
                      label="Keyboard"
                      value={values.keyboard}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel htmlFor="display-record-pen">
                      Pen
                    </InputLabel>

                    <OutlinedInput
                      id="display-record-pen"
                      name="pen"
                      label="Pen"
                      value={values.pen}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </FormControl>
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
            disabled={isSaving || optionsLoading}
          >
            {isSaving
              ? 'Saving...'
              : selectedRecord
                ? 'Update Record'
                : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}