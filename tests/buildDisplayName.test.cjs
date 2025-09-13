const assert = require('assert');

function looksNumericish(s){ return /\d{3,}/.test((s||'').replace(/[.,\s]/g,'')); }
function buildDisplayName(row, cols){
  const d = cols.displayCol!==-1? (row[cols.displayCol]||'').trim() : '';
  const f = cols.firstCol!==-1?   (row[cols.firstCol]  ||'').trim() : '';
  const l = cols.lastCol!==-1?    (row[cols.lastCol]   ||'').trim() : '';

  let name = '';
  if(d){
    if(!d.includes(' ') && l && !looksNumericish(l)) name = `${d} ${l}`;
    else name = d;
  } else {
    name = (f && l ? `${f} ${l}` : (l || f));
  }

  if(!name || looksNumericish(name)){
    if(f && !looksNumericish(f)) name = f;
    if(l && !looksNumericish(l)) name = name ? `${name} ${l}` : l;
  }
  return (name||'').trim();
}

// Test 1: display column already has full name
let row = ['', 'Alan Shearer', '', ''];
let cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
assert.strictEqual(buildDisplayName(row, cols), 'Alan Shearer');

// Test 2: display column only given name, last name available
row = ['', 'Tom', 'Tom', 'Brady'];
cols = { displayCol: 1, firstCol: 2, lastCol: 3 };
assert.strictEqual(buildDisplayName(row, cols), 'Tom Brady');

// Test 3: no display column, use first + last
row = ['', '', 'Jane', 'Doe'];
cols = { displayCol: -1, firstCol: 2, lastCol: 3 };
assert.strictEqual(buildDisplayName(row, cols), 'Jane Doe');

console.log('All tests passed.');
