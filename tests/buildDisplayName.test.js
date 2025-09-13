import { describe, it, expect } from 'vitest';
import { buildDisplayName } from '../src/utils/displayName.js';

describe('buildDisplayName', () => {
  it('display column already has full name', () => {
    const row = ['', 'Alan Shearer', '', ''];
    const cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
    expect(buildDisplayName(row, cols)).toBe('Alan Shearer');
  });

  it('display column only given name, last name available', () => {
    const row = ['', 'Tom', 'Tom', 'Brady'];
    const cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
    expect(buildDisplayName(row, cols)).toBe('Tom Brady');
  });

  it('no display column, use first + last', () => {
    const row = ['', '', 'Jane', 'Doe'];
    const cols = { displayCol: -1, firstCol: 2, lastCol: 3 };
    expect(buildDisplayName(row, cols)).toBe('Jane Doe');
  });
});
