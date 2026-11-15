import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import { 
  ArrowLeft, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  LineChart as LineChartIcon, 
  Layers, 
  Maximize2, 
  Database, 
  TrendingUp, 
  Hash, 
  Activity, 
  Clock,
  Sparkles,
  Columns
} from 'lucide-react';
import { exportToCsv, exportToJson } from '../services/clientEtl';
import { CountingNumber } from './animations/CountingNumber';
import { TiltCard } from './animations/TiltCard';
import { MagneticButton } from './animations/MagneticButton';

export const AnalyticsCanvasScreen = ({
  data,
  fieldProfiles,
  rowCount,
  durationMs,
  executionSource,
  onBackToMapper,
  onResetToConnection,
}) => {
  // Visible fields
  const visibleFields = useMemo(() => {
    return fieldProfiles.filter((p) => p.visible).map((p) => p.field);
  }, [fieldProfiles]);

  const numericFields = useMemo(() => {
    return fieldProfiles.filter((p) => p.visible && p.type === 'numeric').map((p) => p.field);
  }, [fieldProfiles]);

  const temporalFields = useMemo(() => {
    return fieldProfiles.filter((p) => p.visible && p.type === 'temporal').map((p) => p.field);
  }, [fieldProfiles]);

  const categoricalFields = useMemo(() => {
    return fieldProfiles.filter((p) => p.visible && p.type === 'categorical').map((p) => p.field);
  }, [fieldProfiles]);

  // Chart configuration state
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar' | 'area'
  
  // Default X-Axis: prefer first temporal field, or first categorical field, or index
  const defaultX = temporalFields[0] || categoricalFields[0] || Object.keys(data[0] || {})[0] || '';
  const [xAxisField, setXAxisField] = useState(defaultX);

  // Default Y-Axis: prefer first numeric field
  const defaultY = numericFields[0] || Object.keys(data[0] || {})[1] || '';
  const [yAxisField, setYAxisField] = useState(defaultY);

  // Secondary Y-Axis for comparison
  const [secondaryYField, setSecondaryYField] = useState('');

  // DataGrid state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered and Sorted Data for DataGrid
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter across visible fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        visibleFields.some((f) => {
          const val = row[f];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortOrder === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [data, searchQuery, sortField, sortOrder, visibleFields]);

  // Paginated Data
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // KPI Calculations
  const kpiStats = useMemo(() => {
    if (!yAxisField || data.length === 0) return null;
    const values = data.map((d) => Number(d[yAxisField])).filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      sum: sum.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      avg: avg.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      max: max.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      min: min.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      field: yAxisField,
    };
  }, [data, yAxisField]);

  // Chart data formatting (truncate long labels for X axis)
  const chartData = useMemo(() => {
    return data.map((item, idx) => {
      let rawLabel = item[xAxisField];
      if (rawLabel === undefined || rawLabel === null) {
        rawLabel = `Row #${idx + 1}`;
      } else if (typeof rawLabel === 'string' && rawLabel.length > 18) {
        rawLabel = rawLabel.slice(0, 15) + '…';
      }
      return {
        ...item,
        _displayLabel: String(rawLabel),
        [yAxisField]: Number(item[yAxisField]) || 0,
        ...(secondaryYField ? { [secondaryYField]: Number(item[secondaryYField]) || 0 } : {}),
      };
    });
  }, [data, xAxisField, yAxisField, secondaryYField]);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
      {/* Top Header & Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(19, 27, 44, 0.7)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToMapper}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          >
            <ArrowLeft size={15} />
            <span>Schema Mapper</span>
          </button>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Dynamic BI Analytics Canvas
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Zero-Code Visualizer • Inferred {numericFields.length} Metrics & {categoricalFields.length + temporalFields.length} Dimensions
            </div>
          </div>
        </div>

        {/* Export Utilities (CSV & JSON) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MagneticButton
            onClick={() => exportToCsv(data, visibleFields)}
            className="btn btn-success"
            pullFactor={0.25}
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            title="Download Clean Flattened Dataset as CSV (RFC 4180)"
          >
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </MagneticButton>

          <button
            onClick={() => exportToJson(data)}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
            title="Download Flattened JSON Dataset"
          >
            <FileJson size={15} />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onResetToConnection}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
            title="Run new endpoint"
          >
            New Ingestion
          </button>
        </div>
      </div>

      {/* Top Summary KPI Cards (Section 2.4: Summary KPIs at header level) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <TiltCard tiltMax={6} scale={1.02} style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL RECORDS</span>
            <Database size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
            <CountingNumber value={rowCount} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Unwound via Recursive DFS
          </div>
        </TiltCard>

        <TiltCard tiltMax={6} scale={1.02} style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ACTIVE COLUMNS</span>
            <Columns size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
            <CountingNumber value={visibleFields.length} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {numericFields.length} Numeric, {temporalFields.length} Temporal
          </div>
        </TiltCard>

        {kpiStats && (
          <>
            <TiltCard tiltMax={6} scale={1.02} style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-indigo)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  AVERAGE ({kpiStats.field})
                </span>
                <TrendingUp size={16} color="var(--accent-indigo)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#818cf8' }}>
                <CountingNumber value={kpiStats.avg} decimals={1} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Sum: {kpiStats.sum}
              </div>
            </TiltCard>

            <TiltCard tiltMax={6} scale={1.02} style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-amber)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PEAK / MAX VALUE</span>
                <Activity size={16} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
                <CountingNumber value={kpiStats.max} decimals={1} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Min recorded: {kpiStats.min}
              </div>
            </TiltCard>
          </>
        )}

        <TiltCard tiltMax={6} scale={1.02} style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PIPELINE LATENCY</span>
            <Clock size={16} color="#c084fc" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e879f9' }}>
            <CountingNumber value={durationMs} suffix=" ms" />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Memory: Bounded O(1) buffer
          </div>
        </TiltCard>
      </div>

      {/* Dynamic Interactive Chart Visualizer */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '28px' }}>
        {/* Chart Control Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Dynamic Metric Visualizer
            </h3>
            <span className="badge badge-numeric" style={{ fontSize: '0.68rem' }}>
              Recharts Engine
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Chart Type Toggle */}
            <div style={{ display: 'flex', backgroundColor: '#0a0e17', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setChartType('line')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: chartType === 'line' ? 'var(--accent-cyan)' : 'transparent',
                  color: chartType === 'line' ? '#07090e' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <LineChartIcon size={13} />
                <span>Line</span>
              </button>

              <button
                onClick={() => setChartType('bar')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: chartType === 'bar' ? 'var(--accent-cyan)' : 'transparent',
                  color: chartType === 'bar' ? '#07090e' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <BarChart3 size={13} />
                <span>Bar</span>
              </button>

              <button
                onClick={() => setChartType('area')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: chartType === 'area' ? 'var(--accent-cyan)' : 'transparent',
                  color: chartType === 'area' ? '#07090e' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Layers size={13} />
                <span>Area</span>
              </button>
            </div>

            {/* X-Axis Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>X-Axis:</span>
              <select
                value={xAxisField}
                onChange={(e) => setXAxisField(e.target.value)}
                style={{
                  backgroundColor: '#0a0e17',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '180px',
                }}
              >
                {visibleFields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Primary Y-Axis Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Y-Metric:</span>
              <select
                value={yAxisField}
                onChange={(e) => setYAxisField(e.target.value)}
                style={{
                  backgroundColor: '#0a0e17',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#38bdf8',
                  fontWeight: 600,
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '180px',
                }}
              >
                {numericFields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
                {numericFields.length === 0 && (
                  <option value="">No numeric fields</option>
                )}
              </select>
            </div>

            {/* Secondary Y-Axis Selector */}
            {numericFields.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Compare:</span>
                <select
                  value={secondaryYField}
                  onChange={(e) => setSecondaryYField(e.target.value)}
                  style={{
                    backgroundColor: '#0a0e17',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#c084fc',
                    padding: '5px 10px',
                    fontSize: '0.78rem',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: '160px',
                  }}
                >
                  <option value="">None</option>
                  {numericFields.filter((f) => f !== yAxisField).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* SVG Recharts Canvas */}
        <div style={{ width: '100%', height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_displayLabel" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 18, 29, 0.95)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    color: '#f8fafc',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey={yAxisField}
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 7, fill: '#38bdf8' }}
                />
                {secondaryYField && (
                  <Line
                    type="monotone"
                    dataKey={secondaryYField}
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#a855f7' }}
                  />
                )}
                {data.length > 8 && <Brush dataKey="_displayLabel" height={22} stroke="#334155" fill="#0d1322" />}
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_displayLabel" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 18, 29, 0.95)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey={yAxisField} fill="url(#barCyan)" radius={[6, 6, 0, 0]} />
                {secondaryYField && (
                  <Bar dataKey={secondaryYField} fill="url(#barPurple)" radius={[6, 6, 0, 0]} />
                )}
                <defs>
                  <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_displayLabel" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(13, 18, 29, 0.95)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey={yAxisField} stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#areaGradient)" />
                {secondaryYField && (
                  <Area type="monotone" dataKey={secondaryYField} stroke="#a855f7" strokeWidth={2} fillOpacity={0.3} fill="#a855f7" />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive DataGrid (Searchable, Sortable, Paginated text tables) */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {/* DataGrid Header & Search */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          marginBottom: '16px',
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Searchable & Sortable DataGrid
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Showing {processedData.length} records matching filters across {visibleFields.length} columns
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="input-base"
                style={{ padding: '7px 10px 7px 32px', fontSize: '0.82rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  backgroundColor: '#0a0e17',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#cbd5e1',
                  padding: '5px 8px',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabular Grid */}
        <div data-lenis-prevent style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(13, 18, 29, 0.95)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px 12px', color: '#64748b', width: '50px' }}>#</th>
                {visibleFields.map((field) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    style={{
                      padding: '10px 14px',
                      color: sortField === field ? '#38bdf8' : '#e2e8f0',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono">{field}</span>
                      <ArrowUpDown size={12} color={sortField === field ? '#38bdf8' : '#64748b'} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, idx) => {
                  const absoluteIdx = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)')}
                    >
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.75rem' }}>
                        {absoluteIdx}
                      </td>
                      {visibleFields.map((field) => {
                        const val = row[field];
                        return (
                          <td
                            key={field}
                            style={{
                              padding: '10px 14px',
                              color: val === null || val === undefined ? '#64748b' : '#cbd5e1',
                              maxWidth: '260px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {val === null || val === undefined ? (
                              <span style={{ fontStyle: 'italic', color: '#64748b' }}>null</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={visibleFields.length + 1} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DataGrid Pagination Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '16px',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          <div>
            Showing <strong style={{ color: '#cbd5e1' }}>{paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to <strong style={{ color: '#cbd5e1' }}>{Math.min(page * pageSize, processedData.length)}</strong> of <strong style={{ color: '#cbd5e1' }}>{processedData.length}</strong> records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ padding: '0 8px', color: '#f8fafc', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
