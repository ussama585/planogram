import { ButtonBase, Collapse } from "@mui/material";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

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
                <span className="de-item-code" title={record.itemCode}>
                  {record.itemCode || "—"}
                </span>
              </td>

              <td>
                <strong className="de-quantity">{record.quantity}</strong>
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

const StoreSection = ({ store }) => {
  return (
    <section className="de-store-section">
      <div className="de-store-header">
        <div className="de-store-heading">
          <span className="de-store-name">{store.name}</span>
          <span className="de-branch-badge">{store.branch}</span>
        </div>

        <span className="de-store-items">
          <strong>{store.skuCount}</strong> items
        </span>
      </div>

      <SkuTable records={store.records} />
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
      className={`de-region-card ${expanded ? "is-expanded" : ""}`}
    >
      <ButtonBase className="de-region-header" onClick={onToggle}>
        <div className="de-region-heading">
          <strong>{region.name}</strong>

          <span>
            {region.storeCount}{" "}
            {region.storeCount === 1 ? "store" : "stores"}
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

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <div className="de-region-content">
          {region.stores.map((store) => (
            <StoreSection key={store.key} store={store} />
          ))}
        </div>
      </Collapse>
    </article>
  );
};

export default DisplayRegionAccordion;