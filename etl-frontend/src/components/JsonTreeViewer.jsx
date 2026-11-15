import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Search, Maximize2, Minimize2 } from 'lucide-react';

const JsonNode = ({ keyName, value, depth = 0, defaultExpanded = false, searchFilter = '' }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2 || defaultExpanded);
  const [copied, setCopied] = useState(false);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isComplex = isObject || isArray;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Simple search filter match
  const matchesSearch = useMemo(() => {
    if (!searchFilter) return true;
    const filter = searchFilter.toLowerCase();
    if (keyName && keyName.toLowerCase().includes(filter)) return true;
    if (!isComplex && String(value).toLowerCase().includes(filter)) return true;
    return false;
  }, [keyName, value, isComplex, searchFilter]);

  if (searchFilter && !matchesSearch && !isComplex) {
    return null;
  }

  const renderValuePreview = () => {
    if (value === null) return <span style={{ color: '#94a3b8' }}>null</span>;
    if (typeof value === 'boolean') return <span style={{ color: '#f59e0b', fontWeight: 600 }}>{value ? 'true' : 'false'}</span>;
    if (typeof value === 'number') return <span style={{ color: '#38bdf8', fontWeight: 500 }}>{value}</span>;
    if (typeof value === 'string') return <span style={{ color: '#34d399' }}>"{value}"</span>;
    return null;
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '16px' : '0', marginTop: '3px', fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
      <div 
        onClick={() => isComplex && setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 6px',
          borderRadius: '4px',
          cursor: isComplex ? 'pointer' : 'default',
          backgroundColor: isExpanded && isComplex ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => isComplex && (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isExpanded && isComplex ? 'rgba(255, 255, 255, 0.02)' : 'transparent')}
      >
        {isComplex ? (
          <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: '14px', display: 'inline-block' }} />
        )}

        {keyName !== undefined && (
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
            "{keyName}":
          </span>
        )}

        {isComplex ? (
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isArray ? `Array[${value.length}]` : `Object{${Object.keys(value).length}}`}
            {!isExpanded && (
              <span style={{ color: '#64748b' }}>
                {isArray ? '[ ... ]' : '{ ... }'}
              </span>
            )}
          </span>
        ) : (
          renderValuePreview()
        )}

        {isComplex && (
          <button
            onClick={handleCopy}
            title="Copy branch JSON"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '2px 4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
          </button>
        )}
      </div>

      {isComplex && isExpanded && (
        <div style={{ borderLeft: '1px dashed rgba(255, 255, 255, 0.1)', marginLeft: '7px', paddingLeft: '4px' }}>
          {isArray ? (
            value.map((item, index) => (
              <JsonNode
                key={index}
                keyName={index}
                value={item}
                depth={depth + 1}
                defaultExpanded={defaultExpanded}
                searchFilter={searchFilter}
              />
            ))
          ) : (
            Object.entries(value).map(([childKey, childVal]) => (
              <JsonNode
                key={childKey}
                keyName={childKey}
                value={childVal}
                depth={depth + 1}
                defaultExpanded={defaultExpanded}
                searchFilter={searchFilter}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const JsonTreeViewer = ({ data, title = "Raw Hierarchical JSON" }) => {
  const [search, setSearch] = useState('');
  const [expandAllKey, setExpandAllKey] = useState(0);
  const [allExpanded, setAllExpanded] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const toggleExpandAll = () => {
    setAllExpanded(!allExpanded);
    setExpandAllKey((prev) => prev + 1);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}>
      {/* Viewer Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(13, 18, 29, 0.95)',
        borderTopLeftRadius: 'var(--radius-lg)',
        borderTopRightRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f1f5f9' }}>{title}</span>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            N-Ary Tree
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleExpandAll}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            title={allExpanded ? "Collapse All" : "Expand All"}
          >
            {allExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{allExpanded ? "Collapse" : "Expand All"}</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="btn btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
            title="Copy Raw JSON"
          >
            {copiedAll ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copiedAll ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(10, 14, 23, 0.6)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px' }} />
          <input
            type="text"
            placeholder="Filter keys or values in JSON tree..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '6px 10px 6px 32px',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div 
        key={expandAllKey}
        data-lenis-prevent
        style={{
          flex: 1,
          padding: '12px 14px',
          overflowY: 'auto',
          backgroundColor: '#0a0e17',
          borderBottomLeftRadius: 'var(--radius-lg)',
          borderBottomRightRadius: 'var(--radius-lg)',
          maxHeight: '560px',
        }}
      >
        {data ? (
          <JsonNode
            keyName={undefined}
            value={data}
            depth={0}
            defaultExpanded={allExpanded}
            searchFilter={search}
          />
        ) : (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '30px 0', fontSize: '0.85rem' }}>
            No JSON payload available. Run pipeline to extract data.
          </div>
        )}
      </div>
    </div>
  );
};
