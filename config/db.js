const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // KOSONGKAN
  database: "tk_al_anshor",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Error:", err);
    return;
  }
  console.log("MySQL Connected");
});

module.exports = db;
