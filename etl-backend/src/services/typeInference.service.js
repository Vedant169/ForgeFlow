'use strict';

/**
 * typeInference.service.js
 *
 * Responsible for the **Type Inference** phase of the ETL pipeline.
 *
 * For each field discovered across all flattened rows, the engine:
 *  1. Inspects every non-null value using deterministic regex/parser tests.
 *  2. Classifies the field into one of three canonical types:
 *       • `numeric`     — integers and floats
 *       • `temporal`    — ISO 8601 timestamps and common date strings
 *       • `categorical` — everything else (text, booleans, enums, mixed)
 *  3. Emits a rich metadata profile per field:
 *       { type, sampleValues, uniqueCount, nullCount, totalCount, coverage }
 *
 * Type-promotion priority (strongest → weakest):
 *   numeric > temporal > categorical
 *
 * A field is promoted to a stronger type only when ALL observed non-null
 * values satisfy that type's predicate.
 */

// ─── Regex library ─────────────────────────────────────────────────────────
/**
 * Matches integers and floating-point numbers (positive/negative, scientific
 * notation). Rejects values that cannot be parsed as finite numbers.
 */
const RE_NUMERIC = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

/**
 * Matches a broad set of temporal formats:
 *  • ISO 8601 full datetimes  : 2024-01-15T12:34:56Z / ...+05:30
 *  • ISO 8601 dates           : 2024-01-15
 *  • RFC 2822 dates           : Mon, 15 Jan 2024 12:34:56 +0000
 *  • Common slash/dash dates  : 15/01/2024 | 01-15-2024
 *  • Year-only                : 2024 (blocked — too ambiguous → numeric wins)
 */
const RE_ISO_DATETIME  = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i;
const RE_ISO_DATE      = /^\d{4}-\d{2}-\d{2}$/;
const RE_SLASH_DATE    = /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/;
const RE_RFC_DATE      = /^[A-Za-z]{3},\s\d{1,2}\s[A-Za-z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2}/;

/**
 * Returns true when `str` looks like a temporal value.
 * @param {string} str
 */
const isTemporal = (str) =>
  RE_ISO_DATETIME.test(str) ||
  RE_ISO_DATE.test(str)     ||
  RE_SLASH_DATE.test(str)   ||
  RE_RFC_DATE.test(str);

/**
 * Returns true when `str` looks like a numeric value.
 * @param {string} str
 */
const isNumeric = (str) => RE_NUMERIC.test(str) && isFinite(Number(str));

// ─── Inference engine ──────────────────────────────────────────────────────

const MAX_SAMPLE_VALUES = 10; // Cap sample values per field to keep response lean

/**
 * Infers the data type of a single field from its collected values.
 *
 * @param {any[]} values - All observed values for this field (may include nulls).
 * @returns {'numeric'|'temporal'|'categorical'}
 */
const inferFieldType = (values) => {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonNull.length === 0) return 'categorical'; // Entirely null field

  // Normalise to strings for regex tests (booleans, numbers coerced)
  const strings = nonNull.map(String);

  if (strings.every(isNumeric))   return 'numeric';
  if (strings.every(isTemporal))  return 'temporal';
  return 'categorical';
};

/**
 * Builds a metadata profile for a single field.
 *
 * @param {string} fieldName
 * @param {any[]}  values     - All values seen for this field across all rows.
 * @returns {object}
 */
const profileField = (fieldName, values) => {
  const totalCount = values.length;
  const nullCount  = values.filter(
    (v) => v === null || v === undefined || v === ''
  ).length;

  const nonNull     = values.filter((v) => v !== null && v !== undefined && v !== '');
  const uniqueSet   = new Set(nonNull.map(String));
  const uniqueCount = uniqueSet.size;
  const sampleValues = [...uniqueSet].slice(0, MAX_SAMPLE_VALUES);

  const type     = inferFieldType(values);
  const coverage = totalCount > 0
    ? parseFloat(((totalCount - nullCount) / totalCount).toFixed(4))
    : 0;

  return {
    field:        fieldName,
    type,
    totalCount,
    nullCount,
    uniqueCount,
    coverage,        // Fraction of rows where this field is non-null
    sampleValues,
  };
};

/**
 * Runs the type-inference engine over all flattened rows produced by the
 * Transform phase and returns a field-level metadata profile.
 *
 * @param {object[]} rows - Array of flat row objects.
 * @returns {{
 *   fieldProfiles: object[],
 *   fieldCount: number,
 *   summary: { numeric: number, temporal: number, categorical: number }
 * }}
 */
const inferTypes = (rows) => {
  if (!rows || rows.length === 0) {
    return { fieldProfiles: [], fieldCount: 0, summary: { numeric: 0, temporal: 0, categorical: 0 } };
  }

  console.log(`[typeInference] Profiling ${rows.length} rows …`);

  // ── Step 1: Collect all values per field ──────────────────────────────────
  /** @type {Map<string, any[]>} */
  const fieldValues = new Map();

  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (!fieldValues.has(key)) fieldValues.set(key, []);
      fieldValues.get(key).push(value);
    }
  }

  // ── Step 2: Profile each field ────────────────────────────────────────────
  const fieldProfiles = [];
  const summary = { numeric: 0, temporal: 0, categorical: 0 };

  for (const [fieldName, values] of fieldValues.entries()) {
    const profile = profileField(fieldName, values);
    fieldProfiles.push(profile);
    summary[profile.type] = (summary[profile.type] || 0) + 1;
  }

  // Sort profiles: numeric → temporal → categorical, then alphabetically
  const TYPE_ORDER = { numeric: 0, temporal: 1, categorical: 2 };
  fieldProfiles.sort(
    (a, b) =>
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      a.field.localeCompare(b.field)
  );

  console.log(
    `[typeInference] Complete — ${fieldProfiles.length} fields: ` +
      `${summary.numeric} numeric, ${summary.temporal} temporal, ${summary.categorical} categorical`
  );

  return {
    fieldProfiles,
    fieldCount: fieldProfiles.length,
    summary,
  };
};

module.exports = { inferTypes };
