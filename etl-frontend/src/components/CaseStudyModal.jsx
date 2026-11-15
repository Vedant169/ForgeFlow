import React from 'react';
import { X, BookOpen, Truck, ShieldAlert, Zap, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { AnimatedModal } from './animations/AnimatedModal';

export const CaseStudyModal = ({ isOpen, onClose }) => {
  const comparisonTable = [
    {
      layer: "Data Ingestion",
      enterprise: "Apache Kafka / RabbitMQ Queues",
      capstone: "Node.js Express HTTP Streams (64KB chunks)",
      advantage: "Zero-dependency bounded RAM ingestion",
    },
    {
      layer: "Processing Engine",
      enterprise: "Distributed Apache Spark / Flink Clusters",
      capstone: "Custom Recursive DFS Node.js Engine",
      advantage: "Deterministic N-ary tree traversal & unwinding",
    },
    {
      layer: "Storage Layer",
      enterprise: "Google BigQuery / Snowflake Warehouses",
      capstone: "Schema-Agnostic MongoDB Atlas Document Store",
      advantage: "Handles dynamic nested JSON without schema migrations",
    },
    {
      layer: "Visualization UI",
      enterprise: "Tableau / Power BI / Looker BI Tools",
      capstone: "Dynamic React Canvas (Recharts & DataGrid)",
      advantage: "Zero manual field mapping; instant SVG charts",
    },
    {
      layer: "Infrastructure",
      enterprise: "Multi-Region Kubernetes (K8s) Clusters",
      capstone: "Containerized Docker on GCP Cloud Run Serverless",
      advantage: "Lightweight, scalable, cost-efficient microservice",
    },
  ];

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                Enterprise Case Study & Comparative System Design
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Chapter 3: Real-World Applications (Swiggy / Zomato) & ETL vs AI Models
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

        {/* Section 3.1: Swiggy/Zomato Case Study */}
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Truck size={18} color="#f59e0b" />
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#fbbf24' }}>
              3.1 Real-World Case Study: Enterprise Delivery Fleet Telemetry
            </h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
            Food-delivery platforms like <strong>Swiggy and Zomato</strong> process millions of concurrent JSON payloads across user app search streams, restaurant kitchen prep delays, and driver GPS logistics. City operations managers rely on dashboards to trigger localized surge pricing and reallocate delivery fleets. This Capstone Project models this exact architecture on a single-developer scale using modern web engineering.
          </p>
        </div>

        {/* Table 3.1: System Design Comparison */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Table 3.1: System Design Comparison (Enterprise Scale vs Capstone Implementation)
          </h4>

          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(13, 18, 29, 0.95)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px', color: '#64748b' }}>Architecture Layer</th>
                  <th style={{ padding: '10px 14px', color: '#e2e8f0' }}>Enterprise Scale (e.g. Zomato)</th>
                  <th style={{ padding: '10px 14px', color: 'var(--accent-cyan)' }}>This Capstone Implementation</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.map((row, idx) => (
                  <tr
                    key={row.layer}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>
                      {row.layer}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                      {row.enterprise}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#38bdf8', fontWeight: 500 }}>
                      {row.capstone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3.3: Deterministic ETL vs LLM AI Chat Models */}
        <div className="glass-panel" style={{ padding: '20px', backgroundColor: 'rgba(10, 14, 23, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap size={18} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
              3.3 Why a Custom Deterministic ETL Pipeline instead of AI Chatbots?
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '0.8rem' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
                1. Context Window Ceilings
              </strong>
              LLMs fail when asked to process 50MB+ payloads with 100,000+ records. Stream processing handles unbounded payloads effortlessly.
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px' }}>
                2. Standing Automation
              </strong>
              Prompting an AI requires manual copy-pasting every single time data updates. This pipeline is an automated, standalone standing architecture.
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '4px' }}>
                3. Data Privacy & Governance
              </strong>
              Corporate security policies strictly prohibit sending proprietary API tokens or operational streams to external AI models.
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#e879f9', display: 'block', marginBottom: '4px' }}>
                4. Determinism vs Hallucination
              </strong>
              AI outputs are probabilistic and can skip rows or distort values. Recursive DFS is 100% deterministic with mathematical precision.
            </div>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};
