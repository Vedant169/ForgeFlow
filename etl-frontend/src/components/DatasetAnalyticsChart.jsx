import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { fetchPipelineAnalytics } from '../services/clientEtl';

// Rich distinctive palette for multi-series and pie slices
const CHART_COLORS = [
  '#5064EC', // Electric Indigo
  '#3DD9B2', // Mint Neon
  '#F59E0B', // Amber Gold
  '#EC4899', // Hot Pink
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F97316', // Orange
];

/**
 * Custom glassmorphic tooltip with formatted metric readouts.
 */
const CustomDatasetTooltip = ({ active, payload, label, chartType, xAxis, yAxes }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl bg-[#0e1017]/95 backdrop-blur-md p-3.5 border border-white/10 shadow-2xl text-xs font-mono min-w-[180px] pointer-events-none">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
        <span className="w-2 h-2 rounded-full bg-[#3DD9B2]" />
        <span className="text-[#F7F8F8] font-semibold truncate max-w-[200px]">
          {label ?? payload[0]?.payload?.[xAxis] ?? payload[0]?.name ?? 'Data Point'}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {payload.map((entry, idx) => {
          const val = typeof entry.value === 'number' 
            ? Number.isInteger(entry.value) 
              ? entry.value.toLocaleString() 
              : entry.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })
            : entry.value;

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#8B8D98]">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color || entry.fill || CHART_COLORS[idx % CHART_COLORS.length] }} />
                <span>{entry.name || yAxes?.[idx] || 'Value'}:</span>
              </span>
              <span className="text-[#F7F8F8] font-bold">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DatasetAnalyticsChart = ({
  mongoRecords = [],
  currentData = [],
  currentMetadata = [],
  currentUrl = '',
  token = '',
  onRunSamplePipeline,
}) => {
  // ── 1. Dataset Selection State ─────────────────────────────────────────────
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [backendAnalytics, setBackendAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── 2. Visualization Configuration State (User explicit overrides) ───────────
  const [userXAxis, setUserXAxis] = useState('');
  const [userYList, setUserYList] = useState([]);
  const [userChartType, setUserChartType] = useState('');
  const [userAggregation, setUserAggregation] = useState('sum');

  // Build list of selectable datasets (persisted MongoDB records)
  const availableDatasets = useMemo(() => {
    return Array.isArray(mongoRecords) ? mongoRecords : [];
  }, [mongoRecords]);

  // Synchronize initial dataset selection
  useEffect(() => {
    if (availableDatasets.length > 0 && !selectedRecordId) {
      setSelectedRecordId(availableDatasets[0]._id);
    } else if (availableDatasets.length === 0 && currentData.length > 0 && !selectedRecordId) {
      setSelectedRecordId('current');
    }
  }, [availableDatasets, currentData.length, selectedRecordId]);

  // ── 3. Memoized In-Memory Aggregation for "current" Execution ──────────────
  const currentAnalytics = useMemo(() => {
    if (selectedRecordId !== 'current') return null;
    const rows = currentData || [];
    if (rows.length === 0) return null;

    const numFields = (currentMetadata || []).filter((p) => p.type === 'numeric').map((p) => p.field);
    const catFields = (currentMetadata || []).filter((p) => p.type === 'categorical').map((p) => p.field);
    const tempFields = (currentMetadata || []).filter((p) => p.type === 'temporal').map((p) => p.field);
    const allFields = (currentMetadata || []).map((p) => p.field);

    const resolvedX = userXAxis && allFields.includes(userXAxis)
      ? userXAxis
      : catFields[0] || tempFields[0] || allFields[0] || '';

    const resolvedY = userYList.length > 0 && userYList.every((y) => numFields.includes(y))
      ? userYList
      : (numFields.length > 0 ? numFields.slice(0, 1) : []);

    const resolvedChartType = userChartType || (tempFields.includes(resolvedX) ? 'line' : numFields.includes(resolvedX) ? 'scatter' : 'bar');
    const resolvedAggregation = userAggregation || 'sum';

    // Local grouping & aggregation
    const groups = new Map();
    rows.forEach((row) => {
      const rawKey = row[resolvedX];
      const key = rawKey === null || rawKey === undefined || rawKey === '' ? '(blank)' : String(rawKey);
      if (!groups.has(key)) {
        const init = { count: 0 };
        resolvedY.forEach((yf) => {
          init[`${yf}_sum`] = 0;
          init[`${yf}_count`] = 0;
          init[`${yf}_min`] = Infinity;
          init[`${yf}_max`] = -Infinity;
        });
        groups.set(key, init);
      }
      const g = groups.get(key);
      g.count += 1;
      resolvedY.forEach((yf) => {
        const num = Number(row[yf]);
        if (!isNaN(num)) {
          g[`${yf}_sum`] += num;
          g[`${yf}_count`] += 1;
          g[`${yf}_min`] = Math.min(g[`${yf}_min`], num);
          g[`${yf}_max`] = Math.max(g[`${yf}_max`], num);
        }
      });
    });

    let processed = Array.from(groups.entries()).map(([k, stats]) => {
      const item = { [resolvedX]: k };
      resolvedY.forEach((yf) => {
        const cnt = stats[`${yf}_count`];
        const sum = stats[`${yf}_sum`];
        if (resolvedAggregation === 'count') {
          item[yf] = stats.count;
        } else if (cnt === 0) {
          item[yf] = 0;
        } else if (resolvedAggregation === 'avg') {
          item[yf] = Math.round((sum / cnt) * 100) / 100;
        } else if (resolvedAggregation === 'min') {
          item[yf] = stats[`${yf}_min`] === Infinity ? 0 : stats[`${yf}_min`];
        } else if (resolvedAggregation === 'max') {
          item[yf] = stats[`${yf}_max`] === -Infinity ? 0 : stats[`${yf}_max`];
        } else {
          item[yf] = Math.round(sum * 100) / 100;
        }
      });
      return item;
    });

    if (resolvedChartType === 'pie' && resolvedY[0]) {
      const primaryY = resolvedY[0];
      processed.sort((a, b) => (b[primaryY] || 0) - (a[primaryY] || 0));
      if (processed.length > 8) {
        const top = processed.slice(0, 7);
        const otherSum = processed.slice(7).reduce((acc, curr) => acc + (curr[primaryY] || 0), 0);
        top.push({
          [resolvedX]: 'Other',
          [primaryY]: Math.round(otherSum * 100) / 100,
        });
        processed = top;
      }
    } else if (resolvedY[0]) {
      processed.sort((a, b) => (b[resolvedY[0]] || 0) - (a[resolvedY[0]] || 0));
      processed = processed.slice(0, 40);
    } else {
      processed = processed.slice(0, 40);
    }

    return {
      success: true,
      sourceUrl: currentUrl || 'Current API Execution Payload',
      rowCount: rows.length,
      fields: {
        all: allFields,
        numeric: numFields,
        categorical: catFields,
        temporal: tempFields,
      },
      config: {
        xAxis: resolvedX,
        yAxis: resolvedY,
        chartType: resolvedChartType,
        aggregation: resolvedAggregation,
      },
      chartData: processed,
      summary: {
        totalRecords: rows.length,
        plottedPoints: processed.length,
        numericCount: numFields.length,
        categoricalCount: catFields.length,
        temporalCount: tempFields.length,
      },
    };
  }, [selectedRecordId, currentData, currentMetadata, currentUrl, userXAxis, userYList, userChartType, userAggregation]);

  // ── 4. Fetch analytics from MongoDB for persisted records ──────────────────
  useEffect(() => {
    if (!selectedRecordId || selectedRecordId === 'current') return;

    let isCancelled = false;
    const loadAnalytics = async () => {
      setIsLoading(true);
      setErrorMsg('');

      try {
        const res = await fetchPipelineAnalytics({
          id: selectedRecordId,
          xAxis: userXAxis || undefined,
          yAxis: userYList.length > 0 ? userYList : undefined,
          chartType: userChartType || undefined,
          aggregation: userAggregation || undefined,
          token,
        });

        if (isCancelled) return;

        if (res && res.success) {
          setBackendAnalytics(res);
        } else {
          setErrorMsg(res?.message || 'Failed to generate analytics for this dataset.');
        }
      } catch (err) {
        if (!isCancelled) {
          setErrorMsg(err.message || 'Error communicating with MongoDB analytics service.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isCancelled = true;
    };
  }, [selectedRecordId, userXAxis, userYList, userChartType, userAggregation, token]);

  // Active analytics payload (in-memory for 'current', backend for MongoDB records)
  const analyticsData = selectedRecordId === 'current' ? currentAnalytics : backendAnalytics;

  // Available field lists from loaded dataset
  const fieldSummary = analyticsData?.fields || { all: [], numeric: [], categorical: [], temporal: [] };
  const chartPoints = analyticsData?.chartData || [];

  // Active resolved axes and chart configurations
  const xAxis = userXAxis || analyticsData?.config?.xAxis || fieldSummary.categorical[0] || fieldSummary.temporal[0] || fieldSummary.all[0] || '';
  const selectedYList = userYList.length > 0
    ? userYList
    : (analyticsData?.config?.yAxis || fieldSummary.numeric.slice(0, 1) || []);
  const chartType = userChartType || analyticsData?.config?.chartType || 'bar';
  const aggregation = userAggregation || analyticsData?.config?.aggregation || 'sum';

  // Determine field type compatibility
  const isXNumeric = fieldSummary.numeric.includes(xAxis);
  const isXTemporal = fieldSummary.temporal.includes(xAxis);

  // Toggle or select Y-Axis series
  const handleToggleYAxis = (field) => {
    if (selectedYList.includes(field)) {
      if (selectedYList.length > 1) {
        setUserYList(selectedYList.filter((f) => f !== field));
      }
    } else {
      setUserYList([...selectedYList, field]);
    }
  };

  // Reset to sensible defaults based on selected X field
  const handleXAxisChange = (newX) => {
    setUserXAxis(newX);
    if (fieldSummary.temporal.includes(newX)) {
      setUserChartType('line');
    } else if (fieldSummary.numeric.includes(newX)) {
      setUserChartType('scatter');
    } else {
      setUserChartType('bar');
    }
  };

  // ─── EMPTY STATE: No Datasets Available ────────────────────────────────────
  if (!selectedRecordId && availableDatasets.length === 0 && currentData.length === 0) {
    return (
      <div className="rounded-2xl bg-[#16181F] p-8 border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px]">
        <div className="w-14 h-14 rounded-2xl bg-[#5064EC]/10 border border-[#5064EC]/20 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(80,100,236,0.15)]">
          <span className="material-symbols-outlined text-[#5064EC] text-[28px]">query_stats</span>
        </div>
        <h3 className="text-lg font-serif text-[#F7F8F8] mb-1.5">Dataset Analytics & Visualization</h3>
        <p className="text-xs text-[#8B8D98] max-w-md font-mono mb-6 leading-relaxed">
          No processed ETL records found in MongoDB. Launch any preset pipeline or connect a custom REST endpoint above to start exploring your live dataset visually.
        </p>
        <button
          onClick={() => onRunSamplePipeline && onRunSamplePipeline(0)}
          className="px-5 py-2.5 rounded-full bg-[#5064EC] hover:bg-[#3a4ed7] text-[#faf7ff] text-xs font-semibold font-mono transition-all shadow-[0_0_16px_rgba(80,100,236,0.35)] cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">play_arrow</span>
          <span>Run Sample Pipeline (Products & Prices)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-[#16181F] p-6 border border-white/5 flex flex-col justify-between relative overflow-hidden">
      {/* ── Header: Title & Subtitle ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-serif text-[#F7F8F8]">Dataset Analytics & Visualization</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#3DD9B2]/20 text-[#3DD9B2] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DD9B2] animate-pulse" />
              MongoDB Connected
            </span>
          </div>
          <p className="text-xs text-[#8B8D98] font-mono mt-0.5">
            Explore and visualize your processed API data directly from MongoDB.
          </p>
        </div>

        {/* Dataset Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#555866] whitespace-nowrap">Active Dataset:</span>
          <div className="relative min-w-[220px]">
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value);
                setUserXAxis('');
                setUserYList([]);
                setUserChartType('');
              }}
              className="w-full bg-[#0d0e12] border border-white/10 text-xs font-mono text-[#F7F8F8] rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#5064EC] cursor-pointer appearance-none"
            >
              {currentData.length > 0 && (
                <option value="current">
                  ⚡ Current Execution ({currentData.length} rows)
                </option>
              )}
              {availableDatasets.map((rec) => {
                const dateStr = rec.runAt ? new Date(rec.runAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                const urlLabel = rec.sourceUrl 
                  ? rec.sourceUrl.replace(/^https?:\/\//, '').split('?')[0] 
                  : `Record ${rec._id.slice(-6)}`;

                return (
                  <option key={rec._id} value={rec._id}>
                    📦 {urlLabel} ({rec.rowCount || 0} rows {dateStr ? `• ${dateStr}` : ''})
                  </option>
                );
              })}
            </select>
            <span className="material-symbols-outlined text-[16px] text-[#8B8D98] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* ── Interactive Controls Bar ────────────────────────────────────────── */}
      <div className="p-3.5 rounded-xl bg-[#0d0e12] border border-white/5 flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Left Side: X-Axis & Y-Axis & Aggregation */}
        <div className="flex flex-wrap items-center gap-3">
          {/* X-Axis Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#8B8D98]">X-Axis:</span>
            <select
              value={xAxis}
              onChange={(e) => handleXAxisChange(e.target.value)}
              className="bg-[#16181F] border border-white/10 text-xs font-mono text-[#F7F8F8] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#5064EC] cursor-pointer"
            >
              {fieldSummary.categorical.length > 0 && (
                <optgroup label="🔤 Categorical Fields">
                  {fieldSummary.categorical.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </optgroup>
              )}
              {fieldSummary.temporal.length > 0 && (
                <optgroup label="📅 Temporal / Timestamps">
                  {fieldSummary.temporal.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </optgroup>
              )}
              {fieldSummary.numeric.length > 0 && (
                <optgroup label="🔢 Numeric Fields">
                  {fieldSummary.numeric.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Y-Axis Metric(s) Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#8B8D98]">Y-Metric(s):</span>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[280px]">
              {fieldSummary.numeric.length > 0 ? (
                fieldSummary.numeric.slice(0, 5).map((f, idx) => {
                  const isSelected = selectedYList.includes(f);
                  const color = CHART_COLORS[idx % CHART_COLORS.length];
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleToggleYAxis(f)}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-[#1e2230] border-[#5064EC] text-[#faf7ff] font-medium shadow-sm'
                          : 'bg-[#16181F] border-white/5 text-[#8B8D98] hover:text-[#F7F8F8]'
                      }`}
                      title={isSelected ? 'Click to deselect series' : 'Click to add series'}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? color : '#555866' }} />
                      <span>{f}</span>
                    </button>
                  );
                })
              ) : (
                <span className="text-[11px] font-mono text-amber-400/80">Row Count Only</span>
              )}
            </div>
          </div>

          {/* Aggregation Function Selector */}
          {chartType !== 'scatter' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
              <span className="text-[11px] font-mono text-[#8B8D98]">Agg:</span>
              <div className="flex items-center gap-1 bg-[#16181F] p-0.5 rounded-lg border border-white/5">
                {['sum', 'avg', 'count', 'max'].map((agg) => (
                  <button
                    key={agg}
                    type="button"
                    onClick={() => setUserAggregation(agg)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-all cursor-pointer ${
                      aggregation === agg
                        ? 'bg-[#5064EC] text-white font-bold'
                        : 'text-[#8B8D98] hover:text-[#F7F8F8]'
                    }`}
                  >
                    {agg}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Chart Type Selector Buttons */}
        <div className="flex items-center gap-1 bg-[#16181F] p-1 rounded-xl border border-white/5">
          {[
            { id: 'bar', label: 'Bar', icon: 'bar_chart' },
            { id: 'line', label: 'Line', icon: 'show_chart' },
            { id: 'area', label: 'Area', icon: 'area_chart' },
            { id: 'scatter', label: 'Scatter', icon: 'scatter_plot', disabled: !isXNumeric },
            { id: 'pie', label: 'Pie', icon: 'pie_chart' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={c.disabled}
              onClick={() => setUserChartType(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                chartType === c.id
                  ? 'bg-[#5064ec] text-[#faf7ff] font-medium shadow-sm'
                  : c.disabled
                    ? 'opacity-30 cursor-not-allowed text-[#555866]'
                    : 'text-[#8B8D98] hover:text-[#F7F8F8]'
              }`}
              title={c.disabled ? 'Scatter requires a numeric X-axis' : `${c.label} chart`}
            >
              <span className="material-symbols-outlined text-[15px]">{c.icon}</span>
              <span className="hidden sm:inline">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Interactive Graph Canvas (Expanded Full-Width Plotting Area) ──── */}
      <div className="w-full h-[400px] sm:h-[450px] lg:h-[480px] relative flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-[#8B8D98] font-mono text-xs">
            <span className="w-6 h-6 border-2 border-[#5064EC]/30 border-t-[#5064EC] rounded-full animate-spin" />
            <span>Aggregating MongoDB records...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-red-400">error</span>
            <span>{errorMsg}</span>
          </div>
        ) : chartPoints.length === 0 ? (
          <div className="text-center font-mono text-xs text-[#8B8D98]">
            <span>No valid plottable points for the selected field combination.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' && (
              <BarChart data={chartPoints} margin={{ top: 16, right: 24, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey={xAxis}
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  fontFamily="'Geist Pixel', monospace"
                  interval={chartPoints.length > 20 ? Math.floor(chartPoints.length / 18) : 0}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                  dy={6}
                />
                <YAxis
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="'Geist Pixel', monospace"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomDatasetTooltip xAxis={xAxis} yAxes={selectedYList} chartType={chartType} />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }} />
                {selectedYList.map((yf, idx) => (
                  <Bar
                    key={yf}
                    dataKey={yf}
                    name={yf}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={56}
                    isAnimationActive={true}
                  />
                ))}
              </BarChart>
            )}

            {chartType === 'line' && (
              <LineChart data={chartPoints} margin={{ top: 16, right: 24, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey={xAxis}
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  fontFamily="'Geist Pixel', monospace"
                  interval={chartPoints.length > 20 ? Math.floor(chartPoints.length / 18) : 0}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                  dy={6}
                />
                <YAxis
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="'Geist Pixel', monospace"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomDatasetTooltip xAxis={xAxis} yAxes={selectedYList} chartType={chartType} />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }} />
                {selectedYList.map((yf, idx) => (
                  <Line
                    key={yf}
                    type="monotone"
                    dataKey={yf}
                    name={yf}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: CHART_COLORS[idx % CHART_COLORS.length] }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                  />
                ))}
              </LineChart>
            )}

            {chartType === 'area' && (
              <AreaChart data={chartPoints} margin={{ top: 16, right: 24, left: 0, bottom: 45 }}>
                <defs>
                  {selectedYList.map((yf, idx) => {
                    const color = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <linearGradient key={yf} id={`grad_${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey={xAxis}
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  fontFamily="'Geist Pixel', monospace"
                  interval={chartPoints.length > 20 ? Math.floor(chartPoints.length / 18) : 0}
                  angle={-20}
                  textAnchor="end"
                  height={45}
                  dy={6}
                />
                <YAxis
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="'Geist Pixel', monospace"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <Tooltip content={<CustomDatasetTooltip xAxis={xAxis} yAxes={selectedYList} chartType={chartType} />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }} />
                {selectedYList.map((yf, idx) => (
                  <Area
                    key={yf}
                    type="monotone"
                    dataKey={yf}
                    name={yf}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#grad_${idx})`}
                    isAnimationActive={true}
                  />
                ))}
              </AreaChart>
            )}

            {chartType === 'scatter' && (
              <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number"
                  dataKey={xAxis}
                  name={xAxis}
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  fontFamily="'Geist Pixel', monospace"
                  height={35}
                />
                <YAxis
                  type="number"
                  dataKey={selectedYList[0]}
                  name={selectedYList[0]}
                  stroke="#555866"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="'Geist Pixel', monospace"
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                />
                <ZAxis range={[60, 200]} />
                <Tooltip content={<CustomDatasetTooltip xAxis={xAxis} yAxes={selectedYList} chartType={chartType} />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }} />
                <Scatter
                  name={`${xAxis} vs ${selectedYList[0] || 'Metric'}`}
                  data={chartPoints}
                  fill="#3DD9B2"
                  isAnimationActive={true}
                />
              </ScatterChart>
            )}

            {chartType === 'pie' && (
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Tooltip content={<CustomDatasetTooltip xAxis={xAxis} yAxes={selectedYList} chartType={chartType} />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />
                <Pie
                  data={chartPoints}
                  dataKey={selectedYList[0] || 'value'}
                  nameKey={xAxis}
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  innerRadius={70}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                  isAnimationActive={true}
                >
                  {chartPoints.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#111218" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Dataset Information Area (Footer Strip) ─────────────────────────── */}
      <div className="mt-3 pt-3 flex flex-wrap items-center justify-between text-xs font-mono text-[#8B8D98] bg-[#0d0e12] px-4 py-2.5 rounded-xl border border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[#F7F8F8] font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#3DD9B2] text-[15px]">database</span>
            <span>{analyticsData?.summary?.totalRecords ?? chartPoints.length} Total Records</span>
          </span>
          <span className="text-[#555866]">•</span>
          <span className="text-[#bcc3ff]">
            Active: <strong className="text-[#F7F8F8] font-normal">{xAxis}</strong> →{' '}
            <strong className="text-[#3DD9B2] font-normal">
              {selectedYList.join(', ')} ({aggregation.toUpperCase()})
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#555866]">
          <span>
            🔢 <strong className="text-[#8B8D98] font-normal">{fieldSummary.numeric.length}</strong> Num
          </span>
          <span>
            🔤 <strong className="text-[#8B8D98] font-normal">{fieldSummary.categorical.length}</strong> Cat
          </span>
          <span>
            📅 <strong className="text-[#8B8D98] font-normal">{fieldSummary.temporal.length}</strong> Temp
          </span>
          <span className="text-[#3DD9B2] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3DD9B2] animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>
    </div>
  );
};
