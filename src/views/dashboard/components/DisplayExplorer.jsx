import {
  ButtonBase,
  CircularProgress,
  InputBase
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState
} from "react";

import "../../../assets/scss/display-explorer.scss";
import {
  groupPlanogramRecords
} from "../../../utils/display-explorer";
import useAxios from "../../../api/useAxios";
import MultiSelectFilter from "./MultiSelectFilters";
import DisplayRegionAccordion from "./DisplayRegionAccordion";
import DisplayOverview from "./DisplayOverview";
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

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

  return [];
};

const createOptions = (items = []) =>
  items
    .filter((item) => item?.name)
    .map((item) => ({
      value: String(item.name),
      label: String(item.name)
    }));

const getDisplayOverviewData = (responseData) => {
  if (
    responseData?.data &&
    !Array.isArray(responseData.data) &&
    typeof responseData.data === "object"
  ) {
    return responseData.data;
  }

  if (
    responseData &&
    !Array.isArray(responseData) &&
    typeof responseData === "object"
  ) {
    return responseData;
  }

  return {};
};

const getFiniteNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
};

const normalizeDisplayOverviewResponse = (responseData) => {
  const overviewData =
    getDisplayOverviewData(responseData);

  const regions = Array.isArray(overviewData?.regions)
    ? overviewData.regions
    : [];

  return regions.flatMap((region, regionIndex) => {
    const regionName = String(
      region?.name ?? "Unassigned Region"
    ).trim();

    const stores = Array.isArray(region?.stores)
      ? region.stores
      : [];

    return stores.flatMap((store, storeIndex) => {
      const storeId = store?.id ?? null;

      const branch = String(
        store?.branch_code ?? ""
      ).trim();

      const storeCode = String(
        store?.store_code ?? ""
      ).trim();

      const storeName = String(
        store?.name ?? "Unknown Store"
      ).trim();

      const products = Array.isArray(store?.products)
        ? store.products
        : [];

      return products.map((product, productIndex) => {
        const tableType = String(
          product?.table_type ?? ""
        ).trim();

        const securityType = String(
          product?.security_type ?? ""
        ).trim();

        const itemCode = String(
          product?.sku ?? ""
        ).trim();

        const description = String(
          product?.product_name ?? ""
        ).trim();

        const tableNumber = String(
          product?.table_number ?? ""
        ).trim();

        const quantityValue = getFiniteNumber(
          product?.quantity
        );

        return {
          id:
            product?.id ??
            `${region?.id ?? regionIndex}-${store?.id ?? storeIndex}-${product?.product_id ?? productIndex}-${tableType}-${tableNumber}-${itemCode}`,
          productId: product?.product_id ?? null,
          storeId,
          branch,
          storeCode,
          storeName,
          storeKey: `${branch}__${storeCode}__${storeName}`,
          tableType,
          tableNumber,
          quantity: quantityValue ?? 0,
          securityType,
          itemCode,
          description,
          region: regionName,
          city: String(store?.city ?? "").trim(),
          area: String(store?.area ?? "").trim(),
          keyboard: String(
            product?.keyboard ?? ""
          ).trim(),
          pen: String(
            product?.pen ?? ""
          ).trim(),
          createdAt: null,
          updatedAt: null
        };
      });
    });
  });
};

const StatItem = ({ value, label }) => {
  return (
    <div className="de-stat-item">
      <strong>
        {new Intl.NumberFormat().format(
          Number(value) || 0
        )}
      </strong>

      <span>{label}</span>
    </div>
  );
};

const getFilterParamValue = (selectedValues, options) => {
  if (selectedValues.length === 0) {
    return "";
  }

  if (
    options.length > 0 &&
    selectedValues.length === options.length
  ) {
    return undefined;
  }

  return selectedValues.join(",");
};


const getPartiallySelectedOptions = (
  options,
  selectedValues
) => {
  if (
    options.length === 0 ||
    selectedValues.length === 0
  ) {
    return [];
  }

  const selectedValueSet = new Set(selectedValues);

  const allSelected = options.every((option) =>
    selectedValueSet.has(option.value)
  );

  if (allSelected) {
    return [];
  }

  return options.filter((option) =>
    selectedValueSet.has(option.value)
  );
};

