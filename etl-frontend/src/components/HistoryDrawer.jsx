import React from 'react';
import { X, History, ArrowRight, RotateCcw, Database, Calendar, CheckCircle2 } from 'lucide-react';
import { AnimatedModal } from './animations/AnimatedModal';

export const HistoryDrawer = ({
  isOpen,
  onClose,
  historyRecords,
  onLoadRecord,
}) => {
  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidth="780px">
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={20} color="#fbbf24" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Pipeline Execution History
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                MongoDB Document Store & Execution Log
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

        {/* History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
          {historyRecords.length > 0 ? (
            historyRecords.map((record) => (
              <div
                key={record.id}
                className="glass-panel"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-numeric" style={{ fontSize: '0.65rem' }}>
                      {record.method}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#f8fafc', wordBreak: 'break-all' }}>
                      {record.sourceUrl}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    <span>{new Date(record.runAt).toLocaleTimeString()} • {new Date(record.runAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span style={{ color: '#38bdf8' }}>{record.rowCount} Rows</span>
                    <span>•</span>
                    <span style={{ color: '#34d399' }}>{record.fieldCount} Columns</span>
                    <span>•</span>
                    <span style={{ color: '#c084fc' }}>{record.durationMs} ms</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLoadRecord(record);
                    onClose();
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <RotateCcw size={13} />
                  <span>Restore Run</span>
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No execution records in this session yet. Run any API endpoint to log history.
            </div>
          )}
        </div>
      </div>
    </AnimatedModal>
  );
};
