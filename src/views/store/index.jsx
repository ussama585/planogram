import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Formik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
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
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

import MainCard from 'ui-component/cards/MainCard';
import useAxios from '../../api/useAxios';
import storeSchema from './storeSchema';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ServerTable from 'ui-component/tables/server-side-custom-table';

const normalizeImageTitles = (imageTitles) => {
  if (Array.isArray(imageTitles)) {
    return imageTitles.map((title) => String(title ?? '').trim());
  }

  if (typeof imageTitles === 'string') {
    return imageTitles
      .split(',')
      .map((title) => title.trim());
  }

  return [];
};

const normalizeStoreImages = (store) => {
  if (!store) return [];

  const imageTitles = normalizeImageTitles(
    store?.image_titles || store?.imageTitles
  );

  const rawImages = Array.isArray(store?.images)
    ? store.images
    : Array.isArray(store?.store_images)
      ? store.store_images
      : Array.isArray(store?.image_urls)
        ? store.image_urls
        : [];

  return rawImages
    .map((image, index) => {
      if (typeof image === 'string') {
        const title = imageTitles[index] || '';

        return {
          id: null,
          url: image,
          file: null,
          title,
          originalTitle: title,
          isObjectUrl: false,
          isNew: false
        };
      }

      const url =
        image?.image ||
        image?.url ||
        image?.image_url ||
        image?.file ||
        image?.path ||
        '';

      if (!url) return null;

      const title =
        image?.title ||
        image?.image_title ||
        imageTitles[index] ||
        '';

      return {
        id: image?.id ?? null,
        url,
        file: null,
        title,
        originalTitle: title,
        isObjectUrl: false,
        isNew: false
      };
    })
    .filter(Boolean);
};

const buildStoreFormData = (
  values,
  newImages = [],
  storeId = null
) => {
  const formData = new FormData();

  if (storeId) {
    formData.append('id', storeId);
  }

  formData.append('name', values.name || '');
  formData.append('store_code', values.store_code || '');
  formData.append('branch_code', values.branch_code || '');
  formData.append('region', values.region || '');
  formData.append('city', values.city || '');
  formData.append('area', values.area || '');

  if (storeId) {
    formData.append(
      'region_name',
      values.region_name || ''
    );

    formData.append(
      'is_active',
      String(values.is_active ?? true)
    );
  }

  newImages.forEach((image, index) => {
    if (!(image.file instanceof File)) return;

    formData.append(
      `image_data[${index}][image]`,
      image.file
    );

    formData.append(
      `image_data[${index}][image_title]`,
      String(image.title || '').trim()
    );
  });

  return formData;
};

