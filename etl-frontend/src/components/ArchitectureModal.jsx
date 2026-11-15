import React from 'react';
import { X, Workflow, ArrowRight, Layers, Cpu, Database, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { AnimatedModal } from './animations/AnimatedModal';

export const ArchitectureModal = ({ isOpen, onClose }) => {
  const nodes = [
    {
      num: 1,
      title: "Node 1: Client Input",
      badge: "React UI",
      desc: "User enters target REST API endpoint, chooses HTTP method (GET/POST), and provides bearer token or headers.",
      sub: "Prevents CORS roadblocks via backend proxy stream dispatch.",
      icon: <Layers size={18} color="var(--accent-cyan)" />,
      color: "var(--accent-cyan)",
    },
    {
      num: 2,
      title: "Node 2: Data Ingestion",
      badge: "Node.js Streams",
      desc: "Reads HTTP response in sequential non-blocking 64KB chunks to bound server heap memory to O(1).",
      sub: "Eliminates JSON.parse() memory spikes on 50MB+ payloads.",
      icon: <Cpu size={18} color="var(--accent-emerald)" />,
      color: "var(--accent-emerald)",
    },
    {
      num: 3,
      title: "Node 3: Transformation Logic",
      badge: "Recursive DFS & Regex",
      desc: "Recursive Depth-First Search flattens arbitrary N-ary trees into parent_child keys and unwinds arrays into dedicated rows.",
      sub: "Type inferencer evaluates regex to classify fields into numeric, temporal, or categorical.",
      icon: <Workflow size={18} color="var(--accent-indigo)" />,
      color: "var(--accent-indigo)",
    },
    {
      num: 4,
      title: "Node 4: Output Rendering",
      badge: "Recharts & DataGrid",
      desc: "Frontend dynamically maps numeric fields to interactive SVG line/bar charts and string fields to searchable, paginated data grids.",
      sub: "Includes one-click CSV export utility (RFC 4180).",
      icon: <LayoutDashboard size={18} color="var(--accent-purple)" />,
      color: "var(--accent-purple)",
    },
  ];

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Workflow size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                System Architecture & ETL Pipeline Flowchart
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Chapter 2.5 • Figures 2.1 & 2.2 System Flow
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

        {/* 4 Connected Nodes Diagram */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Figure 2.1: 4-Node Operational Architecture Pipeline
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {nodes.map((node, idx) => (
              <div
                key={node.num}
                className="glass-panel"
                style={{
                  padding: '16px',
                  borderTop: `3px solid ${node.color}`,
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {node.icon}
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
                      {node.title}
                    </span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.66rem' }}>
                    {node.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '6px' }}>
                  {node.desc}
                </p>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                  ✦ {node.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Pipeline Flow Diagram (Figure 2.2 Walkthrough) */}
        <div className="glass-panel" style={{ padding: '20px', backgroundColor: 'rgba(10, 14, 23, 0.8)' }}>
          <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            Figure 2.2: Third-Party Data Extraction → BI Dashboard Pipeline (Detailed Sequence)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <span className="badge badge-numeric" style={{ width: '24px', justifyContent: 'center' }}>1</span>
              <span><strong>User / React Client:</strong> Dispatches Target REST URL, HTTP Method & Auth Headers</span>
            </div>

            <div style={{ marginLeft: '12px', borderLeft: '2px solid rgba(6, 182, 212, 0.3)', paddingLeft: '16px', color: '#94a3b8' }}>
              ↓ POST /api/etl/run (Express Serverless Gateway)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <span className="badge badge-temporal" style={{ width: '24px', justifyContent: 'center' }}>2</span>
              <span><strong>Node.js Stream Module:</strong> Chunked HTTP extraction via 64KB Transform Streams</span>
            </div>

            <div style={{ marginLeft: '12px', borderLeft: '2px solid rgba(168, 85, 247, 0.3)', paddingLeft: '16px', color: '#94a3b8' }}>
              ↓ Stream buffer completed without heap memory spike
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <span className="badge badge-categorical" style={{ width: '24px', justifyContent: 'center' }}>3</span>
              <span><strong>Recursive DFS Flattener:</strong> N-ary tree traversal, parent_child concat & array unwinding</span>
            </div>

            <div style={{ marginLeft: '12px', borderLeft: '2px solid rgba(16, 185, 129, 0.3)', paddingLeft: '16px', color: '#94a3b8' }}>
              ↓ Generates tabular rows + regex runtime type inference (numeric, temporal, categorical)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
              <span className="badge badge-numeric" style={{ width: '24px', justifyContent: 'center' }}>4</span>
              <span><strong>React Dynamic Canvas:</strong> Auto-routes to Recharts (Line/Bar) + Material-UI DataGrid + CSV Export</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};