const DisplayExplorer = ({
  overviewContent = null,
  defaultExpandedRegion = "Al Kharj"
}) => {
  const api = useAxios();

  const [activeTab, setActiveTab] =
    useState("overview");

  const [
    selectedRegions,
    setSelectedRegions
  ] = useState([]);

  const [
    selectedStores,
    setSelectedStores
  ] = useState([]);

  const [
    selectedTableTypes,
    setSelectedTableTypes
  ] = useState([]);

  const [searchValue, setSearchValue] =
    useState("");

  const [
    debouncedSearchValue,
    setDebouncedSearchValue
  ] = useState("");

  const [
    filtersInitialized,
    setFiltersInitialized
  ] = useState(false);

  const [
    expandedRegions,
    setExpandedRegions
  ] = useState(new Set());

  const [
    filterRequestVersion,
    setFilterRequestVersion
  ] = useState(0);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    if (records.length === 0 || recordsAreLoading) {
      return;
    }

    try {
      setIsExporting(true);

      const {
        utils,
        writeFile
      } = await import('xlsx');

      const exportRows = records.map((record, index) => ({
        '#': index + 1,
        Region: record.region || '',
        Store: record.storeName || '',
        'Branch Code': record.branch || '',
        'Store Code': record.storeCode || '',
        City: record.city || '',
        Area: record.area || '',
        Product: record.description || '',
        'Item Code': record.itemCode || '',
        Quantity: record.quantity ?? 0,
        'Table Type': record.tableType || '',
        'Table Number': record.tableNumber || '',
        'Security Type': record.securityType || '',
        Keyboard: record.keyboard || '',
        Pen: record.pen || ''
      }));

      const worksheet = utils.json_to_sheet(exportRows);

      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 28 },
        { wch: 15 },
        { wch: 15 },
        { wch: 16 },
        { wch: 16 },
        { wch: 45 },
        { wch: 22 },
        { wch: 12 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 14 },
        { wch: 14 }
      ];

      const workbook = utils.book_new();

      utils.book_append_sheet(
        workbook,
        worksheet,
        'Filtered Display Data'
      );

      const currentDate = new Date()
        .toISOString()
        .slice(0, 10);

      writeFile(
        workbook,
        `display-explorer-${currentDate}.xlsx`,
        {
          compression: true
        }
      );
    } catch (error) {
      console.error('Unable to export Excel file:', error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchValue(
        searchValue.trim()
      );
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const {
    data: regionOptionsData,
    isLoading: isRegionsLoading,
    isError: isRegionsError
  } = useQuery({
    queryKey: [
      "inventory-region-name-list"
    ],
    queryFn: async () => {
      const response = await api.get(
        "/api/inventory/region-name-list"
      );

      return response.data;
    }
  });

  const {
    data: storeOptionsData,
    isLoading: isStoresLoading,
    isError: isStoresError
  } = useQuery({
    queryKey: [
      "inventory-store-name-list"
    ],
    queryFn: async () => {
      const response = await api.get(
        "/api/inventory/store-name-list"
      );

      return response.data;
    }
  });

  const {
    data: tableOptionsData,
    isLoading: isTableTypesLoading,
    isError: isTableTypesError
  } = useQuery({
    queryKey: [
      "inventory-table-name-list"
    ],
    queryFn: async () => {
      const response = await api.get(
        "/api/inventory/table-name-list"
      );

      return response.data;
    }
  });

  const regionOptions = useMemo(
    () =>
      createOptions(
        getListFromResponse(
          regionOptionsData
        )
      ),
    [regionOptionsData]
  );

  const storeOptions = useMemo(
    () =>
      createOptions(
        getListFromResponse(
          storeOptionsData
        )
      ),
    [storeOptionsData]
  );

  const tableTypeOptions = useMemo(
    () =>
      createOptions(
        getListFromResponse(
          tableOptionsData
        )
      ),
    [tableOptionsData]
  );

  const selectedRegionPills = useMemo(
    () =>
      getPartiallySelectedOptions(
        regionOptions,
        selectedRegions
      ),
    [regionOptions, selectedRegions]
  );

  const selectedTableTypePills = useMemo(
    () =>
      getPartiallySelectedOptions(
        tableTypeOptions,
        selectedTableTypes
      ),
    [tableTypeOptions, selectedTableTypes]
  );

  const selectedStoreCount = useMemo(() => {
    const selectedStoreSet = new Set(
      selectedStores
    );

    return storeOptions.filter((option) =>
      selectedStoreSet.has(option.value)
    ).length;
  }, [storeOptions, selectedStores]);

  const showStoreCountPill =
    storeOptions.length > 0 &&
    selectedStoreCount > 0 &&
    selectedStoreCount < storeOptions.length;

  const hasSelectedFilterPills =
    selectedRegionPills.length > 0 ||
    showStoreCountPill ||
    selectedTableTypePills.length > 0;

  const filterOptionsLoading =
    isRegionsLoading ||
    isStoresLoading ||
    isTableTypesLoading;

  const filterOptionsError =
    isRegionsError ||
    isStoresError ||
    isTableTypesError;

  useEffect(() => {
    if (
      filtersInitialized ||
      filterOptionsLoading ||
      filterOptionsError
    ) {
      return;
    }

    setSelectedRegions(
      regionOptions.map(
        (option) => option.value
      )
    );

    setSelectedStores(
      storeOptions.map(
        (option) => option.value
      )
    );

    setSelectedTableTypes(
      tableTypeOptions.map(
        (option) => option.value
      )
    );

    setFiltersInitialized(true);
  }, [
    filtersInitialized,
    filterOptionsLoading,
    filterOptionsError,
    regionOptions,
    storeOptions,
    tableTypeOptions
  ]);

  // const hasRequiredSelections =
  //   selectedRegions.length > 0 &&
  //   selectedStores.length > 0 &&
  //   selectedTableTypes.length > 0;

  const recordListParams = useMemo(() => {
    const regionParam = getFilterParamValue(
      selectedRegions,
      regionOptions
    );

    const storeParam = getFilterParamValue(
      selectedStores,
      storeOptions
    );

    const tableTypeParam = getFilterParamValue(
      selectedTableTypes,
      tableTypeOptions
    );

    const params = {};

    if (regionParam !== undefined) {
      params.region = regionParam;
    }

    if (storeParam !== undefined) {
      params.store = storeParam;
    }

    if (tableTypeParam !== undefined) {
      params.table_type = tableTypeParam;
    }

    if (debouncedSearchValue) {
      params.search = debouncedSearchValue;
    }

    return params;
  }, [
    selectedRegions,
    selectedStores,
    selectedTableTypes,
    regionOptions,
    storeOptions,
    tableTypeOptions,
    debouncedSearchValue
  ]);

  const {
    data: recordListData,
    isLoading: isRecordsLoading,
    isFetching: isRecordsFetching,
    isError: isRecordsError,
    error: recordsError
  } = useQuery({
    queryKey: [
      "inventory-display-overview",
      recordListParams.region ?? "__all_regions__",
      recordListParams.store ?? "__all_stores__",
      recordListParams.table_type ?? "__all_table_types__",
      recordListParams.search ?? "",
      filterRequestVersion
    ],
    queryFn: async () => {
      const response = await api.get(
        "/api/inventory/display-overview",
        {
          params: recordListParams
        }
      );

      return response.data;
    },
    enabled: filtersInitialized,
    placeholderData: (previousData) => previousData
  });

  const displayOverviewData = useMemo(
    () => getDisplayOverviewData(recordListData),
    [recordListData]
  );

  const records = useMemo(
    () =>
      normalizeDisplayOverviewResponse(
        recordListData
      ),
    [recordListData]
  );

  const groupedRegions = useMemo(
    () =>
      groupPlanogramRecords(records),
    [records]
  );

  const stats = useMemo(() => {
    const storesSet = new Set();
    const regionsSet = new Set();

    let calculatedUnits = 0;

    records.forEach((record) => {
      storesSet.add(record.storeKey);
      regionsSet.add(record.region);
      calculatedUnits += record.quantity;
    });

    const responseSkuCount = getFiniteNumber(
      displayOverviewData?.sku_count
    );

    const responseStoreCount = getFiniteNumber(
      displayOverviewData?.store_count
    );

    const responseRegionCount = getFiniteNumber(
      displayOverviewData?.region_count
    );

    return {
      skus: responseSkuCount ?? records.length,
      stores: responseStoreCount ?? storesSet.size,
      regions: responseRegionCount ?? regionsSet.size,
      totalUnits: calculatedUnits
    };
  }, [displayOverviewData, records]);

  useEffect(() => {
    if (groupedRegions.length === 0) {
      setExpandedRegions(new Set());
      return;
    }

    setExpandedRegions(
      (currentExpandedRegions) => {
        const visibleRegionNames =
          new Set(
            groupedRegions.map(
              (region) => region.name
            )
          );

        const validExpandedRegions =
          Array.from(
            currentExpandedRegions
          ).filter((regionName) =>
            visibleRegionNames.has(
              regionName
            )
          );

        if (
          validExpandedRegions.length > 0
        ) {
          return new Set(
            validExpandedRegions
          );
        }

        const preferredRegion =
          groupedRegions.find(
            (region) =>
              region.name ===
              defaultExpandedRegion
          ) || groupedRegions[0];

        return new Set([
          preferredRegion.name
        ]);
      }
    );
  }, [
    defaultExpandedRegion,
    groupedRegions
  ]);

  const toggleRegion = (regionName) => {
    setExpandedRegions(
      (currentExpandedRegions) => {
        const updatedRegions =
          new Set(
            currentExpandedRegions
          );

        if (
          updatedRegions.has(regionName)
        ) {
          updatedRegions.delete(
            regionName
          );
        } else {
          updatedRegions.add(
            regionName
          );
        }

        return updatedRegions;
      }
    );
  };

  const resetFilters = () => {
    setSelectedRegions(
      regionOptions.map((option) => option.value)
    );

    setSelectedStores(
      storeOptions.map((option) => option.value)
    );

    setSelectedTableTypes(
      tableTypeOptions.map((option) => option.value)
    );

    setSearchValue("");
    setDebouncedSearchValue("");

    setFilterRequestVersion(
      (currentVersion) => currentVersion + 1
    );
  };

  const clearSearch = () => {
    setSearchValue("");
    setDebouncedSearchValue("");
  };

  const searchIsDebouncing =
    searchValue.trim() !==
    debouncedSearchValue;

  const recordsAreLoading =
    isRecordsLoading ||
    isRecordsFetching ||
    searchIsDebouncing;

  const handleRegionChange = (values) => {
    setSelectedRegions(values);
    setFilterRequestVersion(
      (currentVersion) => currentVersion + 1
    );
  };

  const handleStoreChange = (values) => {
    setSelectedStores(values);
    setFilterRequestVersion(
      (currentVersion) => currentVersion + 1
    );
  };

  const handleTableTypeChange = (values) => {
    setSelectedTableTypes(values);
    setFilterRequestVersion(
      (currentVersion) => currentVersion + 1
    );
  };

  return (
    <div className="display-explorer-page">
      <nav className="de-tabs">
        <ButtonBase
          className={`de-tab ${activeTab === "overview"
            ? "is-active"
            : ""
            }`}
          onClick={() =>
            setActiveTab("overview")
          }
        >
          Overview
        </ButtonBase>

        <ButtonBase
          className={`de-tab ${activeTab === "explorer"
            ? "is-active"
            : ""
            }`}
          onClick={() =>
            setActiveTab("explorer")
          }
        >
          Display Explorer
        </ButtonBase>
      </nav>

      {activeTab === "overview" ? (
        <DisplayOverview />
      ) : (
        <main className="de-content">
          <section className="de-filter-card">
            <div className="de-filter-grid">
              <MultiSelectFilter
                label="Region"
                allLabel="All Regions"
                searchPlaceholder="Search regions..."
                options={regionOptions}
                value={selectedRegions}
                onChange={handleRegionChange}
                loading={isRegionsLoading}
                error={isRegionsError}
              />

              <MultiSelectFilter
                label="Store"
                allLabel="All Stores"
                searchPlaceholder="Search stores..."
                options={storeOptions}
                value={selectedStores}
                onChange={handleStoreChange}
                loading={isStoresLoading}
                error={isStoresError}
              />

              <MultiSelectFilter
                label="Table Type"
                allLabel="All Types"
                searchPlaceholder="Search types..."
                options={tableTypeOptions}
                value={selectedTableTypes}
                onChange={handleTableTypeChange}
                loading={isTableTypesLoading}
                error={isTableTypesError}
              />

              <div className="de-filter-control">
                <span className="de-filter-label">
                  Search
                </span>

                <div className="de-main-search">
                  {recordsAreLoading &&
                    filtersInitialized ? (
                    <CircularProgress
                      size={17}
                    />
                  ) : (
                    <SearchIcon
                      size={18}
                    />
                  )}

                  <InputBase
                    value={searchValue}
                    onChange={(event) =>
                      setSearchValue(
                        event.target.value
                      )
                    }
                    placeholder="Product or item code..."
                    fullWidth
                  />

                  {searchValue && (
                    <ButtonBase
                      className="de-search-clear"
                      onClick={
                        clearSearch
                      }
                    >
                      <ClearIcon
                        size={15}
                        stroke={2.4}
                      />
                    </ButtonBase>
                  )}
                </div>
              </div>
            </div>

            {hasSelectedFilterPills && (
              <div className="de-selected-filters-row">
                {selectedRegionPills.map((region) => (
                  <span
                    key={`region-${region.value}`}
                    className="de-selected-filter-pill"
                  >
                    {region.label}
                  </span>
                ))}

                {showStoreCountPill && (
                  <span className="de-selected-filter-pill">
                    {selectedStoreCount}{' '}
                    {selectedStoreCount === 1
                      ? 'Store'
                      : 'Stores'}
                  </span>
                )}

                {selectedTableTypePills.map(
                  (tableType) => (
                    <span
                      key={`table-type-${tableType.value}`}
                      className="de-selected-filter-pill"
                    >
                      {tableType.label}
                    </span>
                  )
                )}
              </div>
            )}

            <div className="de-filter-actions">
              <ButtonBase
                className="de-clear-button"
                onClick={resetFilters}
              >
                Clear All

                <ClearIcon
                  size={13}
                  stroke={2.5}
                />
              </ButtonBase>

              <ButtonBase
                className="de-export-button"
                onClick={handleExportExcel}
                disabled={
                  isExporting ||
                  recordsAreLoading ||
                  records.length === 0
                }
              >
                {isExporting ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <FileDownloadOutlinedIcon fontSize="small" />
                )}

                {isExporting
                  ? 'Exporting...'
                  : 'Export Excel'}
              </ButtonBase>
            </div>
          </section>

          <section className="de-stats-card">
            <StatItem
              value={stats.skus}
              label="SKUs Shown"
            />

            <StatItem
              value={stats.stores}
              label="Stores"
            />

            <StatItem
              value={stats.regions}
              label="Regions"
            />

            <StatItem
              value={
                stats.totalUnits
              }
              label="Total Units"
            />
          </section>

          <section className="de-region-list">
            {filterOptionsLoading ? (
              <div className="de-empty-state">
                Loading display
                filters...
              </div>
            ) : filterOptionsError ? (
              <div className="de-empty-state">
                Unable to load
                display filters.
              </div>
            ) : isRecordsLoading &&
              records.length === 0 ? (
              <div className="de-empty-state">
                <CircularProgress
                  size={24}
                />

                <div>
                  Loading display
                  records...
                </div>
              </div>
            ) : isRecordsError ? (
              <div className="de-empty-state">
                Failed to load
                records:{" "}
                {recordsError?.message ||
                  "Unknown error"}
              </div>
            ) : groupedRegions.length >
              0 ? (
              groupedRegions.map(
                (region) => (
                  <DisplayRegionAccordion
                    key={region.name}
                    region={region}
                    expanded={expandedRegions.has(
                      region.name
                    )}
                    onToggle={() =>
                      toggleRegion(
                        region.name
                      )
                    }
                  />
                )
              )
            ) : (
              <div className="de-empty-state">
                No matching display
                records found.
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

export default DisplayExplorer;