export default function StorePage() {
  const api = useAxios();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  const handleTableSearchChange = useCallback((value) => {
    const normalizedValue = String(value || '').trim();

    setSearch((previousSearch) => {
      if (previousSearch === normalizedValue) {
        return previousSearch;
      }

      return normalizedValue;
    });

    setPage(0);
  }, []);

  const handleTablePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleTableRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const imagePreviewsRef = useRef([]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((image) => {
        if (image?.isObjectUrl && image?.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, []);

  const {
    data: storeData,
    isLoading,
    isError,
    error,
    isFetching
  } = useQuery({
    queryKey: ['store-list', page, rowsPerPage, search],
    queryFn: async () => {
      const response = await api.get('/api/inventory/store-list', {
        params: {
          page: page + 1,
          size: rowsPerPage,
          ...(search && { search })
        }
      });

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
      const response = await api.get('/api/inventory/region-name-list');
      return response.data;
    }
  });

  const regionOptions = useMemo(() => {
    if (Array.isArray(regionOptionsData)) return regionOptionsData;
    return [];
  }, [regionOptionsData]);

  const stores = useMemo(() => {
    return Array.isArray(storeData?.results)
      ? storeData.results
      : [];
  }, [storeData]);

  const totalStores = Number(storeData?.count || 0);

  const storeColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        render: (store, index) =>
          store?.name ||
          `Store ${page * rowsPerPage + index + 1}`
      },
      {
        id: 'store_code',
        label: 'Store Code',
        render: (store) => store?.store_code || '-'
      },
      {
        id: 'branch_code',
        label: 'Branch Code',
        render: (store) => store?.branch_code || '-'
      },
      {
        id: 'region',
        label: 'Region',
        render: (store) =>
          store?.region_name ||
          store?.region ||
          '-'
      },
      {
        id: 'city',
        label: 'City',
        render: (store) => store?.city || '-'
      },
      {
        id: 'area',
        label: 'Area',
        render: (store) => store?.area || '-'
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        render: (store) => (
          <>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenEdit(store)}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(store)}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )
      }
    ],
    [page, rowsPerPage]
  );

  const selectedStoreImages = useMemo(
    () => normalizeStoreImages(selectedStore),
    [selectedStore]
  );

  const createStoreMutation = useMutation({
    mutationFn: async (values) => {
      const newImages = imagePreviews.filter(
        (image) =>
          image.file instanceof File
      );

      const payload = buildStoreFormData(
        values,
        newImages
      );

      const response = await api.post(
        '/api/inventory/store-create',
        payload,
        {
          timeout: 60000
        }
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['store-list']
      });

      setOpen(false);
      setSelectedStore(null);
      setImagePreviews([]);
    }
  });

  const updateStoreMutation = useMutation({
    mutationFn: async (values) => {
      const newImages = imagePreviews.filter(
        (image) =>
          !image.id &&
          image.file instanceof File
      );

      const changedExistingImages =
        getChangedExistingImages();

      const storePayload =
        buildStoreFormData(
          values,
          newImages,
          selectedStore?.id
        );

      const storeResponse = await api.patch(
        `/api/inventory/store-detail/${selectedStore?.id}`,
        storePayload,
        {
          timeout: 60000
        }
      );

      await Promise.all(
        changedExistingImages.map(
          updateExistingStoreImage
        )
      );

      return storeResponse.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['store-list']
      });

      queryClient.invalidateQueries({
        queryKey: ['inventory-display-overview']
      });

      setOpen(false);
      setSelectedStore(null);
      setImagePreviews([]);
    },

    onError: (error) => {
      console.error('Update store error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
  });

  const deleteStoreImageMutation = useMutation({
    mutationFn: async (imageId) => {
      const response = await api.delete(
        `/api/inventory/store-image/${imageId}`
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['store-list']
      });

      queryClient.invalidateQueries({
        queryKey: ['inventory-display-overview']
      });
    }
  });

  const removeLocalImage = (imageIndex) => {
    setImagePreviews((currentImages) => {
      const removedImage =
        currentImages[imageIndex];

      if (
        removedImage?.isObjectUrl &&
        removedImage?.url
      ) {
        URL.revokeObjectURL(
          removedImage.url
        );
      }

      return currentImages.filter(
        (_, index) => index !== imageIndex
      );
    });
  };

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId) => {
      const response = await api.delete(`/api/inventory/store-detail/${storeId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-list'] });
      setDeleteOpen(false);
      setSelectedStore(null);
    }
  });

  const handleOpenCreate = () => {
    setSelectedStore(null);
    setImagePreviews([]);
    setOpen(true);
  };

  const handleOpenEdit = (store) => {
    const existingImages = normalizeStoreImages(store);

    setSelectedStore(store);
    setImagePreviews(existingImages);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStore(null);
    setImagePreviews([]);
  };

  const handleDelete = (store) => {
    setSelectedStore(store);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedStore?.id) {
      deleteStoreMutation.mutate(selectedStore.id);
    }
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setSelectedStore(null);
  };

  const handleReplaceImage = (
    imageIndex,
    file
  ) => {
    if (!file) return;

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreviews((currentImages) =>
      currentImages.map((image, index) => {
        if (index !== imageIndex) {
          return image;
        }

        if (
          image.isObjectUrl &&
          image.url
        ) {
          URL.revokeObjectURL(image.url);
        }

        return {
          ...image,
          url: previewUrl,
          file,
          name: file.name,
          isObjectUrl: true
        };
      })
    );
  };

  const handleImageTitleChange = (
    imageIndex,
    title
  ) => {
    setImagePreviews((currentImages) =>
      currentImages.map((image, index) =>
        index === imageIndex
          ? {
            ...image,
            title
          }
          : image
      )
    );
  };

  const updateExistingStoreImage = async (
    image
  ) => {
    const payload = new FormData();

    if (image.file instanceof File) {
      payload.append('image', image.file);
    }

    payload.append(
      'image_title',
      String(image.title || '').trim()
    );

    const response = await api.patch(
      `/api/inventory/store-image/${image.id}`,
      payload,
      {
        timeout: 60000
      }
    );

    return response.data;
  };

  const getChangedExistingImages = () =>
    imagePreviews.filter((image) => {
      if (!image.id) return false;

      const titleChanged =
        String(image.title || '').trim() !==
        String(image.originalTitle || '').trim();

      return (
        image.file instanceof File ||
        titleChanged
      );
    });

  const handleRemoveImage = async (
    image,
    imageIndex
  ) => {
    if (!image.id) {
      removeLocalImage(imageIndex);
      return;
    }

    try {
      await deleteStoreImageMutation.mutateAsync(
        image.id
      );

      removeLocalImage(imageIndex);
    } catch (error) {
      console.error('Delete image error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
  };

  return (
    <>
      <MainCard
        title="Stores"
        secondary={
          <Button variant="contained" onClick={handleOpenCreate}>
            Add Store
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Manage your stores and their regional coverage.
          </Typography>
          <ServerTable
            columns={storeColumns}
            rows={stores}
            getRowId={(store) => store.id}
            loading={isLoading}
            fetching={isFetching}
            error={isError ? error : null}
            emptyMessage="No stores found."
            searchValue={search}
            searchPlaceholder="Search stores..."
            onSearchChange={handleTableSearchChange}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            totalCount={totalStores}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleTableRowsPerPageChange}
          />
        </Stack>
      </MainCard>

      <Dialog open={deleteOpen} onClose={handleDeleteClose} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Store</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{selectedStore?.name || 'this store'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteClose}>No</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteStoreMutation.isPending}
          >
            {deleteStoreMutation.isPending ? 'Deleting...' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedStore ? 'Edit Store' : 'Add Store'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              name: selectedStore?.name || '',
              store_code: selectedStore?.store_code || '',
              branch_code: selectedStore?.branch_code || '',
              region: selectedStore?.region || '',
              region_name: selectedStore?.region_name || '',
              city: selectedStore?.city || '',
              area: selectedStore?.area || '',
              is_active: selectedStore?.is_active ?? true,
            }}
            enableReinitialize
            validationSchema={storeSchema}
            onSubmit={(values, { resetForm }) => {
              if (selectedStore?.id) {
                updateStoreMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              } else {
                createStoreMutation.mutate(values, {
                  onSuccess: () => resetForm()
                });
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              setFieldTouched
            }) => (
              <form id="store-form" onSubmit={handleSubmit}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <FormControl fullWidth error={Boolean(touched.name && errors.name)}>
                    <InputLabel htmlFor="store-name">Name</InputLabel>
                    <OutlinedInput
                      id="store-name"
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

                  <FormControl
                    fullWidth
                    error={Boolean(touched.store_code && errors.store_code)}
                  >
                    <InputLabel htmlFor="store-code">Store Code</InputLabel>
                    <OutlinedInput
                      id="store-code"
                      name="store_code"
                      label="Store Code"
                      value={values.store_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.store_code && errors.store_code && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.store_code}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    error={Boolean(touched.branch_code && errors.branch_code)}
                  >
                    <InputLabel htmlFor="branch-code">Branch Code</InputLabel>
                    <OutlinedInput
                      id="branch-code"
                      name="branch_code"
                      label="Branch Code"
                      value={values.branch_code}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.branch_code && errors.branch_code && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.branch_code}
                      </Typography>
                    )}
                  </FormControl>

                  <Autocomplete
                    id="store-region"
                    options={regionOptions}
                    loading={isRegionsLoading}
                    autoHighlight
                    clearOnEscape
                    value={
                      regionOptions.find((option) => {
                        const optionName =
                          option?.name ||
                          option?.region_name ||
                          option?.title ||
                          '';

                        return (
                          String(option?.id) === String(values.region) ||
                          optionName === values.region_name
                        );
                      }) || null
                    }
                    isOptionEqualToValue={(option, selectedOption) =>
                      String(option?.id) === String(selectedOption?.id)
                    }
                    getOptionLabel={(option) =>
                      String(
                        option?.name ||
                        option?.region_name ||
                        option?.title ||
                        option?.id ||
                        ''
                      )
                    }
                    onChange={(_, selectedRegion) => {
                      setFieldValue(
                        'region',
                        selectedRegion?.id !== undefined
                          ? selectedRegion.id
                          : ''
                      );

                      setFieldValue(
                        'region_name',
                        selectedRegion?.name ||
                        selectedRegion?.region_name ||
                        selectedRegion?.title ||
                        ''
                      );
                    }}
                    onBlur={() => {
                      setFieldTouched('region', true);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        name="region"
                        label="Region"
                        placeholder="Search and select region"
                        error={Boolean(touched.region && errors.region)}
                        helperText={
                          touched.region && errors.region ? errors.region : ''
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isRegionsLoading && <CircularProgress size={18} />}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />

                  <FormControl fullWidth error={Boolean(touched.city && errors.city)}>
                    <InputLabel htmlFor="store-city">City</InputLabel>
                    <OutlinedInput
                      id="store-city"
                      name="city"
                      label="City"
                      value={values.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.city && errors.city && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.city}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth error={Boolean(touched.area && errors.area)}>
                    <InputLabel htmlFor="store-area">Area</InputLabel>
                    <OutlinedInput
                      id="store-area"
                      name="area"
                      label="Area"
                      value={values.area}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {touched.area && errors.area && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.area}
                      </Typography>
                    )}
                  </FormControl>

                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Store Images</Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadOutlinedIcon />}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {imagePreviews.length > 0 ? 'Change Images' : 'Select Images'}
                      <input
                        hidden
                        multiple
                        accept="image/*"
                        type="file"
                        onChange={(event) => {
                          const files = Array.from(
                            event.currentTarget.files || []
                          );

                          if (files.length === 0) return;

                          const newImages = files.map((file) => ({
                            id: null,
                            url: URL.createObjectURL(file),
                            file,
                            title: '',
                            originalTitle: '',
                            name: file.name,
                            isObjectUrl: true,
                            isNew: true
                          }));

                          setImagePreviews((currentImages) => [
                            ...currentImages,
                            ...newImages
                          ]);

                          event.currentTarget.value = '';
                        }}
                      />
                    </Button>

                    {imagePreviews.length > 0 && (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                          gap: 1.5
                        }}
                      >
                        {imagePreviews.map((image, index) => {
                          const titleError = Array.isArray(errors.image_titles)
                            ? errors.image_titles[index]
                            : '';
                          const titleTouched = Array.isArray(touched.image_titles)
                            ? touched.image_titles[index]
                            : false;

                          return (
                            <Paper
                              key={`${image.url}-${index}`}
                              variant="outlined"
                              sx={{ p: 1, position: 'relative' }}
                            >
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  handleRemoveImage(image, index)
                                }
                                disabled={
                                  deleteStoreImageMutation.isPending &&
                                  deleteStoreImageMutation.variables ===
                                  image.id
                                }
                                sx={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  zIndex: 1,
                                  backgroundColor: 'background.paper',
                                  boxShadow: 1,
                                  '&:hover': {
                                    backgroundColor: 'error.lighter'
                                  }
                                }}
                              >
                                {deleteStoreImageMutation.isPending &&
                                  deleteStoreImageMutation.variables ===
                                  image.id ? (
                                  <CircularProgress size={17} />
                                ) : (
                                  <DeleteOutlineOutlinedIcon
                                    fontSize="small"
                                  />
                                )}
                              </IconButton>
                              <Box
                                component="img"
                                src={image.url}
                                sx={{
                                  width: '100%',
                                  height: 100,
                                  display: 'block',
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  mb: 1
                                }}
                              />
                              <Button
                                component="label"
                                size="small"
                                variant="outlined"
                                fullWidth
                                sx={{ mb: 1 }}
                              >
                                Replace Image

                                <input
                                  hidden
                                  accept="image/*"
                                  type="file"
                                  onChange={(event) => {
                                    const file =
                                      event.currentTarget.files?.[0];

                                    handleReplaceImage(index, file);

                                    event.currentTarget.value = '';
                                  }}
                                />
                              </Button>
                              <TextField
                                fullWidth
                                size="small"
                                label={`Image ${index + 1} Title`}
                                value={image.title}
                                onChange={(event) =>
                                  handleImageTitleChange(
                                    index,
                                    event.target.value
                                  )
                                }
                              />
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Stack>
                </Stack>
              </form>
            )}
          </Formik>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            type="submit"
            form="store-form"
            disabled={createStoreMutation.isPending || updateStoreMutation.isPending}
          >
            {createStoreMutation.isPending || updateStoreMutation.isPending
              ? 'Saving...'
              : selectedStore
                ? 'Update Store'
                : 'Save Store'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
