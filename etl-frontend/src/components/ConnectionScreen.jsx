import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Database, 
  Key, 
  Send, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  Check, 
  AlertCircle,
  Code,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleDatasets';
import { TiltCard } from './animations/TiltCard';
import { MagneticButton } from './animations/MagneticButton';
import { ShimmerText } from './animations/ShimmerText';

export const ConnectionScreen = ({
  url,
  setUrl,
  method,
  setMethod,
  bearerToken,
  setBearerToken,
  headers,
  setHeaders,
  requestBody,
  setRequestBody,
  onRunPipeline,
  isLoading,
  selectedPreset,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'headers' | 'body'
  const [headerKeyInput, setHeaderKeyInput] = useState('');
  const [headerValInput, setHeaderValInput] = useState('');

  const addHeader = () => {
    if (!headerKeyInput.trim()) return;
    setHeaders({ ...headers, [headerKeyInput.trim()]: headerValInput.trim() });
    setHeaderKeyInput('');
    setHeaderValInput('');
  };

  const removeHeader = (keyToRemove) => {
    const updated = { ...headers };
    delete updated[keyToRemove];
    setHeaders(updated);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Hero Banner */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px',
        padding: '24px 20px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', marginBottom: '12px' }}>
          <Sparkles size={14} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            Zero-Code Schema-Agnostic REST Ingestion Engine
          </span>
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
          <ShimmerText baseColor="#ffffff" shimmerColor="#38bdf8" duration={3}>
            Extract, Transform & Visualize Any REST API Payload
          </ShimmerText>
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '780px', margin: '0 auto', fontSize: '0.98rem' }}>
          Input an arbitrary REST endpoint or select an enterprise data stream below. The recursive DFS engine flattens nested hierarchies and infers data types at runtime with zero manual mapping.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: API Endpoint Connection Form */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Connection Setup & Request Configuration</h3>
          </div>

          {/* URL & HTTP Method Bar */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              TARGET REST API ENDPOINT URL
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #c3c6d7',
                  borderRadius: 'var(--radius-md)',
                  color: method === 'GET' ? '#004ac6' : '#824500',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  padding: '0 16px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>

              <input
                type="text"
                className="input-base mono"
                placeholder="https://api.example.com/v1/telemetry/feed"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ fontSize: '0.88rem' }}
              />
            </div>
          </div>

          {/* Configuration Tabs (Auth, Headers, Body) */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('auth')}
                style={{
                  background: activeTab === 'auth' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'auth' ? '#ffffff' : 'var(--text-muted)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Key size={13} />
                <span>Authorization</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('headers')}
                style={{
                  background: activeTab === 'headers' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'headers' ? '#ffffff' : 'var(--text-muted)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sliders size={13} />
                <span>Headers ({Object.keys(headers).length})</span>
              </button>

              {method === 'POST' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('body')}
                  style={{
                    background: activeTab === 'body' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: 'none',
                    color: activeTab === 'body' ? '#ffffff' : 'var(--text-muted)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Code size={13} />
                  <span>Request Body (JSON)</span>
                </button>
              )}
            </div>

            {/* Auth Tab Content */}
            {activeTab === 'auth' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  BEARER TOKEN (OPTIONAL)
                </label>
                <input
                  type="password"
                  className="input-base mono"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  style={{ fontSize: '0.84rem' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Injected automatically as <code style={{ color: 'var(--accent-cyan)' }}>Authorization: Bearer &lt;token&gt;</code>
                </span>
              </div>
            )}

            {/* Headers Tab Content */}
            {activeTab === 'headers' && (
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Header Key (e.g. X-API-Key)"
                    value={headerKeyInput}
                    onChange={(e) => setHeaderKeyInput(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                  <input
                    type="text"
                    className="input-base"
                    placeholder="Header Value"
                    value={headerValInput}
                    onChange={(e) => setHeaderValInput(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    onClick={addHeader}
                    className="btn btn-secondary"
                    style={{ padding: '0 14px', fontSize: '0.82rem' }}
                  >
                    Add
                  </button>
                </div>

                {Object.keys(headers).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(headers).map(([k, v]) => (
                      <div key={k} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                      }}>
                        <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{k}: <span style={{ color: '#cbd5e1' }}>{v}</span></span>
                        <button
                          onClick={() => removeHeader(k)}
                          style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No custom headers configured. Default <code style={{ color: 'var(--accent-cyan)' }}>Accept: application/json</code> is attached.</span>
                )}
              </div>
            )}

            {/* Body Tab Content */}
            {activeTab === 'body' && method === 'POST' && (
              <div>
                <textarea
                  className="input-base mono"
                  rows={4}
                  placeholder={`{\n  "query": "fleet_status",\n  "limit": 100\n}`}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  style={{ fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <MagneticButton
            onClick={onRunPipeline}
            disabled={isLoading || !url}
            className="btn btn-primary"
            pullFactor={0.2}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: isLoading || !url ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>Streaming & Flattening JSON Tree …</span>
              </>
            ) : (
              <>
                <Play size={18} fill="#ffffff" />
                <span>Execute ETL Pipeline & Flatten Schema</span>
                <ArrowRight size={18} />
              </>
            )}
          </MagneticButton>
        </div>

        {/* Right Column: Presets & Stream Telemetry Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Preset Endpoints Selection */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="var(--accent-cyan)" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>One-Click API Presets</h4>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                Instant Demo
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SAMPLE_DATASETS.map((preset) => {
                const isSelected = selectedPreset?.id === preset.id;
                return (
                  <TiltCard
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    tiltMax={5}
                    scale={1.015}
                    spotlightColor="rgba(6, 182, 212, 0.2)"
                    style={{
                      padding: '12px 14px',
                      borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.86rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {preset.name}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                        {preset.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      {preset.description}
                    </p>
                  </TiltCard>
                );
              })}
            </div>
          </div>

          {/* Stream Processing & Memory Safety Telemetry Badge (Synopsis Section 2.2) */}
          <div className="glass-panel" style={{ padding: '18px 20px', borderLeft: '3px solid var(--accent-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cpu size={16} color="#10b981" />
              <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34d399' }}>
                Node.js 64KB Transform Stream Guard
              </h5>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Replaces traditional full-payload buffering with bounded <strong>64KB chunk streams</strong>. Prevents V8 heap out-of-memory crashes (<code style={{ color: '#f43f5e' }}>CALL_AND_RETRY_LAST</code>) for large payloads up to 100MB+.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', fontSize: '0.74rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>RAM: </span>
                <span style={{ color: '#cbd5e1' }}>O(1) ~64KB Constant</span>
              </div>
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <span style={{ color: '#06b6d4', fontWeight: 700 }}>Latency: </span>
                <span style={{ color: '#cbd5e1' }}>Immediate TTFB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
