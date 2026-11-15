/**
 * clientEtl.js
 * 
 * Implements the deterministic Recursive DFS JSON Flattening and Runtime
 * Type-Inferencing Engine in the browser matching the Capstone Project Synopsis
 * (Chapter 2.3 & 2.4).
 * 
 * Works both as a client-side offline engine and as an adapter to the Express
 * backend (`/api/etl/run`).
 */

// ─── Regex Patterns for Type Inference ──────────────────────────────────────────
const RE_NUMERIC = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
const RE_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i;
const RE_ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RE_SLASH_DATE = /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/;
const RE_RFC_DATE = /^[A-Za-z]{3},\s\d{1,2}\s[A-Za-z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2}/;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const isNumeric = (str) => {
  if (typeof str === 'number') return !isNaN(str) && isFinite(str);
  if (typeof str !== 'string' || str.trim() === '') return false;
  return RE_NUMERIC.test(str.trim()) && isFinite(Number(str));
};

const isTemporal = (str) => {
  if (typeof str !== 'string' || str.trim() === '') return false;
  const s = str.trim();
  return RE_ISO_DATETIME.test(s) || RE_ISO_DATE.test(s) || RE_SLASH_DATE.test(s) || RE_RFC_DATE.test(s);
};

// ─── Recursive DFS Flattening Engine ─────────────────────────────────────────
export const flattenNode = (node, prefix = '', parentRow = {}) => {
  // Base case: primitive leaf
  if (node === null || typeof node !== 'object') {
    return [{ ...parentRow, [prefix]: node }];
  }

  // Array handling
  if (Array.isArray(node)) {
    if (node.length === 0) {
      return [{ ...parentRow, [prefix]: '' }];
    }

    const objectElements = node.filter(isPlainObject);
    const primitiveElements = node.filter((el) => !isPlainObject(el));

    if (objectElements.length === 0) {
      // Primitive array collapsed to comma-separated values
      const collapsed = primitiveElements.map((el) => (el === null ? 'null' : String(el))).join(', ');
      return [{ ...parentRow, [prefix]: collapsed }];
    }

    // Row-unwinding for object arrays (each item generates dedicated row)
    const primitiveStr = primitiveElements.length > 0
      ? primitiveElements.map((el) => (el === null ? 'null' : String(el))).join(', ')
      : undefined;

    const baseRow = primitiveStr !== undefined
      ? { ...parentRow, [prefix]: primitiveStr }
      : { ...parentRow };

    return objectElements.flatMap((objEl) => flattenNode(objEl, prefix, baseRow));
  }

  // Plain Object: Traverse N-ary tree recursively with DFS
  const keys = Object.keys(node);
  if (keys.length === 0) {
    return [{ ...parentRow, [prefix]: '{}' }];
  }

  let rows = [{ ...parentRow }];

  for (const key of keys) {
    const childPrefix = prefix ? `${prefix}_${key}` : key;
    const childRows = [];

    for (const row of rows) {
      const expanded = flattenNode(node[key], childPrefix, row);
      childRows.push(...expanded);
    }

    rows = childRows;
  }

  return rows;
};

export const transformJsonPayload = (rawData) => {
  let rows;

  if (Array.isArray(rawData)) {
    rows = rawData.flatMap((item, idx) => {
      if (isPlainObject(item)) {
        return flattenNode(item, '', {});
      }
      return [{ _value: item, _index: idx }];
    });
  } else if (isPlainObject(rawData)) {
    rows = flattenNode(rawData, '', {});
  } else {
    rows = [{ _value: rawData }];
  }

  // Strip empty-string prefix keys if any
  rows = rows.map((row) => {
    if ('' in row) {
      const { '': _discarded, ...rest } = row;
      return rest;
    }
    return row;
  });

  return { rows, rowCount: rows.length };
};

// ─── Runtime Type Inference Engine ──────────────────────────────────────────
export const inferFieldProfiles = (rows) => {
  if (!rows || rows.length === 0) {
    return { fieldProfiles: [], fieldCount: 0, summary: { numeric: 0, temporal: 0, categorical: 0 } };
  }

  const fieldValues = new Map();

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (!fieldValues.has(key)) fieldValues.set(key, []);
      fieldValues.get(key).push(value);
    }
  }

  const fieldProfiles = [];
  const summary = { numeric: 0, temporal: 0, categorical: 0 };

  for (const [fieldName, values] of fieldValues.entries()) {
    const totalCount = values.length;
    const nullCount = values.filter((v) => v === null || v === undefined || v === '').length;
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
    const uniqueSet = new Set(nonNull.map(String));
    const uniqueCount = uniqueSet.size;
    const sampleValues = [...uniqueSet].slice(0, 8);

    let type = 'categorical';
    if (nonNull.length > 0) {
      if (nonNull.every(isNumeric)) {
        type = 'numeric';
      } else if (nonNull.every(isTemporal)) {
        type = 'temporal';
      }
    }

    const coverage = totalCount > 0 ? parseFloat(((totalCount - nullCount) / totalCount).toFixed(4)) : 0;

    fieldProfiles.push({
      field: fieldName,
      type,
      totalCount,
      nullCount,
      uniqueCount,
      coverage,
      sampleValues,
      visible: true, // Default all columns to visible
    });

    summary[type] = (summary[type] || 0) + 1;
  }

  // Sort profiles: numeric -> temporal -> categorical
  const TYPE_ORDER = { numeric: 0, temporal: 1, categorical: 2 };
  fieldProfiles.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.field.localeCompare(b.field));

  return {
    fieldProfiles,
    fieldCount: fieldProfiles.length,
    summary,
  };
};

