import React from 'react';
import { X, Activity, Cpu, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { AnimatedModal } from './animations/AnimatedModal';

export const BenchmarkModal = ({ isOpen, onClose }) => {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Stream Processing vs In-Memory Buffering
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Chapter 2.2 • Table 2.1 Memory Safety Benchmark
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Technical Explainer */}
        <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
          When ingesting multi-megabyte API responses (e.g. 50MB+ JSON payloads), standard in-memory buffering using <code>JSON.parse()</code> loads entire payloads into server RAM simultaneously. In Node.js, this causes severe garbage collection freezes and fatal V8 crashes: <code style={{ color: '#f43f5e' }}>FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed — JavaScript heap out of memory</code>.
        </p>

        {/* Table 2.1 Comparison */}
        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(13, 18, 29, 0.95)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 16px', color: '#64748b' }}>Metric / Parameter</th>
                <th style={{ padding: '12px 16px', color: '#f43f5e' }}>Traditional Buffering (JSON.parse)</th>
                <th style={{ padding: '12px 16px', color: '#34d399' }}>Node.js Stream Processing (This Project)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                  RAM Allocation
                </td>
                <td style={{ padding: '12px 16px', color: '#fda4af' }}>
                  Proportional to payload size <strong>O(N)</strong>
                </td>
                <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 600 }}>
                  Constant memory footprint <strong>O(1)</strong> (~64KB buffer)
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                  Crash Threshold
                </td>
                <td style={{ padding: '12px 16px', color: '#fda4af' }}>
                  Fails on payloads exceeding ~100MB
                </td>
                <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 600 }}>
                  Scales indefinitely without RAM spikes
                </td>
              </tr>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f8fafc' }}>
                  Time to First Byte
                </td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                  High delay (waits for full download)
                </td>
                <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 600 }}>
                  Low latency (immediate chunk parsing)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Visual Memory Graph Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #f43f5e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', marginBottom: '8px' }}>
              <AlertTriangle size={16} />
              <strong style={{ fontSize: '0.85rem' }}>Traditional In-Memory Buffer</strong>
            </div>
            <div style={{ height: '60px', backgroundColor: '#0a0e17', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
              {[15, 30, 48, 70, 95, 100].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: h >= 95 ? '#f43f5e' : '#fb7185', borderRadius: '2px' }} />
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#fda4af', marginTop: '6px' }}>
              Linear O(N) RAM growth → Fatal V8 Heap Out of Memory crash
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginBottom: '8px' }}>
              <ShieldCheck size={16} />
              <strong style={{ fontSize: '0.85rem' }}>64KB Transform Stream (This Engine)</strong>
            </div>
            <div style={{ height: '60px', backgroundColor: '#0a0e17', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
              {[12, 12, 12, 12, 12, 12].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: '#10b981', borderRadius: '2px' }} />
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '6px' }}>
              Constant O(1) ~64KB chunk buffer → 100% memory safe & bounded
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};
