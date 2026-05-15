const fs = require("fs");
const mysql = require("mysql2/promise");

async function main() {
  let sql = fs.readFileSync("./database.sql", "utf8");

  sql = sql
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t.startsWith("--")) return false;
      if (t.startsWith("/*")) return false;
      if (t.startsWith("*")) return false;
      if (t.startsWith("*/")) return false;
      if (t.includes("DATABASE TK AL ANSHOR")) return false;
      if (t.includes("Jalankan")) return false;
      return true;
    })
    .join("\n")
    .replace(/CREATE DATABASE.*?;/gis, "")
    .replace(/USE\s+`?.*?`?\s*;/gis, "");

  const db = await mysql.createConnection(
    "mysql://root:TDhRhxRmLRauXJYnggPftNqWSelKQcqq@yamanote.proxy.rlwy.net:53665/railway",
  );

  await db.query("SET FOREIGN_KEY_CHECKS=0;");
  await db.query(sql);
  await db.query("SET FOREIGN_KEY_CHECKS=1;");

  console.log("✅ Database berhasil diimport ke Railway!");
  await db.end();
}

main().catch((err) => {
  console.error("❌ Gagal import:", err.message);
});
