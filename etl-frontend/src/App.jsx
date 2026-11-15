import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlowForgeLanding } from './components/FlowForgeLanding';
import { FlowForgeExecutiveDashboard } from './components/FlowForgeExecutiveDashboard';
import { ConnectionScreen } from './components/ConnectionScreen';
import { DataMapperScreen } from './components/DataMapperScreen';
import { AnalyticsCanvasScreen } from './components/AnalyticsCanvasScreen';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CaseStudyModal } from './components/CaseStudyModal';
import { BenchmarkModal } from './components/BenchmarkModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { runEtlPipeline, fetchMongoHistory, fetchMongoRecordById } from './services/clientEtl';
import { useLenis } from './utils/useLenis';

export function App() {
  // Determine initial view from URL hash
  const initialView = window.location.hash === '#dashboard' ? 'dashboard' : 'landing';
  const [viewMode, setViewMode] = useState(initialView);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('flowforge_token') || localStorage.getItem('token') || '');

  // Modal for Custom Endpoint Connection
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  // Connection inputs
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [bearerToken, setBearerToken] = useState('');
  const [headers, setHeaders] = useState({ 'X-Client-App': 'FlowForge-Web' });
  const [requestBody, setRequestBody] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Loading & Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [rawJson, setRawJson] = useState(null);
  const [transformedData, setTransformedData] = useState([]);
  const [fieldProfiles, setFieldProfiles] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [executionSource, setExecutionSource] = useState('Node.js Express Backend');
  const [backendOnline, setBackendOnline] = useState(false);

  // History & Modals
  const [historyRecords, setHistoryRecords] = useState([]);
  const [mongoRecords, setMongoRecords] = useState([]);
  const [mongoTotal, setMongoTotal] = useState(0);
  const [isMongoLoading, setIsMongoLoading] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isCaseStudyOpen, setIsCaseStudyOpen] = useState(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Synchronize with browser Back and Forward navigation buttons (popstate)
  useEffect(() => {
    // Establish initial baseline state
    if (!window.history.state) {
      window.history.replaceState(
        { view: initialView },
        '',
        window.location.hash || '#login'
      );
    }

    const handlePopState = (event) => {
      const hash = window.location.hash;
      const stateView = event.state?.view;

      if (hash === '#dashboard' || stateView === 'dashboard') {
        setViewMode('dashboard');
      } else {
        setViewMode('landing');
      }
      setShowLoginModal(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen for keyboard Back navigation (Alt + Left Arrow)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === 'ArrowLeft' && viewMode === 'dashboard') {
        e.preventDefault();
        handleBackToLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Navigation handlers that maintain browser history
  const handleEnterDashboard = (userToken) => {
    const activeToken = userToken || token || localStorage.getItem('flowforge_token') || localStorage.getItem('token') || '';
    if (userToken) {
      setToken(userToken);
      localStorage.setItem('flowforge_token', userToken);
      localStorage.setItem('token', userToken);
    }
    if (window.location.hash !== '#dashboard') {
      window.history.pushState({ view: 'dashboard' }, '', '#dashboard');
    }
    setViewMode('dashboard');
    setShowLoginModal(false);
    if (activeToken) {
      refreshMongoHistory(activeToken);
    }
  };

  const handleBackToLogin = () => {
    if (window.location.hash === '#dashboard') {
      window.history.pushState({ view: 'landing' }, '', '#');
    }
    setViewMode('landing');
    setShowLoginModal(false);
  };

  // Fetch real-time MongoDB history
  const refreshMongoHistory = async (overrideToken) => {
    const activeToken = overrideToken || token || localStorage.getItem('flowforge_token') || localStorage.getItem('token') || '';
    setIsMongoLoading(true);
    try {
      const res = await fetchMongoHistory(50, 1, activeToken);
      if (res && res.success) {
        setMongoRecords(res.records || []);
        setMongoTotal(res.total || 0);
      }
    } catch (err) {
      console.warn('Error fetching MongoDB history:', err);
    } finally {
      setIsMongoLoading(false);
    }
  };

  // Check backend health and initial MongoDB history
  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === 'ok') {
          setBackendOnline(true);
        }
      })
      .catch(() => setBackendOnline(false));

    if (token) {
      refreshMongoHistory(token);
    }
  }, [token]);

  // Handle Preset selection & trigger
  const handleRunSamplePipeline = async (index = 0) => {
    const preset = SAMPLE_DATASETS[index] || SAMPLE_DATASETS[0];
    setSelectedPreset(preset);
    // Use the live URL (same as url in updated presets)
    const liveUrl = preset.liveUrl || preset.url;
    setUrl(liveUrl);
    setMethod(preset.method);
    
    setIsLoading(true);
    try {
      const activeToken = token || localStorage.getItem('flowforge_token') || localStorage.getItem('token') || null;
      const result = await runEtlPipeline({
        url: liveUrl,
        method: preset.method,
        headers,
        bearerToken: bearerToken || null,
        body: preset.method === 'POST' ? preset.data : null,
        // Only use mock fallback data if the backend fails AND network fails
        fallbackData: preset.data,
        useBackend: true,
        token: activeToken,
      });

      setRawJson(result.rawJson);
      setTransformedData(result.data);
      setFieldProfiles(result.metadata);
      setRowCount(result.rowCount);
      setDurationMs(result.durationMs);
      setExecutionSource(result.source);

      // Record to history
      const newHistoryItem = {
        id: 'rec_' + Date.now(),
        sourceUrl: preset.url,
        method: preset.method,
        rowCount: result.rowCount,
        fieldCount: result.fieldCount,
        durationMs: result.durationMs,
        runAt: new Date().toISOString(),
        rawJson: result.rawJson,
        data: result.data,
        metadata: result.metadata,
      };

      setHistoryRecords((prev) => [newHistoryItem, ...prev]);
      // Immediately refresh MongoDB real-time stream
      refreshMongoHistory(activeToken);
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
        alert('Authentication failed or session expired. Please log in again.');
        localStorage.removeItem('flowforge_token');
        localStorage.removeItem('token');
        setToken('');
        handleBackToLogin();
      } else {
        alert(`Pipeline Ingestion Warning: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Run Custom ETL Pipeline
  const handleRunPipeline = async () => {
    setIsLoading(true);
    try {
      const fallbackData = (selectedPreset && selectedPreset.url === url)
        ? selectedPreset.data
        : SAMPLE_DATASETS.find((p) => p.url === url)?.data || null;
      
      let parsedBody = null;
      if (method === 'POST' && requestBody.trim()) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch {
          throw new Error('Invalid JSON formatted in request body');
        }
      }

      const activeToken = token || localStorage.getItem('flowforge_token') || localStorage.getItem('token') || null;
      const result = await runEtlPipeline({
        url,
        method,
        headers,
        bearerToken: bearerToken || null,
        body: parsedBody,
        fallbackData,
        useBackend: true,
        token: activeToken,
      });

      setRawJson(result.rawJson);
      setTransformedData(result.data);
      setFieldProfiles(result.metadata);
      setRowCount(result.rowCount);
      setDurationMs(result.durationMs);
      setExecutionSource(result.source);

      const newHistoryItem = {
        id: 'rec_' + Date.now(),
        sourceUrl: url,
        method,
        rowCount: result.rowCount,
        fieldCount: result.fieldCount,
        durationMs: result.durationMs,
        runAt: new Date().toISOString(),
        rawJson: result.rawJson,
        data: result.data,
        metadata: result.metadata,
      };

      setHistoryRecords((prev) => [newHistoryItem, ...prev]);
      setIsConnectionModalOpen(false);
      // Immediately refresh MongoDB real-time stream
      refreshMongoHistory(activeToken);
    } catch (err) {
      if (err.status === 401 || err.status === 403 || err.message === 'Authentication required' || err.message === 'Invalid or expired token') {
        alert('Authentication failed or session expired. Please log in again.');
        localStorage.removeItem('flowforge_token');
        localStorage.removeItem('token');
        setToken('');
        handleBackToLogin();
      } else {
        alert(`ETL Execution Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C10] text-[#e3e2e7]">
      {viewMode === 'landing' ? (
        <FlowForgeLanding 
          onEnterApp={handleEnterDashboard}
          initialShowLogin={showLoginModal}
          onCloseLoginModal={() => setShowLoginModal(false)}
          onOpenLoginModal={() => setShowLoginModal(true)}
        />
      ) : (
        <FlowForgeExecutiveDashboard
          data={transformedData}
          fieldProfiles={fieldProfiles}
          rowCount={rowCount}
          durationMs={durationMs}
          executionSource={executionSource}
          rawJson={rawJson}
          selectedPreset={selectedPreset}
          url={url}
          setUrl={setUrl}
          method={method}
          setMethod={setMethod}
          bearerToken={bearerToken}
          setBearerToken={setBearerToken}
          headers={headers}
          setHeaders={setHeaders}
          requestBody={requestBody}
          setRequestBody={setRequestBody}
          onRunPipeline={handleRunPipeline}
          onOpenConnectModal={() => setIsConnectionModalOpen(true)}
          onGoHome={handleBackToLogin}
          onBackToLogin={handleBackToLogin}
          onRunSamplePipeline={handleRunSamplePipeline}
          isLoading={isLoading}
          mongoRecords={mongoRecords}
          mongoTotal={mongoTotal}
          isMongoLoading={isMongoLoading}
          onRefreshMongo={() => refreshMongoHistory(token)}
          onFetchMongoRecord={(id) => fetchMongoRecordById(id, token)}
          token={token}
        />
      )}

      {/* Custom REST Connection Setup Modal */}
      {isConnectionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConnectionModalOpen(false)}>
          <div className="modal-content p-6 dashboard-root" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#dae2fd]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#004ac6] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">hub</span>
                </div>
                <h3 className="text-base font-bold text-[#131b2e]">Connect Custom REST API Endpoint</h3>
              </div>
              <button 
                onClick={() => setIsConnectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ConnectionScreen
              url={url}
              setUrl={setUrl}
              method={method}
              setMethod={setMethod}
              bearerToken={bearerToken}
              setBearerToken={setBearerToken}
              headers={headers}
              setHeaders={setHeaders}
              requestBody={requestBody}
              setRequestBody={setRequestBody}
              onRunPipeline={handleRunPipeline}
              isLoading={isLoading}
              selectedPreset={selectedPreset}
              onSelectPreset={(preset) => {
                setSelectedPreset(preset);
                setUrl(preset.url);
                setMethod(preset.method);
                if (preset.method === 'POST') {
                  setRequestBody(JSON.stringify(preset.data, null, 2));
                } else {
                  setRequestBody('');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <CaseStudyModal
        isOpen={isCaseStudyOpen}
        onClose={() => setIsCaseStudyOpen(false)}
      />

      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyRecords={historyRecords}
        onLoadRecord={(rec) => {
          setUrl(rec.sourceUrl);
          setMethod(rec.method);
          setRawJson(rec.rawJson);
          setTransformedData(rec.data);
          setFieldProfiles(rec.metadata);
          setRowCount(rec.rowCount);
          setDurationMs(rec.durationMs);
          setIsHistoryOpen(false);
        }}
      />
    </div>
  );
}

export default App;
