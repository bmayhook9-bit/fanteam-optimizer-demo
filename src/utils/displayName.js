export function looksNumericish(s = '') {
  return /\d{3,}/.test((s || '').replace(/[.,\s]/g, ''));
}

export function buildDisplayName(row, cols) {
  const d = cols.displayCol !== -1 ? (row[cols.displayCol] || '').trim() : '';
  const f = cols.firstCol !== -1 ? (row[cols.firstCol] || '').trim() : '';
  const l = cols.lastCol !== -1 ? (row[cols.lastCol] || '').trim() : '';

  let name = '';
  if (d) {
    if (!d.includes(' ') && l && !looksNumericish(l)) name = `${d} ${l}`;
    else name = d;
  } else {
    name = f && l ? `${f} ${l}` : l || f;
  }

  if (!name || looksNumericish(name)) {
    if (f && !looksNumericish(f)) name = f;
    if (l && !looksNumericish(l)) name = name ? `${name} ${l}` : l;
  }
  return (name || '').trim();
}
