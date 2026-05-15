const fs = require("fs");
const mysql = require("mysql2/promise");

async function main() {
  let sql = fs.readFileSync("./database_ngfa_full_ready.sql", "utf8");

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });

  const queries = sql
    .split(/;\s*\n/)
    .map((q) => q.trim())
    .filter(Boolean);

  await db.query("SET FOREIGN_KEY_CHECKS=0");

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    try {
      await db.query(q);
      console.log(`✅ Query ${i + 1}/${queries.length} sukses`);
    } catch (err) {
      console.error(`❌ Query ${i + 1} gagal:`, err.message);
      console.error(q.slice(0, 300));
      throw err;
    }
  }

  await db.query("SET FOREIGN_KEY_CHECKS=1");
  console.log("✅ Database berhasil diimport!");
  await db.end();
}

main().catch((err) => {
  console.error("❌ Gagal:", err.message);
});
