const SelectedFilterPills = ({
  regionOptions,
  selectedRegions,
  storeOptions,
  selectedStores,
  tableTypeOptions,
  selectedTableTypes
}) => {
  const selectedRegionOptions = regionOptions.filter((option) =>
    selectedRegions.includes(option.value)
  );

  const selectedTableTypeOptions = tableTypeOptions.filter((option) =>
    selectedTableTypes.includes(option.value)
  );

  const allRegionsSelected =
    regionOptions.length > 0 &&
    regionOptions.every((option) =>
      selectedRegions.includes(option.value)
    );

  const allStoresSelected =
    storeOptions.length > 0 &&
    storeOptions.every((option) =>
      selectedStores.includes(option.value)
    );

  const allTableTypesSelected =
    tableTypeOptions.length > 0 &&
    tableTypeOptions.every((option) =>
      selectedTableTypes.includes(option.value)
    );

  const showRegionPills =
    !allRegionsSelected && selectedRegionOptions.length > 0;

  const showStoreCount =
    !allStoresSelected && selectedStores.length > 0;

  const showTableTypePills =
    !allTableTypesSelected &&
    selectedTableTypeOptions.length > 0;

  const hasSelectedFilters =
    showRegionPills ||
    showStoreCount ||
    showTableTypePills;

  if (!hasSelectedFilters) {
    return null;
  }

  return (
    <div className="de-selected-filters-row">
      {showRegionPills &&
        selectedRegionOptions.map((region) => (
          <span
            key={`region-${region.value}`}
            className="de-selected-pill"
          >
            {region.label}
          </span>
        ))}

      {showStoreCount && (
        <span className="de-selected-pill">
          {selectedStores.length}{' '}
          {selectedStores.length === 1 ? 'Store' : 'Stores'}
        </span>
      )}

      {showTableTypePills &&
        selectedTableTypeOptions.map((tableType) => (
          <span
            key={`table-type-${tableType.value}`}
            className="de-selected-pill"
          >
            {tableType.label}
          </span>
        ))}
    </div>
  );
};