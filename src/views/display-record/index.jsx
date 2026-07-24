import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ServerTable from 'ui-component/tables/server-side-custom-table';

import MainCard from 'ui-component/cards/MainCard';
import useAxios from '../../api/useAxios';
import recordSchema from './recordSchema';
import { formatDate } from 'utils/helper-function';

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


const getOptionName = (options, currentValue) => {
  if (
    currentValue === null ||
    currentValue === undefined ||
    currentValue === ''
  ) {
    return '';
  }

  const selectedOption = options.find(
    (option) => String(option?.id) === String(currentValue)
  );

  return selectedOption
    ? String(selectedOption?.name ?? selectedOption?.value ?? '')
    : '';
};

const getInitialRecordId = (...values) => {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    if (
      typeof value === 'object' &&
      value?.id !== undefined
    ) {
      return String(value.id);
    }

    if (/^\d+$/.test(String(value))) {
      return String(value);
    }
  }

  return '';
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

const SearchableSelectField = ({
  id,
  label,
  name,
  value,
  options,
  error,
  touched,
  loading,
  disabled = false,
  setFieldValue,
  setFieldTouched,
  onValueChange
}) => {
  const selectedOption =
    options.find(
      (option) => String(option?.id) === String(value)
    ) || null;

  return (
    <Autocomplete
      id={id}
      options={options}
      value={selectedOption}
      loading={loading}
      disabled={disabled || loading}
      autoHighlight
      clearOnEscape
      isOptionEqualToValue={(option, selectedValue) =>
        String(option?.id) === String(selectedValue?.id)
      }
      getOptionLabel={(option) =>
        String(option?.name || '')
      }
      onChange={(_, selectedValue) => {
        const nextValue =
          selectedValue?.id !== undefined
            ? String(selectedValue.id)
            : '';

        if (onValueChange) {
          onValueChange(nextValue);
          return;
        }

        setFieldValue(name, nextValue);
      }}
      onBlur={() => {
        setFieldTouched(name, true);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          error={Boolean(touched && error)}
          helperText={touched && error ? error : ''}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress size={18} />
                ) : null}

                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

const DisplayRecordFormFields = ({
  api,
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  setFieldValue,
  setFieldTouched,
  regionOptions,
  isRegionsLoading,
  selectedRecord,
  saveError
}) => {
  const hydrationRef = useRef({
    record: selectedRecord,
    store: false,
    table_type: false,
    product: false,
    security_type: false
  });
  useEffect(() => {
    hydrationRef.current = {
      record: selectedRecord,
      store: false,
      table_type: false,
      product: false,
      security_type: false
    };
  }, [selectedRecord]);

  const selectedRegionName = useMemo(
    () => getOptionName(regionOptions, values.region),
    [regionOptions, values.region]
  );

  const {
    data: storeOptionsData,
    isFetching: isStoresLoading
  } = useQuery({
    queryKey: ['store-name-list', selectedRegionName],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/store-name-list',
        {
          params: {
            region: selectedRegionName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(selectedRegionName)
  });

  const storeOptions = useMemo(
    () => getListFromResponse(storeOptionsData),
    [storeOptionsData]
  );

  const selectedStoreName = useMemo(
    () => getOptionName(storeOptions, values.store),
    [storeOptions, values.store]
  );

  const {
    data: tableOptionsData,
    isFetching: isTableTypesLoading
  } = useQuery({
    queryKey: [
      'table-name-list',
      selectedRegionName,
      selectedStoreName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/table-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName
    )
  });

  const tableTypeOptions = useMemo(
    () => getListFromResponse(tableOptionsData),
    [tableOptionsData]
  );

  const selectedTableTypeName = useMemo(
    () => getOptionName(tableTypeOptions, values.table_type),
    [tableTypeOptions, values.table_type]
  );

  const {
    data: productOptionsData,
    isFetching: isProductsLoading
  } = useQuery({
    queryKey: [
      'product-name-list',
      selectedRegionName,
      selectedStoreName,
      selectedTableTypeName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/product-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName,
            table_type: selectedTableTypeName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName &&
      selectedTableTypeName
    )
  });

  const productOptions = useMemo(
    () => getListFromResponse(productOptionsData),
    [productOptionsData]
  );

  const selectedProductName = useMemo(
    () => getOptionName(productOptions, values.product),
    [productOptions, values.product]
  );

  const {
    data: securityOptionsData,
    isFetching: isSecurityTypesLoading
  } = useQuery({
    queryKey: [
      'security-name-list',
      selectedRegionName,
      selectedStoreName,
      selectedTableTypeName,
      selectedProductName
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/security-name-list',
        {
          params: {
            region: selectedRegionName,
            store: selectedStoreName,
            table_type: selectedTableTypeName,
            product: selectedProductName
          }
        }
      );

      return response.data;
    },
    enabled: Boolean(
      selectedRegionName &&
      selectedStoreName &&
      selectedTableTypeName &&
      selectedProductName
    )
  });

  const securityTypeOptions = useMemo(
    () => getListFromResponse(securityOptionsData),
    [securityOptionsData]
  );

  useEffect(() => {
    if (
      !selectedRecord ||
      hydrationRef.current.store
    ) {
      return;
    }

    if (values.store) {
      hydrationRef.current.store = true;
      return;
    }

    if (!values.region || storeOptions.length === 0) {
      return;
    }

    const storeId = getOptionId(
      storeOptions,
      selectedRecord?.store_id ??
      selectedRecord?.store_name ??
      selectedRecord?.store
    );

    hydrationRef.current.store = true;

    if (storeId) {
      setFieldValue('store', storeId, false);
    }
  }, [
    selectedRecord,
    values.region,
    values.store,
    storeOptions,
    setFieldValue
  ]);

  useEffect(() => {
    if (
      !selectedRecord ||
      hydrationRef.current.table_type
    ) {
      return;
    }

    if (values.table_type) {
      hydrationRef.current.table_type = true;
      return;
    }

    if (
      !values.region ||
      !values.store ||
      tableTypeOptions.length === 0
    ) {
      return;
    }

    const tableTypeId = getOptionId(
      tableTypeOptions,
      selectedRecord?.table_type_id ??
      selectedRecord?.table_type_name ??
      selectedRecord?.table_type
    );

    hydrationRef.current.table_type = true;

    if (tableTypeId) {
      setFieldValue('table_type', tableTypeId, false);
    }
  }, [
    selectedRecord,
    values.region,
    values.store,
    values.table_type,
    tableTypeOptions,
    setFieldValue
  ]);

  useEffect(() => {
    if (
      !selectedRecord ||
      hydrationRef.current.product
    ) {
      return;
    }

    if (values.product) {
      hydrationRef.current.product = true;
      return;
    }

    if (
      !values.region ||
      !values.store ||
      !values.table_type ||
      productOptions.length === 0
    ) {
      return;
    }

    const productId = getOptionId(
      productOptions,
      selectedRecord?.product_id ??
      selectedRecord?.product_name ??
      selectedRecord?.product
    );

    hydrationRef.current.product = true;

    if (productId) {
      setFieldValue('product', productId, false);
    }
  }, [
    selectedRecord,
    values.region,
    values.store,
    values.table_type,
    values.product,
    productOptions,
    setFieldValue
  ]);

  useEffect(() => {
    if (
      !selectedRecord ||
      hydrationRef.current.security_type
    ) {
      return;
    }

    if (values.security_type) {
      hydrationRef.current.security_type = true;
      return;
    }

    if (
      !values.region ||
      !values.store ||
      !values.table_type ||
      !values.product ||
      securityTypeOptions.length === 0
    ) {
      return;
    }

    const securityTypeId = getOptionId(
      securityTypeOptions,
      selectedRecord?.security_type_id ??
      selectedRecord?.security_type_name ??
      selectedRecord?.security_type
    );

    hydrationRef.current.security_type = true;

    if (securityTypeId) {
      setFieldValue('security_type', securityTypeId, false);
    }
  }, [
    selectedRecord,
    values.region,
    values.store,
    values.table_type,
    values.product,
    values.security_type,
    securityTypeOptions,
    setFieldValue
  ]);

  const clearFields = (fieldNames) => {
    fieldNames.forEach((fieldName) => {
      setFieldValue(fieldName, '', false);
      setFieldTouched(fieldName, false, false);
    });
  };

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {saveError && (
        <Alert severity="error">
          {getErrorMessage(saveError)}
        </Alert>
      )}

      <SearchableSelectField
        id="display-record-region"
        name="region"
        label="Region"
        value={values.region}
        options={regionOptions}
        loading={isRegionsLoading}
        touched={touched.region}
        error={errors.region}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          hydrationRef.current.store = true;
          hydrationRef.current.table_type = true;
          hydrationRef.current.product = true;
          hydrationRef.current.security_type = true;
          setFieldValue('region', nextValue);
          clearFields([
            'store',
            'table_type',
            'product',
            'security_type'
          ]);
        }}
      />

      <SearchableSelectField
        id="display-record-store"
        name="store"
        label="Store"
        value={values.store}
        options={storeOptions}
        loading={isStoresLoading}
        disabled={!values.region}
        touched={touched.store}
        error={errors.store}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          hydrationRef.current.table_type = true;
          hydrationRef.current.product = true;
          hydrationRef.current.security_type = true;
          setFieldValue('store', nextValue);
          clearFields([
            'table_type',
            'product',
            'security_type'
          ]);
        }}
      />

      <SearchableSelectField
        id="display-record-table-type"
        name="table_type"
        label="Table Type"
        value={values.table_type}
        options={tableTypeOptions}
        loading={isTableTypesLoading}
        disabled={!values.region || !values.store}
        touched={touched.table_type}
        error={errors.table_type}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          hydrationRef.current.product = true;
          hydrationRef.current.security_type = true;
          setFieldValue('table_type', nextValue);
          clearFields(['product', 'security_type']);
        }}
      />

      <SearchableSelectField
        id="display-record-product"
        name="product"
        label="Product"
        value={values.product}
        options={productOptions}
        loading={isProductsLoading}
        disabled={
          !values.region ||
          !values.store ||
          !values.table_type
        }
        touched={touched.product}
        error={errors.product}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
        onValueChange={(nextValue) => {
          hydrationRef.current.security_type = true;
          setFieldValue('product', nextValue);
          clearFields(['security_type']);
        }}
      />

      <SearchableSelectField
        id="display-record-security-type"
        name="security_type"
        label="Security Type"
        value={values.security_type}
        options={securityTypeOptions}
        loading={isSecurityTypesLoading}
        disabled={
          !values.region ||
          !values.store ||
          !values.table_type ||
          !values.product
        }
        touched={touched.security_type}
        error={errors.security_type}
        setFieldValue={setFieldValue}
        setFieldTouched={setFieldTouched}
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
  );
};

