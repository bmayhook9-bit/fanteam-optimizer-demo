import { describe, it, expect } from 'vitest';
import { buildDisplayName } from '../src/utils/displayName.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('buildDisplayName with CSV fixtures', () => {
  it('parses names from naming_examples.csv', () => {
    const csvPath = path.join(__dirname, 'fixtures/demo/naming_examples.csv');
    const text = readFileSync(csvPath, 'utf-8').trim();
    const rows = text
      .split(/\r?\n/)
      .slice(1)
      .map((line) => line.split(','));
    const cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
    const names = rows.map((row) => buildDisplayName(row, cols));
    expect(names).toEqual(['Tom Brady', 'Jane Doe', 'Alan Shearer']);
  });
});
