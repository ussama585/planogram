import {
  Box,
  ButtonBase,
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

const StoreSection = ({ store }) => {
  const [imagesModalOpen, setImagesModalOpen] =
    useState(false);

  const images = Array.isArray(store?.images)
    ? store.images
    : Array.isArray(store?.records?.[0]?.storeImages)
      ? store.records[0].storeImages
      : [];

  const hasImages = images.length > 0;

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

          {hasImages && (
            <ButtonBase
              className="de-store-images-button"
              onClick={() =>
                setImagesModalOpen(true)
              }
              aria-label={`View images for ${store.name}`}
              title={`View ${images.length} store ${images.length === 1 ? "image" : "images"
                }`}
              sx={{
                marginLeft: 2,
                color: "primary.main",
                backgroundColor: "action.hover",
                "&:hover": {
                  backgroundColor: "action.selected"
                }
              }}
            >
              <IconPhoto size={19} stroke={2} />
            </ButtonBase>
          )}
        </div>
      </div>

      <SkuTable records={store.records} />

      {hasImages && (
        <StoreImagesModal
          open={imagesModalOpen}
          onClose={() =>
            setImagesModalOpen(false)
          }
          storeName={store.name}
          images={images}
        />
      )}
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