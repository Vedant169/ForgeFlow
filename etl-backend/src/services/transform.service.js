'use strict';

/**
 * transform.service.js
 *
 * Responsible for the **Transform** phase of the ETL pipeline.
 *
 * Algorithm: deterministic recursive Depth-First Search (DFS) treating
 * every nested JSON object as an N-ary tree.
 *
 * Rules
 * ─────
 * 1. Primitive leaf (string | number | boolean | null)
 *    → written directly into the current flat row as `prefix`.
 *
 * 2. Plain object
 *    → recurse with `prefix_childKey` (underscore-joined path).
 *
 * 3. Array of primitives
 *    → collapsed into a comma-separated string at `prefix`.
 *
 * 4. Array of objects (row-unwinding)
 *    → each element becomes its own record, inheriting the accumulated
 *      parent context (parent fields are duplicated per child row).
 *
 * 5. Mixed arrays (objects + primitives)
 *    → objects are unwound; primitives in the same array are treated
 *      as separate comma-separated entries prepended to the object rows.
 */

/**
 * Determines whether a value is a plain (non-array, non-null) object.
 * @param {*} v
 * @returns {boolean}
 */
const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Recursively flattens a single JSON node into one or more flat row objects.
 *
 * @param {*}      node        - Current JSON node being processed.
 * @param {string} prefix      - Dot-path built so far (will become key prefix).
 * @param {object} parentRow   - Accumulated fields from ancestor nodes.
 * @returns {object[]}           Array of flat row objects.
 */
const flattenNode = (node, prefix, parentRow) => {
  // ── Base case: primitive ─────────────────────────────────────────────────
  if (node === null || typeof node !== 'object') {
    return [{ ...parentRow, [prefix]: node }];
  }

  // ── Array ────────────────────────────────────────────────────────────────
  if (Array.isArray(node)) {
    if (node.length === 0) {
      return [{ ...parentRow, [prefix]: '' }];
    }

    const objectElements    = node.filter(isPlainObject);
    const primitiveElements = node.filter((el) => !isPlainObject(el));

    if (objectElements.length === 0) {
      // Pure primitive array → comma-separated string
      const collapsed = primitiveElements
        .map((el) => (el === null ? 'null' : String(el)))
        .join(', ');
      return [{ ...parentRow, [prefix]: collapsed }];
    }

    // Mixed or pure object array → unwind (one row per object element)
    const primitiveStr =
      primitiveElements.length > 0
        ? primitiveElements
            .map((el) => (el === null ? 'null' : String(el)))
            .join(', ')
        : undefined;

    const baseRow = primitiveStr !== undefined
      ? { ...parentRow, [prefix]: primitiveStr }
      : { ...parentRow };

    // Each object element is independently flattened and inherits parentRow
    return objectElements.flatMap((objEl) =>
      flattenNode(objEl, prefix, baseRow)
    );
  }

  // ── Plain object ─────────────────────────────────────────────────────────
  const keys = Object.keys(node);
  if (keys.length === 0) {
    return [{ ...parentRow, [prefix]: '{}' }];
  }

  // DFS: process each child key and cross-join the resulting row sets
  let rows = [{ ...parentRow }];

  for (const key of keys) {
    const childPrefix = prefix ? `${prefix}_${key}` : key;
    const childRows   = [];

    for (const row of rows) {
      const expanded = flattenNode(node[key], childPrefix, row);
      childRows.push(...expanded);
    }

    rows = childRows;
  }

  return rows;
};

/**
 * Entry point for the Transform phase.
 *
 * Accepts the raw parsed JSON from the Extract phase (any shape: object,
 * array of objects, or a root-level array of primitives) and returns a
 * normalised array of flat row objects ready for type inference and loading.
 *
 * @param {*} rawData - Parsed JSON from the extract service.
 * @returns {{ rows: object[], rowCount: number }}
 */
const transformData = (rawData) => {
  console.log('[transform] Starting DFS flattening …');

  let rows;

  if (Array.isArray(rawData)) {
    // Top-level array — process each element independently
    rows = rawData.flatMap((item, idx) => {
      if (isPlainObject(item)) {
        return flattenNode(item, '', {});
      }
      // Primitive at root array level
      return [{ _value: item, _index: idx }];
    });
  } else if (isPlainObject(rawData)) {
    rows = flattenNode(rawData, '', {});
  } else {
    // Raw primitive at document root
    rows = [{ _value: rawData }];
  }

  // Strip empty-string prefix keys introduced by root-object unwrapping
  rows = rows.map((row) => {
    if ('' in row) {
      const { '': _discarded, ...rest } = row; // eslint-disable-line no-unused-vars
      return rest;
    }
    return row;
  });

  console.log(`[transform] Flattening complete — ${rows.length} rows produced`);
  return { rows, rowCount: rows.length };
};

module.exports = { transformData };
