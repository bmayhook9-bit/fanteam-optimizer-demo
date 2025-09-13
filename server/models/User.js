const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../users.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    tier TEXT
  )`);
});

module.exports = {
  createUser(username, password, tier = 'free') {
    return new Promise((resolve, reject) => {
      const stmt = `INSERT INTO users (username, password, tier) VALUES (?,?,?)`;
      db.run(stmt, [username, password, tier], function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, username, tier });
      });
    });
  },
  findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
};
