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
  groupPlanogramRecords,
  normalizePlanogramResponse
} from "../../../utils/display-explorer";
import useAxios from "../../../api/useAxios";
import MultiSelectFilter from "./MultiSelectFilters";
import DisplayRegionAccordion from "./DisplayRegionAccordion";

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
      label: item.name
    }));

const getObjectValue = (value, possibleKeys = []) => {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return value ?? "";
  }

  const matchedKey = possibleKeys.find(
    (key) =>
      value?.[key] !== undefined &&
      value?.[key] !== null &&
      value?.[key] !== ""
  );

  return matchedKey ? value[matchedKey] : "";
};

const getFirstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  ) ?? "";

const normalizeRecordListResponse = (responseData) => {
  if (Array.isArray(responseData?.values)) {
    return normalizePlanogramResponse(responseData);
  }

  const responseRecords =
    getListFromResponse(responseData);

  return responseRecords
    .map((record, index) => {
      const branch = String(
        getFirstValue(
          record?.branch_code,
          record?.branchCode,
          record?.branch_name,
          record?.branchName,
          getObjectValue(record?.branch, [
            "code",
            "branch_code",
            "name"
          ]),
          record?.Branch
        )
      ).trim();

      const storeName = String(
        getFirstValue(
          record?.store_name,
          record?.storeName,
          getObjectValue(record?.store, [
            "name",
            "store_name",
            "title"
          ]),
          record?.["Store Name"]
        )
      ).trim();

      const tableType = String(
        getFirstValue(
          record?.table_type,
          record?.tableType,
          record?.table_name,
          record?.tableName,
          getObjectValue(record?.table, [
            "name",
            "table_type",
            "table_name"
          ]),
          record?.["Table Type"]
        )
      ).trim();

      const tableNumber = String(
        getFirstValue(
          record?.table_number,
          record?.tableNumber,
          record?.["Table Number"]
        )
      ).trim();

      const quantity =
        Number(
          getFirstValue(
            record?.qty,
            record?.quantity,
            record?.QTY
          )
        ) || 0;

      const securityType = String(
        getFirstValue(
          record?.security_type,
          record?.securityType,
          getObjectValue(record?.security, [
            "name",
            "security_type"
          ]),
          record?.["Security Type"]
        )
      ).trim();

      const action = String(
        getFirstValue(
          record?.action,
          record?.Action
        )
      ).trim();

      const itemCode = String(
        getFirstValue(
          record?.item_code,
          record?.itemCode,
          record?.sku,
          record?.["Item Code"]
        )
      ).trim();

      const description = String(
        getFirstValue(
          record?.description,
          record?.product_description,
          record?.productDescription,
          record?.product_name,
          record?.productName,
          record?.Description
        )
      ).trim();

      const region = String(
        getFirstValue(
          record?.region_name,
          record?.regionName,
          getObjectValue(record?.region, [
            "name",
            "region_name",
            "title"
          ]),
          record?.Region
        )
      ).trim();

      return {
        id:
          record?.id ??
          `${branch}-${storeName}-${tableType}-${tableNumber}-${itemCode}-${index}`,
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
    })
    .filter(
      (record) =>
        record.region ||
        record.storeName ||
        record.description ||
        record.itemCode
    );
};

const StatItem = ({ value, label }) => {
  return (
    <div className="de-stat-item">
      <strong>
        {new Intl.NumberFormat().format(value)}
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
    useState("explorer");

  const [selectedRegions, setSelectedRegions] =
    useState([]);

  const [selectedStores, setSelectedStores] =
    useState([]);

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
    queryKey: ["inventory-region-name-list"],
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
    queryKey: ["inventory-store-name-list"],
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
    queryKey: ["inventory-table-name-list"],
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
        getListFromResponse(regionOptionsData)
      ),
    [regionOptionsData]
  );

  const storeOptions = useMemo(
    () =>
      createOptions(
        getListFromResponse(storeOptionsData)
      ),
    [storeOptionsData]
  );

  const tableTypeOptions = useMemo(
    () =>
      createOptions(
        getListFromResponse(tableOptionsData)
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
      params.search = debouncedSearchValue;
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
      hasRequiredSelections
  });

  const records = useMemo(
    () =>
      normalizeRecordListResponse(
        recordListData
      ),
    [recordListData]
  );

  const groupedRegions = useMemo(
    () => groupPlanogramRecords(records),
    [records]
  );

  const stats = useMemo(() => {
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
  }, [records]);

  useEffect(() => {
    if (groupedRegions.length === 0) {
      setExpandedRegions(new Set());
      return;
    }

    setExpandedRegions(
      (currentExpandedRegions) => {
        const visibleRegionNames = new Set(
          groupedRegions.map(
            (region) => region.name
          )
        );

        const validExpandedRegions =
          Array.from(
            currentExpandedRegions
          ).filter((regionName) =>
            visibleRegionNames.has(regionName)
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
        const updatedRegions = new Set(
          currentExpandedRegions
        );

        if (
          updatedRegions.has(regionName)
        ) {
          updatedRegions.delete(regionName);
        } else {
          updatedRegions.add(regionName);
        }

        return updatedRegions;
      }
    );
  };

  const clearFilters = () => {
    setSelectedRegions([]);
    setSelectedStores([]);
    setSelectedTableTypes([]);
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
        overviewContent
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
                onChange={setSelectedRegions}
                loading={isRegionsLoading}
                error={isRegionsError}
              />

              <MultiSelectFilter
                label="Store"
                allLabel="All Stores"
                searchPlaceholder="Search stores..."
                options={storeOptions}
                value={selectedStores}
                onChange={setSelectedStores}
                loading={isStoresLoading}
                error={isStoresError}
              />

              <MultiSelectFilter
                label="Table Type"
                allLabel="All Types"
                searchPlaceholder="Search types..."
                options={tableTypeOptions}
                value={selectedTableTypes}
                onChange={
                  setSelectedTableTypes
                }
                loading={
                  isTableTypesLoading
                }
                error={isTableTypesError}
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
                    <IconSearch size={18} />
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
                      onClick={clearSearch}
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
              onClick={clearFilters}
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
              value={stats.totalUnits}
              label="Total Units"
            />
          </section>

          <section className="de-region-list">
            {filterOptionsLoading ? (
              <div className="de-empty-state">
                Loading display filters...
              </div>
            ) : filterOptionsError ? (
              <div className="de-empty-state">
                Unable to load display
                filters.
              </div>
            ) : !hasRequiredSelections ? (
              <div className="de-empty-state">
                Select at least one region,
                store and table type.
              </div>
            ) : recordsAreLoading &&
              records.length === 0 ? (
              <div className="de-empty-state">
                <CircularProgress
                  size={24}
                />

                <div>
                  Loading display records...
                </div>
              </div>
            ) : isRecordsError ? (
              <div className="de-empty-state">
                Failed to load records:{" "}
                {recordsError?.message ||
                  "Unknown error"}
              </div>
            ) : groupedRegions.length > 0 ? (
              groupedRegions.map((region) => (
                <DisplayRegionAccordion
                  key={region.name}
                  region={region}
                  expanded={expandedRegions.has(
                    region.name
                  )}
                  onToggle={() =>
                    toggleRegion(region.name)
                  }
                />
              ))
            ) : (
              <div className="de-empty-state">
                No matching display records
                found.
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

export default DisplayExplorer;