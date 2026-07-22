import { CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import useAxios from '../../../api/useAxios';


const numberFormatter = new Intl.NumberFormat();

const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

const getPercentage = (value, maximumValue) => {
  const numericValue = Number(value) || 0;
  const numericMaximum = Number(maximumValue) || 0;

  if (!numericMaximum) {
    return 0;
  }

  return Math.max(1, Math.min(100, (numericValue / numericMaximum) * 100));
};

const SummaryCard = ({
  abbreviation,
  value,
  title,
  description,
  className
}) => {
  return (
    <article className={`overview-summary-card ${className}`}>
      <div className="overview-summary-icon">{abbreviation}</div>

      <strong className="overview-summary-value">
        {formatNumber(value)}
      </strong>

      <span className="overview-summary-title">{title}</span>

      <p className="overview-summary-description">{description}</p>
    </article>
  );
};

const PanelHeading = ({ title, description }) => {
  return (
    <div className="overview-panel-heading">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

const buildOverviewData = (summaryResponse) => {
  
  const data = summaryResponse?.data || {};
  const rawRegions = Array.isArray(data?.region_summary)
    ? data.region_summary
    : [];

  const skuPerStore = [];
  const tableTypeMap = new Map();
  const productCoverageMap = new Map();
  const uniqueProducts = new Set();

  let totalUnits = 0;

  const regionSummary = rawRegions.map((region) => {
    const regionStores = Array.isArray(region?.stores)
      ? region.stores
      : [];

    let regionUnits = 0;

    regionStores.forEach((store) => {
      const products = Array.isArray(store?.products)
        ? store.products
        : [];

      skuPerStore.push({
        store_id: store?.id,
        store_name: store?.name || 'Unknown Store',
        sku_count:
          Number(store?.sku_count) || products.length
      });

      products.forEach((product) => {
        const quantity = Number(product?.quantity) || 0;

        totalUnits += quantity;
        regionUnits += quantity;

        const productKey =
          product?.product_id ??
          product?.sku ??
          product?.product_name ??
          product?.id;

        if (
          productKey !== undefined &&
          productKey !== null &&
          productKey !== ''
        ) {
          uniqueProducts.add(String(productKey));
        }

        const tableTypeName =
          String(product?.table_type || 'Unknown');

        const tableTypeRecord =
          tableTypeMap.get(tableTypeName) || {
            table_type_id: tableTypeName,
            table_type_name: tableTypeName,
            sku_count: 0
          };

        tableTypeRecord.sku_count += 1;

        tableTypeMap.set(
          tableTypeName,
          tableTypeRecord
        );

        const coverageKey = String(
          productKey ?? product?.id
        );

        if (!productCoverageMap.has(coverageKey)) {
          productCoverageMap.set(coverageKey, {
            product_id:
              product?.product_id ??
              product?.id ??
              coverageKey,
            product_name:
              product?.product_name ||
              'Unknown Product',
            storeIds: new Set()
          });
        }

        productCoverageMap
          .get(coverageKey)
          .storeIds.add(
            String(store?.id ?? store?.name)
          );
      });
    });

    return {
      region_id: region?.id,
      region_name:
        region?.name || 'Unknown Region',
      sku_count: Number(region?.sku_count) || 0,
      store_count:
        Number(region?.store_count) ||
        regionStores.length,
      unit_count: regionUnits
    };
  });

  const skuByTableType = Array.from(
    tableTypeMap.values()
  );

  const topProductsByStoreCoverage =
    Array.from(productCoverageMap.values()).map(
      ({ storeIds, ...product }) => ({
        ...product,
        store_count: storeIds.size
      })
    );

  const calculatedSkuCount = skuPerStore.reduce(
    (total, store) =>
      total + (Number(store?.sku_count) || 0),
    0
  );

  return {
    counts: {
      total_sku:
        Number(data?.counts?.total_sku) || calculatedSkuCount,
      unique_products: data?.counts?.unique_products,
      active_stores:
        Number(data?.counts?.active_stores) ||
        skuPerStore.length,
      active_regions:
        Number(data?.counts?.active_regions) ||
        rawRegions.length,
      table_types: data?.counts?.table_types,
      total_units: data?.counts?.total_units
    },
    sku_per_store: data?.sku_per_store ?? [],
    sku_by_table_type: data?.sku_by_table_type ?? [],
    top_products_by_store_coverage: data?.top_products_by_store_coverage ?? [],
    region_summary: regionSummary
  };
};

const DisplayOverview = () => {
  const api = useAxios();

  const {
    data: summaryResponse,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['inventory-display-summary'],
    queryFn: async () => {
      const response = await api.get('/api/inventory/display-summary');

      return response.data;
    }
  });

  const summaryData = useMemo(
    () => buildOverviewData(summaryResponse),
    [summaryResponse]
  );

  const counts = summaryData.counts;

  const stores = useMemo(() => {
    return [...summaryData.sku_per_store]
      .sort(
        (first, second) =>
          Number(second?.sku_count || 0) -
          Number(first?.sku_count || 0)
      )
      .slice(0, 18);
  }, [summaryData.sku_per_store]);

  const tableTypes = useMemo(() => {
    return [...summaryData.sku_by_table_type].sort(
      (first, second) =>
        Number(second?.sku_count || 0) -
        Number(first?.sku_count || 0)
    );
  }, [summaryData.sku_by_table_type]);

  const topProducts = useMemo(() => {
    return [
      ...summaryData.top_products_by_store_coverage
    ].sort(
      (first, second) =>
        Number(second?.store_count || 0) -
        Number(first?.store_count || 0)
    );
  }, [
    summaryData.top_products_by_store_coverage
  ]);

  const regions = useMemo(() => {
    return [...summaryData.region_summary].sort(
      (first, second) =>
        Number(second?.sku_count || 0) -
        Number(first?.sku_count || 0)
    );
  }, [summaryData.region_summary]);

  const donutTableTypes = tableTypes.slice(0, 5);
  const listedTableTypes = tableTypes.slice(0, 7);

  const maximumStoreSku = Math.max(
    ...stores.map((store) => Number(store?.sku_count) || 0),
    1
  );

  const maximumProductCoverage = Math.max(
    ...topProducts.map((product) => Number(product?.store_count) || 0),
    1
  );

  const maximumRegionSku = Math.max(
    ...regions.map((region) => Number(region?.sku_count) || 0),
    1
  );

  const donutColors = [
    '#6d00d8',
    '#20c3cd',
    '#ff623e',
    '#00bf93',
    '#f4ae1a'
  ];

  const donutSeries = donutTableTypes.map(
    (tableType) => Number(tableType?.sku_count) || 0
  );

  const donutOptions = useMemo(
    () => ({
      chart: {
        type: 'donut',
        fontFamily: 'Poppins, sans-serif',
        toolbar: {
          show: false
        }
      },
      colors: donutColors,
      labels: donutTableTypes.map(
        (tableType) => tableType?.table_type_name || 'Unknown'
      ),
      legend: {
        show: false
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 2,
        colors: ['#ffffff']
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: '62%',
            labels: {
              show: false
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (value) => `${formatNumber(value)} SKUs`
        }
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      },
      responsive: [
        {
          breakpoint: 600,
          options: {
            chart: {
              width: 220
            }
          }
        }
      ]
    }),
    [donutTableTypes]
  );

  const summaryCards = [
    {
      abbreviation: 'SKU',
      value: counts?.total_sku,
      title: 'Total SKUs',
      description: 'Displayed positions',
      className: 'is-purple'
    },
    {
      abbreviation: 'UNQ',
      value: counts?.unique_products,
      title: 'Unique Products',
      description: 'Distinct item codes',
      className: 'is-cyan'
    },
    {
      abbreviation: 'STR',
      value: counts?.active_stores,
      title: 'Active Stores',
      description: `Across ${formatNumber(counts?.active_regions)} regions`,
      className: 'is-coral'
    },
    {
      abbreviation: 'TBL',
      value: counts?.table_types,
      title: 'Table Types',
      description: 'Display categories',
      className: 'is-green'
    },
    {
      abbreviation: 'QTY',
      value: counts?.total_units,
      title: 'Total Units',
      description: 'Sum of all QTY',
      className: 'is-yellow'
    }
  ];

  if (isLoading) {
    return (
      <div className="display-overview-page">
        <div className="overview-loading-state">
          <CircularProgress size={30} />
          <span>Loading display summary...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="display-overview-page">
        <div className="overview-loading-state is-error">
          {error?.response?.data?.message ||
            error?.message ||
            'Unable to load display summary.'}
        </div>
      </div>
    );
  }

  return (
    <div className="display-overview-page">
      <div className="overview-container">
        <div className="overview-section-title">
          <span>Display Summary</span>
          <div />
        </div>

        <section className="overview-summary-grid">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              abbreviation={card.abbreviation}
              value={card.value}
              title={card.title}
              description={card.description}
              className={card.className}
            />
          ))}
        </section>

        <section className="overview-primary-grid">
          <article className="overview-panel overview-store-panel">
            <PanelHeading
              title="SKUs per Store"
              description="Number of displayed SKU positions per store — sorted highest first"
            />

            <div className="overview-store-list">
              {stores.map((store) => (
                <div className="overview-store-row" key={store?.store_id}>
                  <span
                    className="overview-row-name"
                    title={store?.store_name}
                  >
                    {store?.store_name || 'Unknown Store'}
                  </span>

                  <div className="overview-progress-track">
                    <div
                      className="overview-progress-value"
                      style={{
                        width: `${getPercentage(
                          store?.sku_count,
                          maximumStoreSku
                        )}%`
                      }}
                    />
                  </div>

                  <strong>{formatNumber(store?.sku_count)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="overview-panel overview-donut-panel">
            <PanelHeading
              title="SKUs by Table Type"
              description="Distribution of display positions"
            />

            <div className="overview-donut-content">
              <div className="overview-donut-chart">
                <Chart
                  options={donutOptions}
                  series={donutSeries}
                  type="donut"
                  width="250"
                  height="250"
                />

                <div className="overview-donut-center">
                  <strong>{formatNumber(counts?.total_sku)}</strong>
                  <span>SKUs</span>
                </div>
              </div>

              <div className="overview-donut-legend">
                {donutTableTypes.map((tableType, index) => (
                  <div
                    className="overview-donut-legend-item"
                    key={tableType?.table_type_id}
                  >
                    <span
                      className="overview-legend-dot"
                      style={{
                        backgroundColor: donutColors[index]
                      }}
                    />

                    <div>
                      <span>{tableType?.table_type_name}</span>
                      <strong>{formatNumber(tableType?.sku_count)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="overview-secondary-grid">
          <article className="overview-panel overview-products-panel">
            <PanelHeading
              title="Top Products by Store Coverage"
              description="Products appearing in the most stores — shows standardised display items"
            />

            <div className="overview-product-list">
              {topProducts.map((product) => (
                <div
                  className="overview-product-row"
                  key={product?.product_id}
                >
                  <span
                    className="overview-product-name"
                    title={product?.product_name}
                  >
                    {product?.product_name || 'Unknown Product'}
                  </span>

                  <div className="overview-product-progress">
                    <div className="overview-progress-track">
                      <div
                        className="overview-progress-value"
                        style={{
                          width: `${getPercentage(
                            product?.store_count,
                            maximumProductCoverage
                          )}%`
                        }}
                      />
                    </div>
                  </div>

                  <strong>{formatNumber(product?.store_count)}</strong>

                  <span className="overview-product-store-count">
                    {formatNumber(product?.store_count)} stores
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="overview-panel overview-table-type-panel">
            <PanelHeading
              title="SKUs by Table Type"
              description="How many display positions each table type carries"
            />

            <div className="overview-table-type-list">
              {listedTableTypes.map((tableType) => (
                <div
                  className="overview-table-type-row"
                  key={tableType?.table_type_id}
                >
                  <span>{tableType?.table_type_name}</span>
                  <strong>{formatNumber(tableType?.sku_count)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="overview-region-section">
          <div className="overview-section-title">
            <span>By Region</span>
            <div />
          </div>

          <div className="overview-region-grid">
            {regions.map((region) => (
              <article
                className="overview-region-card"
                key={region?.region_id}
              >
                <h3>{region?.region_name || 'Unknown Region'}</h3>

                <div className="overview-region-stats">
                  <div className="is-sku">
                    <strong>{formatNumber(region?.sku_count)}</strong>
                    <span>SKUs</span>
                  </div>

                  <div className="is-store">
                    <strong>{formatNumber(region?.store_count)}</strong>
                    <span>Stores</span>
                  </div>

                  <div className="is-unit">
                    <strong>{formatNumber(region?.unit_count)}</strong>
                    <span>Units</span>
                  </div>
                </div>

                <div className="overview-region-progress">
                  <div
                    style={{
                      width: `${getPercentage(
                        region?.sku_count,
                        maximumRegionSku
                      )}%`
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DisplayOverview;