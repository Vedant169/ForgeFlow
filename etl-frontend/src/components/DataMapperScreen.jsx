import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckSquare, 
  Square, 
  Hash, 
  Calendar, 
  Type, 
  Percent, 
  Sparkles,
  Info
} from 'lucide-react';
import { JsonTreeViewer } from './JsonTreeViewer';

export const DataMapperScreen = ({
  rawJson,
  fieldProfiles,
  setFieldProfiles,
  rowCount,
  durationMs,
  executionSource,
  onBack,
  onProceed,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'numeric' | 'temporal' | 'categorical'

  // Toggle individual field visibility
  const toggleVisibility = (fieldName) => {
    setFieldProfiles((prev) =>
      prev.map((p) => (p.field === fieldName ? { ...p, visible: !p.visible } : p))
    );
  };

  // Override inferred data type
  const handleTypeChange = (fieldName, newType) => {
    setFieldProfiles((prev) =>
      prev.map((p) => (p.field === fieldName ? { ...p, type: newType } : p))
    );
  };

  // Bulk actions
  const selectAll = () => {
    setFieldProfiles((prev) => prev.map((p) => ({ ...p, visible: true })));
  };

  const deselectAll = () => {
    setFieldProfiles((prev) => prev.map((p) => ({ ...p, visible: false })));
  };

  // Filtered fields
  const filteredProfiles = useMemo(() => {
    return fieldProfiles.filter((p) => {
      const matchesSearch = p.field.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [fieldProfiles, searchTerm, typeFilter]);

  const visibleCount = fieldProfiles.filter((p) => p.visible).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'numeric':
        return <Hash size={13} color="var(--accent-cyan)" />;
      case 'temporal':
        return <Calendar size={13} color="var(--accent-purple)" />;
      default:
        return <Type size={13} color="var(--accent-emerald)" />;
    }
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
      {/* Top Overview & Action Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'rgba(19, 27, 44, 0.7)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBack}
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          >
            <ArrowLeft size={15} />
            <span>Connection</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Data Mapper & Schema Column Toggles
              </h2>
              <span className="badge badge-numeric" style={{ fontSize: '0.72rem' }}>
                Recursive DFS Transformed
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              <span>Engine: {executionSource}</span>
              <span> • </span>
              <span style={{ color: '#38bdf8' }}>{rowCount} Unwound Records</span>
              <span> • </span>
              <span style={{ color: '#34d399' }}>{fieldProfiles.length} Flattened Columns</span>
              <span> • </span>
              <span>Processed in {durationMs} ms</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Visible for Dashboard: <strong style={{ color: '#38bdf8' }}>{visibleCount}</strong> of {fieldProfiles.length}
          </div>

          <button
            onClick={onProceed}
            disabled={visibleCount === 0}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.92rem' }}
          >
            <span>Proceed to Analytics Canvas</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Split-Screen Main Canvas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '20px', alignItems: 'stretch' }}>
        {/* Left Side: Original Hierarchical JSON Tree Viewer */}
        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <JsonTreeViewer
            data={rawJson}
            title="Original Hierarchical JSON (Input Payload)"
          />
        </div>

        {/* Right Side: Flattened Tabular Column Previews & Type Override */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '560px' }}>
          {/* Header of Column Manager */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(13, 18, 29, 0.95)',
            borderTopLeftRadius: 'var(--radius-lg)',
            borderTopRightRadius: 'var(--radius-lg)',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                DFS Flattened Columns & Runtime Types
              </h3>
            </div>

            {/* Quick Filter & Bulk Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={selectAll}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Select all columns"
              >
                <CheckSquare size={13} />
                <span>All</span>
              </button>
              <button
                onClick={deselectAll}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Deselect all columns"
              >
                <Square size={13} />
                <span>None</span>
              </button>
            </div>
          </div>

          {/* Search & Type Filter Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: 'rgba(10, 14, 23, 0.6)',
            borderBottom: '1px solid var(--border-subtle)',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input
                type="text"
                placeholder="Search flattened column names (e.g. financials_cart_subtotal)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '6px 10px 6px 32px',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'numeric', 'temporal', 'categorical'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    backgroundColor: typeFilter === t ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: typeFilter === t ? '#38bdf8' : 'var(--text-muted)',
                    border: `1px solid ${typeFilter === t ? 'rgba(6, 182, 212, 0.4)' : 'transparent'}`,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Column Items List */}
          <div 
            data-lenis-prevent
            style={{
              flex: 1,
              padding: '12px 16px',
              overflowY: 'auto',
              maxHeight: '560px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {filteredProfiles.length > 0 ? (
              filteredProfiles.map((col) => (
                <div
                  key={col.field}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: col.visible ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${col.visible ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.03)'}`,
                    opacity: col.visible ? 1 : 0.55,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    {/* Left: Column Name & Type Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <label className="switch" style={{ flexShrink: 0 }}>
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={() => toggleVisibility(col.field)}
                        />
                        <span className="slider" />
                      </label>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="mono" style={{
                            fontWeight: 600,
                            fontSize: '0.86rem',
                            color: col.visible ? '#f8fafc' : '#94a3b8',
                            wordBreak: 'break-all',
                          }}>
                            {col.field}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Runtime Type Override Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0a0e17',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {getTypeIcon(col.type)}
                        <select
                          value={col.type}
                          onChange={(e) => handleTypeChange(col.field, e.target.value)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: col.type === 'numeric' ? '#38bdf8' : col.type === 'temporal' ? '#c084fc' : '#34d399',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="numeric" style={{ background: '#0d1322' }}>numeric</option>
                          <option value="temporal" style={{ background: '#0d1322' }}>temporal</option>
                          <option value="categorical" style={{ background: '#0d1322' }}>categorical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Stats Subrow */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginTop: '8px',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      Coverage: <strong style={{ color: '#cbd5e1' }}>{Math.round(col.coverage * 100)}%</strong>
                    </div>
                    <div>
                      Nulls: <strong style={{ color: col.nullCount > 0 ? '#f59e0b' : '#10b981' }}>{col.nullCount}</strong>
                    </div>
                    <div>
                      Unique: <strong style={{ color: '#cbd5e1' }}>{col.uniqueCount}</strong>
                    </div>
                    {col.sampleValues && col.sampleValues.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                        <span>Samples:</span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                          {col.sampleValues.slice(0, 3).map((val, idx) => (
                            <span key={idx} className="mono" style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              color: '#94a3b8',
                              fontSize: '0.7rem',
                              maxWidth: '120px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {String(val)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No columns match your current filter.
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(13, 18, 29, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Ready to visualize {visibleCount} columns in real-time BI canvas
            </span>
            <button
              onClick={onProceed}
              disabled={visibleCount === 0}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.86rem' }}
            >
              <span>Proceed to Analytics Canvas</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
