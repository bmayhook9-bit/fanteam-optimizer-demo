const db = require('../db');

exports.createUser = (email, password, tier='FREE') => {
  return new Promise((resolve, reject) => {
    const stmt = `INSERT INTO users(email, password, tier) VALUES(?,?,?)`;
    db.run(stmt, [email, password, tier], function(err){
      if(err) return reject(err);
      resolve({ id: this.lastID, email, tier });
    });
  });
};

exports.findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE email=?`, [email], (err,row) => {
      if(err) return reject(err);
      resolve(row);
    });
  });
};
