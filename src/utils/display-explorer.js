export const normalizePlanogramResponse = (response) => {
  const values = response?.values;

  if (!Array.isArray(values) || values.length < 2) {
    return [];
  }

  const [headers, ...rows] = values;

  const getValue = (row, key) => {
    const index = headers.indexOf(key);

    if (index === -1) {
      return "";
    }

    return row[index] ?? "";
  };

  return rows
    .filter(
      (row) =>
        Array.isArray(row) &&
        row.some((value) => String(value ?? "").trim() !== "")
    )
    .map((row, index) => {
      const branch = String(getValue(row, "Branch")).trim();
      const storeName = String(getValue(row, "Store Name")).trim();
      const tableType = String(getValue(row, "Table Type")).trim();
      const tableNumber = String(getValue(row, "Table Number")).trim();
      const itemCode = String(getValue(row, "Item Code")).trim();
      const description = String(getValue(row, "Description")).trim();
      const region = String(getValue(row, "Region")).trim();
      const securityType = String(getValue(row, "Security Type")).trim();
      const action = String(getValue(row, "Action")).trim();
      const quantity = Number(getValue(row, "QTY")) || 0;

      return {
        id: `${branch}-${storeName}-${tableType}-${tableNumber}-${itemCode}-${index}`,
        branch,
        storeName,
        storeKey: `${branch}__${storeName}`,
        tableType,
        tableNumber,
        quantity,
        securityType,
        action,
        itemCode,
        description,
        region
      };
    });
};

const uniqueOptions = (items, valueGetter, labelGetter) => {
  const optionsMap = new Map();

  items.forEach((item) => {
    const value = valueGetter(item);

    if (!value || optionsMap.has(value)) {
      return;
    }

    optionsMap.set(value, {
      value,
      label: labelGetter(item)
    });
  });

  return Array.from(optionsMap.values()).sort((first, second) =>
    first.label.localeCompare(second.label)
  );
};

export const getFilterOptions = (records) => ({
  regions: uniqueOptions(
    records,
    (record) => record.region,
    (record) => record.region
  ),
  stores: uniqueOptions(
    records,
    (record) => record.storeKey,
    (record) => `${record.branch}-${record.storeName}`
  ),
  tableTypes: uniqueOptions(
    records,
    (record) => record.tableType,
    (record) => record.tableType
  )
});

export const groupPlanogramRecords = (records) => {
  const regionMap = new Map();

  records.forEach((record) => {
    if (!regionMap.has(record.region)) {
      regionMap.set(record.region, {
        name: record.region,
        storesMap: new Map()
      });
    }

    const region = regionMap.get(record.region);

    if (!region.storesMap.has(record.storeKey)) {
      region.storesMap.set(record.storeKey, {
        key: record.storeKey,
        branch: record.branch,
        name: record.storeName,
        records: []
      });
    }

    region.storesMap.get(record.storeKey).records.push(record);
  });

  return Array.from(regionMap.values())
    .map((region) => {
      const stores = Array.from(region.storesMap.values())
        .map((store) => ({
          ...store,
          skuCount: store.records.length
        }))
        .sort((first, second) => first.name.localeCompare(second.name));

      return {
        name: region.name,
        stores,
        storeCount: stores.length,
        skuCount: stores.reduce(
          (total, store) => total + store.records.length,
          0
        )
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name));
};