// ─── Universal Pipeline Runner ───────────────────────────────────────────────
export const runEtlPipeline = async ({
  url,
  method = 'GET',
  headers = {},
  bearerToken = null,
  body = null,
  fallbackData = null,
  useBackend = true,
  token = null,
}) => {
  const startTime = performance.now();
  let rawJson = null;
  let executionSource = 'client';

  // 1. Try Backend if requested
  if (useBackend) {
    try {
      const response = await fetch('/api/etl/run', {
        method: 'POST',
        headers: {
    'Content-Type': 'application/json',
    ...(token && {
        Authorization: `Bearer ${token}`
    })
},
        body: JSON.stringify({
          url,
          method,
          headers,
          bearerToken,
          body,
          rawData: fallbackData || null,
          persist: true,
        }),
      });

      if (response.ok) {
        const backendResult = await response.json();
        if (backendResult && backendResult.success) {
          return {
            success: true,
            durationMs: Math.round(performance.now() - startTime),
            rawJson: fallbackData || backendResult.rawJson || { note: "Payload streamed from backend", url },
            data: backendResult.data,
            rowCount: backendResult.rowCount,
            fieldCount: backendResult.fieldCount,
            summary: backendResult.summary,
            metadata: backendResult.metadata.map((p) => ({ ...p, visible: true })),
            recordId: backendResult.recordId || null,
            source: fallbackData
              ? 'Node.js Express Backend (Stream Buffer & Preset Payload)'
              : 'Node.js Express Backend (64KB Stream Buffer)',
          };
        }
      } else {
    const errorData = await response.json().catch(() => null);

    const errMsg = errorData?.message ||
        `Backend error HTTP ${response.status}: ${response.statusText}`;

    // Never allow fallback when authentication fails
    if (response.status === 401 || response.status === 403) {
        const authError = new Error(errMsg);
        authError.status = response.status;
        throw authError;
    }

    // For other errors, allow fallback only if fallbackData exists
    if (!fallbackData) {
        throw new Error(errMsg);
    }
}
    } catch (err) {
    // Authentication errors must never trigger client-side fallback
    if (
        err.status === 401 ||
        err.status === 403 ||
        err.message === 'Authentication required' ||
        err.message === 'Invalid or expired token'
    ) {
        throw err;
    }

    if (!fallbackData) {
        throw new Error(
            err.message || 'Failed to connect to backend ETL service'
        );
    }

      // Allow client-side fallback for other errors
    }
  }

  // 2. Client-Side Extraction & Processing
  if (fallbackData) {
    rawJson = fallbackData;
    executionSource = 'Preset Payload (Recursive DFS Client Stream)';
  } else {
    try {
      const fetchHeaders = {
        Accept: 'application/json',
        ...headers,
      };
      if (bearerToken) {
        fetchHeaders['Authorization'] = `Bearer ${bearerToken}`;
      }

      const res = await fetch(url, {
        method,
        headers: fetchHeaders,
        body: body && method === 'POST' ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      rawJson = await res.json();
      executionSource = 'Client-Side Stream Fetcher & DFS Engine';
    } catch (err) {
      throw new Error(`Pipeline Ingestion Failed: ${err.message}. If CORS is blocking this URL, try our pre-configured presets or verify the API endpoint.`);
    }
  }

  // 3. Transformation via Recursive DFS
  const { rows, rowCount } = transformJsonPayload(rawJson);

  // 4. Runtime Type Inference
  const { fieldProfiles, fieldCount, summary } = inferFieldProfiles(rows);

  const durationMs = Math.round(performance.now() - startTime);

  return {
    success: true,
    durationMs,
    rawJson,
    data: rows,
    rowCount,
    fieldCount,
    summary,
    metadata: fieldProfiles,
    source: executionSource,
  };
};

// ─── CSV Export Utility (RFC 4180 Compliant) ─────────────────────────────────
export const exportToCsv = (rows, visibleFields, filename = 'etl_flattened_dataset.csv') => {
  if (!rows || rows.length === 0) return;

  const fields = visibleFields && visibleFields.length > 0 
    ? visibleFields 
    : Object.keys(rows[0]);

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = fields.map(escapeCell).join(',');
  const dataRows = rows.map((row) => fields.map((f) => escapeCell(row[f])).join(','));
  const csvContent = [headerRow, ...dataRows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── JSON Export Utility ─────────────────────────────────────────────────────
export const exportToJson = (data, filename = 'etl_dataset.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── MongoDB Live API Helpers ────────────────────────────────────────────────
export const fetchMongoHistory = async (
    limit = 20,
    page = 1,
    token
) => {
    try {
        const res = await fetch(
            `/api/etl/history?limit=${limit}&page=${page}`,
            {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        console.error('History fetch failed:', err);

        return {
            success: false,
            records: [],
            total: 0
        };
    }
};

export const fetchMongoRecordById = async (id, token) => {
    if (!id) return null;

    try {
        const res = await fetch(
            `/api/etl/history/${id}`,
            {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();

        return json.record || null;

    } catch (err) {
        console.error(`Failed to fetch MongoDB record ${id}:`, err);
        return null;
    }
};
