import { describe, it, expect } from 'vitest';

function looksNumericish(s) {
  return /\d{3,}/.test((s || '').replace(/[.,\s]/g, ''));
}

function buildDisplayName(row, cols) {
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

describe('buildDisplayName', () => {
  it('uses display column when full name provided', () => {
    const row = ['', 'Alan Shearer', '', ''];
    const cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
    expect(buildDisplayName(row, cols)).toBe('Alan Shearer');
  });

  it('appends last name if display column lacks surname', () => {
    const row = ['', 'Tom', 'Tom', 'Brady'];
    const cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
    expect(buildDisplayName(row, cols)).toBe('Tom Brady');
  });

  it('falls back to first and last when display absent', () => {
    const row = ['', '', 'Jane', 'Doe'];
    const cols = { displayCol: -1, firstCol: 2, lastCol: 3 };
    expect(buildDisplayName(row, cols)).toBe('Jane Doe');
  });
});

