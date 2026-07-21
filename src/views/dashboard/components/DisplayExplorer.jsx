import {
  ButtonBase,
  CircularProgress,
  InputBase
} from "@mui/material";
import { IconSearch, IconX } from "@tabler/icons-react";
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

const normalizeRecordListResponse = (
  responseData,
  selectedRegions
) => {
  const responseRecords =
    getListFromResponse(responseData);

  return responseRecords.map((record, index) => {
    const branch = String(
      record?.branch_code ?? ""
    ).trim();

    const storeCode = String(
      record?.store_code ?? ""
    ).trim();

    const storeName = String(
      record?.store_name ?? ""
    ).trim();

    const tableType = String(
      record?.table_type_name ?? ""
    ).trim();

    const tableNumber = String(
      record?.table_number ?? ""
    ).trim();

    const securityType = String(
      record?.security_type_name ?? ""
    ).trim();

    const itemCode = String(
      record?.product_sku ?? ""
    ).trim();

    const description = String(
      record?.product_name ?? ""
    ).trim();

    const region = String(
      record?.region_name ??
      record?.region ??
      (
        selectedRegions.length === 1
          ? selectedRegions[0]
          : "Unassigned Region"
      )
    ).trim();

    return {
      id:
        record?.id ??
        `${branch}-${storeCode}-${tableType}-${tableNumber}-${itemCode}-${index}`,
      branch,
      storeCode,
      storeName,
      storeKey:
        `${storeCode || branch}__${storeName}`,
      tableType,
      tableNumber,
      quantity: Number(record?.quantity) || 0,
      securityType,
      itemCode,
      description,
      region,
      keyboard: String(
        record?.keyboard ?? ""
      ).trim(),
      pen: String(
        record?.pen ?? ""
      ).trim()
    };
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

  const hasRequiredSelections =
    selectedRegions.length > 0 &&
    selectedStores.length > 0 &&
    selectedTableTypes.length > 0;

  const recordListParams = useMemo(() => {
    const params = {
      region: selectedRegions.join(","),
      store: selectedStores.join(","),
      table_type:
        selectedTableTypes.join(",")
    };

    if (debouncedSearchValue) {
      params.search =
        debouncedSearchValue;
    }

    return params;
  }, [
    selectedRegions,
    selectedStores,
    selectedTableTypes,
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
      "inventory-record-list",
      recordListParams.region,
      recordListParams.store,
      recordListParams.table_type,
      recordListParams.search ?? ""
    ],
    queryFn: async () => {
      const response = await api.get(
        "/api/inventory/record-list",
        {
          params: recordListParams
        }
      );

      return response.data;
    },
    enabled:
      filtersInitialized &&
      hasRequiredSelections,
    placeholderData: (
      previousData
    ) => previousData
  });

  const records = useMemo(
    () =>
      normalizeRecordListResponse(
        recordListData,
        selectedRegions
      ),
    [
      recordListData,
      selectedRegions
    ]
  );

  const groupedRegions = useMemo(
    () =>
      groupPlanogramRecords(records),
    [records]
  );

  const stats = useMemo(() => {
    const responseStats =
      recordListData?.stats;

    if (responseStats) {
      return {
        skus:
          Number(
            responseStats.total_skus
          ) || 0,
        stores:
          Number(
            responseStats.total_stores
          ) || 0,
        regions:
          Number(
            responseStats.total_regions
          ) || 0,
        totalUnits:
          Number(
            responseStats.total_units
          ) || 0
      };
    }

    const storesSet = new Set();
    const regionsSet = new Set();

    let totalUnits = 0;

    records.forEach((record) => {
      storesSet.add(record.storeKey);
      regionsSet.add(record.region);
      totalUnits += record.quantity;
    });

    return {
      skus: records.length,
      stores: storesSet.size,
      regions: regionsSet.size,
      totalUnits
    };
  }, [recordListData, records]);

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

    setSearchValue("");
    setDebouncedSearchValue("");
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
                onChange={
                  setSelectedRegions
                }
                loading={
                  isRegionsLoading
                }
                error={isRegionsError}
              />

              <MultiSelectFilter
                label="Store"
                allLabel="All Stores"
                searchPlaceholder="Search stores..."
                options={storeOptions}
                value={selectedStores}
                onChange={
                  setSelectedStores
                }
                loading={
                  isStoresLoading
                }
                error={isStoresError}
              />

              <MultiSelectFilter
                label="Table Type"
                allLabel="All Types"
                searchPlaceholder="Search types..."
                options={
                  tableTypeOptions
                }
                value={
                  selectedTableTypes
                }
                onChange={
                  setSelectedTableTypes
                }
                loading={
                  isTableTypesLoading
                }
                error={
                  isTableTypesError
                }
              />

              <div className="de-filter-control">
                <span className="de-filter-label">
                  Search
                </span>

                <div className="de-main-search">
                  {recordsAreLoading &&
                    filtersInitialized &&
                    hasRequiredSelections ? (
                    <CircularProgress
                      size={17}
                    />
                  ) : (
                    <IconSearch
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
                      <IconX
                        size={15}
                        stroke={2.4}
                      />
                    </ButtonBase>
                  )}
                </div>
              </div>
            </div>

            <ButtonBase
              className="de-clear-button"
              onClick={resetFilters}
            >
              Clear All

              <IconX
                size={13}
                stroke={2.5}
              />
            </ButtonBase>
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
            ) : !hasRequiredSelections ? (
              <div className="de-empty-state">
                Select at least one
                region, store and table
                type.
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