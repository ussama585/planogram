import {
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle
} from "@mui/material";

import {
  IconChevronDown,
  IconChevronRight,
  IconPhoto,
  IconX
} from "@tabler/icons-react";

import { useState } from "react";
import { useSnackbar } from "notistack";
import useAxios from "api/useAxios";


const SkuTable = ({ records }) => {
  return (
    <div className="de-table-scroll">
      <table className="de-sku-table">
        <colgroup>
          <col className="de-description-column" />
          <col className="de-code-column" />
          <col className="de-qty-column" />
          <col className="de-type-column" />
          <col className="de-number-column" />
          <col className="de-security-column" />
        </colgroup>

        <thead>
          <tr>
            <th>Description</th>
            <th>Item Code</th>
            <th>Qty</th>
            <th>Table Type</th>
            <th>Table #</th>
            <th>Security Type</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <span
                  className="de-description-text"
                  title={record.description}
                >
                  {record.description || "—"}
                </span>
              </td>

              <td>
                <span
                  className="de-item-code"
                  title={record.itemCode}
                >
                  {record.itemCode || "—"}
                </span>
              </td>

              <td>
                <strong className="de-quantity">
                  {record.quantity}
                </strong>
              </td>

              <td>
                <span className="de-table-type-badge">
                  {record.tableType || "—"}
                </span>
              </td>

              <td>
                <span className="de-muted-value">
                  {record.tableNumber || "—"}
                </span>
              </td>

              <td>
                <span className="de-muted-value">
                  {record.securityType || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StoreImagesModal = ({
  open,
  onClose,
  storeName,
  images
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        className: "de-images-modal-paper"
      }}
    >
      <DialogTitle className="de-images-modal-header">
        <span>{storeName} Images</span>

        <ButtonBase
          className="de-images-modal-close"
          onClick={onClose}
          aria-label="Close store images"
        >
          <IconX size={20} stroke={2.3} />
        </ButtonBase>
      </DialogTitle>

      <DialogContent className="de-images-modal-content">
        <div className="de-store-images-grid">
          {images.map((item, index) => {
            const title =
              item.title || `Image ${index + 1}`;

            return (
              <div
                className="de-store-image-card"
                key={
                  item.id ??
                  `${item.image}-${index}`
                }
              >
                <div className="de-store-image-wrapper">
                  <img
                    src={item.image}
                    alt={`${storeName} - ${title}`}
                    loading="lazy"
                  />
                </div>

                <Box
                  className="de-store-image-title"
                  sx={{
                    backgroundColor: "#6600cc",
                    color: "primary.contrastText"
                  }}
                >
                  {title}
                </Box>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getImagesFromResponse = (responseData) => {
  const data = responseData?.data ?? responseData;

  const rawImages = Array.isArray(data)
    ? data
    : Array.isArray(data?.images)
      ? data.images
      : Array.isArray(data?.results)
        ? data.results
        : [];

  return rawImages
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: null,
          image: item,
          title: `Image ${index + 1}`
        };
      }

      const image =
        item?.image ||
        item?.url ||
        item?.image_url ||
        item?.file ||
        item?.path ||
        "";

      if (!image) {
        return null;
      }

      return {
        id: item?.id ?? null,
        image,
        title:
          item?.title ||
          item?.image_title ||
          `Image ${index + 1}`
      };
    })
    .filter(Boolean);
};

const StoreSection = ({ store }) => {
  const api = useAxios();
  const { enqueueSnackbar } = useSnackbar();

  const [imagesModalOpen, setImagesModalOpen] =
    useState(false);

  const [storeImages, setStoreImages] =
    useState([]);

  const [imagesLoading, setImagesLoading] =
    useState(false);

  const storeId =
    store?.id ??
    store?.storeId ??
    store?.records?.[0]?.storeId ??
    null;

  const handleViewStoreImages = async () => {
    if (!storeId) {
      enqueueSnackbar("Store ID not found.", {
        variant: "error"
      });

      return;
    }

    try {
      setImagesLoading(true);

      const response = await api.get(
        `/api/inventory/store-images/${storeId}`
      );

      const images = getImagesFromResponse(
        response.data
      );
      console.log(images,"imagesimagesimages")
      if (images.length === 0) {
        setStoreImages([]);
        setImagesModalOpen(false);

        enqueueSnackbar("No images found.", {
          variant: "info"
        });

        return;
      }

      setStoreImages(images);
      setImagesModalOpen(true);
    } catch (error) {
      setStoreImages([]);
      setImagesModalOpen(false);

      enqueueSnackbar(
        error?.response?.data?.message ||
        "Unable to load store images.",
        {
          variant: "error"
        }
      );
    } finally {
      setImagesLoading(false);
    }
  };

  const handleCloseImagesModal = () => {
    setImagesModalOpen(false);
  };

  return (
    <section className="de-store-section">
      <div className="de-store-header">
        <div className="de-store-heading">
          <span className="de-store-name">
            {store.name}
          </span>

          <span className="de-branch-badge">
            {store.branch}
          </span>
        </div>

        <div className="de-store-summary">
          <span className="de-store-items">
            <strong>{store.skuCount}</strong> items
          </span>

          <ButtonBase
            className="de-store-images-button"
            onClick={handleViewStoreImages}
            disabled={imagesLoading}
            aria-label={`View images for ${store.name}`}
            sx={{
              border: "1px solid #fff",
              padding: "4px 7px",
              borderRadius: "3px",
              marginLeft: 2,
              color: "#fff",
              backgroundColor: "action.hover",
              "&:hover": {
                backgroundColor: "action.selected"
              },
              "&.Mui-disabled": {
                color: "rgba(255, 255, 255, 0.7)"
              }
            }}
          >
            {imagesLoading ? (
              <>
                <CircularProgress
                  size={16}
                  color="inherit"
                  sx={{ marginRight: "5px" }}
                />

                Loading...
              </>
            ) : (
              <>
                <IconPhoto
                  size={19}
                  stroke={2}
                  style={{ marginRight: "4px" }}
                />

                Store Images
              </>
            )}
          </ButtonBase>
        </div>
      </div>

      <SkuTable records={store.records} />

      <StoreImagesModal
        open={imagesModalOpen}
        onClose={handleCloseImagesModal}
        storeName={store.name}
        images={storeImages}
      />
    </section>
  );
};

const DisplayRegionAccordion = ({
  region,
  expanded,
  onToggle
}) => {
  return (
    <article
      className={`de-region-card ${expanded ? "is-expanded" : ""
        }`}
    >
      <ButtonBase
        className="de-region-header"
        onClick={onToggle}
      >
        <div className="de-region-heading">
          <strong>{region.name}</strong>

          <span>
            {region.storeCount}{" "}
            {region.storeCount === 1
              ? "store"
              : "stores"}
            <span className="de-region-dot">·</span>
            {region.skuCount} SKUs
          </span>
        </div>

        {expanded ? (
          <IconChevronDown size={18} />
        ) : (
          <IconChevronRight size={18} />
        )}
      </ButtonBase>

      <Collapse
        in={expanded}
        timeout="auto"
        unmountOnExit
      >
        <div className="de-region-content">
          {region.stores.map((store) => (
            <StoreSection
              key={store.key}
              store={store}
            />
          ))}
        </div>
      </Collapse>
    </article>
  );
};

export default DisplayRegionAccordion;