export default function DisplayRecordsPage() {
  const api = useAxios();
  const queryClient = useQueryClient();
  const formikRef = useRef(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleOpenCreate = useCallback(() => {
    setSelectedRecord(null);
    setOpen(true);
  }, []);

  const handleOpenEdit = useCallback((record) => {
    setSelectedRecord(record);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedRecord(null);
  }, []);

  const handleDelete = useCallback((record) => {
    setSelectedRecord(record);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setSelectedRecord(null);
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
    data: recordData,
    isLoading,
    isFetching,
    isError,
    error
  } = useQuery({
    queryKey: [
      'display-record-list',
      page,
      rowsPerPage,
      search
    ],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/record-list',
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

  const {
    data: regionOptionsData,
    isLoading: isRegionsLoading
  } = useQuery({
    queryKey: ['region-name-list'],
    queryFn: async () => {
      const response = await api.get(
        '/api/inventory/region-name-list'
      );

      return response.data;
    }
  });

  const records = useMemo(
    () => getListFromResponse(recordData),
    [recordData]
  );

  const regionOptions = useMemo(
    () => getListFromResponse(regionOptionsData),
    [regionOptionsData]
  );

  const totalRecords = Number(recordData?.count || 0);

  useEffect(() => {
    const totalPages = Number(recordData?.total_pages || 0);

    if (totalPages > 0 && page >= totalPages) {
      setPage(Math.max(totalPages - 1, 0));
    }
  }, [recordData?.total_pages, page]);

  const initialValues = useMemo(
    () => ({
      region:
        getInitialRecordId(
          selectedRecord?.region_id,
          selectedRecord?.region
        ) ||
        getOptionId(
          regionOptions,
          selectedRecord?.region_name ??
          selectedRecord?.region
        ),
      store: getInitialRecordId(
        selectedRecord?.store_id,
        selectedRecord?.store
      ),
      table_type: getInitialRecordId(
        selectedRecord?.table_type_id,
        selectedRecord?.table_type
      ),
      product: getInitialRecordId(
        selectedRecord?.product_id,
        selectedRecord?.product
      ),
      security_type: getInitialRecordId(
        selectedRecord?.security_type_id,
        selectedRecord?.security_type
      ),
      table_number: selectedRecord?.table_number ?? '',
      quantity: selectedRecord?.quantity ?? 1,
      keyboard: selectedRecord?.keyboard ?? '',
      pen: selectedRecord?.pen ?? ''
    }),
    [selectedRecord, regionOptions]
  );

  const createRecordMutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        region: Number(values.region),
        store: Number(values.store),
        table_type: Number(values.table_type),
        product: Number(values.product),
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
        region: Number(values.region),
        store: Number(values.store),
        table_type: Number(values.table_type),
        product: Number(values.product),
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

  const handleDeleteConfirm = () => {
    if (!selectedRecord?.id) {
      return;
    }

    deleteRecordMutation.mutate(selectedRecord.id);
  };

  const handleSubmit = (values) => {
    if (selectedRecord?.id) {
      updateRecordMutation.mutate(values);
      return;
    }

    createRecordMutation.mutate(values);
  };

  const recordColumns = useMemo(
    () => [
      {
        id: 'store_name',
        label: 'Store',
        minWidth: 150,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.store_name || '-'
      },
      {
        id: 'table_type_name',
        label: 'Table Type',
        minWidth: 130,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.table_type_name || '-'
      },
      {
        id: 'product_name',
        label: 'Product',
        minWidth: 380,
        width: 380,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          minWidth: 380,
          width: 380,
          whiteSpace: 'normal'
        },
        render: (record) => (
          <Typography
            variant="body2"
            title={record?.product_name || ''}
            sx={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
              lineHeight: 1.5,
              whiteSpace: 'normal',
              overflowWrap: 'break-word'
            }}
          >
            {record?.product_name || '-'}
          </Typography>
        )
      },
      {
        id: 'product_sku',
        label: 'Product SKU',
        minWidth: 140,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.product_sku || '-'
      },
      {
        id: 'branch_code',
        label: 'Branch Code',
        minWidth: 130,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.branch_code || '-'
      },
      {
        id: 'store_code',
        label: 'Store Code',
        minWidth: 120,
        align: 'center',
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.store_code || '-'
      },
      {
        id: 'security_type_name',
        label: 'Security Type',
        minWidth: 150,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.security_type_name || '-'
      },
      {
        id: 'table_number',
        label: 'Table #',
        minWidth: 90,
        align: 'center',
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.table_number ?? '-'
      },
      {
        id: 'quantity',
        label: 'Quantity',
        minWidth: 90,
        align: 'center',
        sx: {
          whiteSpace: 'nowrap',
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.quantity ?? '-'
      },
      {
        id: 'keyboard',
        label: 'Keyboard',
        minWidth: 100,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.keyboard || '-'
      },
      {
        id: 'pen',
        label: 'Pen',
        minWidth: 80,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => record?.pen || '-'
      },
      {
        id: 'created_at',
        label: 'Created At',
        minWidth: 130,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => formatDate(record?.created_at)
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 110,
        sx: {
          whiteSpace: 'nowrap'
        },
        cellSx: {
          whiteSpace: 'nowrap'
        },
        render: (record) => (
          <>
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
          </>
        )
      }
    ],
    [handleOpenEdit, handleDelete]
  );

  const isSaving =
    createRecordMutation.isPending ||
    updateRecordMutation.isPending;

  const saveError =
    createRecordMutation.error ||
    updateRecordMutation.error;

  return (
    <>
      <MainCard
        title="Display Records"
        secondary={
          <Button
            variant="contained"
            onClick={handleOpenCreate}
            disabled={isRegionsLoading}
          >
            Add Display Record
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage products assigned to regions, stores, tables and
            security types.
          </Typography>

          <ServerTable
            columns={recordColumns}
            rows={records}
            getRowId={(record) => record.id}
            loading={isLoading}
            fetching={isFetching}
            error={
              isError
                ? {
                  message: getErrorMessage(error)
                }
                : null
            }
            emptyMessage="No display records found."
            searchValue={search}
            searchPlaceholder="Search display records..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalRecords}
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
          Delete Display Record
        </DialogTitle>

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
              {getErrorMessage(
                deleteRecordMutation.error
              )}
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
              setFieldTouched,
              handleSubmit: submitForm
            }) => (
              <form onSubmit={submitForm}>
                <DisplayRecordFormFields
                  api={api}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  setFieldValue={setFieldValue}
                  setFieldTouched={setFieldTouched}
                  regionOptions={regionOptions}
                  isRegionsLoading={isRegionsLoading}
                  selectedRecord={selectedRecord}
                  saveError={saveError}
                />
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
            onClick={() =>
              formikRef.current?.submitForm()
            }
            disabled={isSaving || isRegionsLoading}
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