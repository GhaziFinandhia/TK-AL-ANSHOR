const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const db = require("./config/db");

const app = express();
const PORT = 3000;

async function ensureAdmin() {
  const email = "admin@tkalanshor.sch.id";
  const password = "AlAnshor2026!";
  const hash = await bcrypt.hash(password, 10);

  db.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
    (err, result) => {
      if (err) return console.error("CEK ADMIN ERROR:", err);

      if (result.length > 0) {
        db.query(
          "UPDATE users SET nama=?, password=?, role=? WHERE email=?",
          ["Admin", hash, "admin", email],
          (err2) => {
            if (err2) return console.error("UPDATE ADMIN ERROR:", err2);
            console.log("✅ Admin siap: admin@tkalanshor.sch.id / admin123");
          },
        );
      } else {
        db.query(
          "INSERT INTO users (nama,email,password,role) VALUES (?,?,?,?)",
          ["Admin", email, hash, "admin"],
          (err2) => {
            if (err2) return console.error("INSERT ADMIN ERROR:", err2);
            console.log("✅ Admin dibuat: admin@tkalanshor.sch.id / admin123");
          },
        );
      }
    },
  );
}

/* ==================================
   MULTER — UPLOAD DOKUMEN
================================== */
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${file.fieldname}_${req.session.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext)
    ? cb(null, true)
    : cb(new Error("Format tidak didukung"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ==================================
   MIDDLEWARE
================================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use(
  session({
    secret: "tkalanshor_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
  }),
);

/* ==================================
   HELPER
================================== */
function cekLogin(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}
function cekAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") return next();
  res.redirect("/login");
}

/* ==================================
   HALAMAN PUBLIC
================================== */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "home.html")),
);
app.get("/galeri", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "galeri.html")),
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "login.html")),
);
app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "register.html")),
);

/* ==================================
   REGISTER — semua field baru
================================== */
app.post("/register", async (req, res) => {
  const {
    nama,
    email,
    password,
    nama_anak,
    nama_panggilan,
    ttl,
    jk,
    agama,
    anak_ke,
    jumlah_saudara,
    no_telepon,
    alamat_anak,
    size_seragam,
    nama_ayah,
    ttl_ayah,
    pekerjaan_ayah,
    agama_ayah,
    pendidikan_ayah,
    alamat_ayah,
    kantor_ayah,
    nama_ibu,
    ttl_ibu,
    pekerjaan_ibu,
    agama_ibu,
    pendidikan_ibu,
    alamat_ibu,
    kantor_ibu,
    nama_ortu,
  } = req.body;

  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nama || !cleanEmail || !password || !nama_anak) {
    return res.json({ success: false, message: "Data tidak lengkap" });
  }

  if (!emailValid.test(cleanEmail)) {
    return res.json({ success: false, message: "Format email tidak valid" });
  }

  try {
    db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [cleanEmail],
      async (cekErr, cekResult) => {
        if (cekErr) {
          console.error("CEK EMAIL ERROR:", cekErr);
          return res.json({ success: false, message: "Database error" });
        }

        if (cekResult.length > 0) {
          return res.json({ success: false, message: "Email sudah digunakan" });
        }

        const hash = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (nama,email,password,role) VALUES (?,?,?,?)",
          [nama, cleanEmail, hash, "wali"],
          (err, result) => {
            if (err) {
              console.error("REGISTER USER ERROR:", err);
              return res.json({
                success: false,
                message: "Gagal membuat akun",
              });
            }

            const userId = result.insertId;

            const sql = `
              INSERT INTO pendaftaran (
                user_id,
                nama_anak, nama_panggilan, ttl, jk, agama,
                anak_ke, jumlah_saudara, no_telepon, alamat_anak, size_seragam,
                nama_ayah, ttl_ayah, pekerjaan_ayah, agama_ayah,
                pendidikan_ayah, alamat_ayah, kantor_ayah,
                nama_ibu, ttl_ibu, pekerjaan_ibu, agama_ibu,
                pendidikan_ibu, alamat_ibu, kantor_ibu,
                nama_ortu, status
              ) VALUES (
                ?,
                ?,?,?,?,?,
                ?,?,?,?,?,
                ?,?,?,?,
                ?,?,?,
                ?,?,?,?,
                ?,?,?,
                ?,?
              )`;

            const values = [
              userId,
              nama_anak || "",
              nama_panggilan || "",
              ttl || "",
              jk || "",
              agama || "",
              anak_ke || 1,
              jumlah_saudara || 0,
              no_telepon || "",
              alamat_anak || "",
              size_seragam || "",
              nama_ayah || "",
              ttl_ayah || "",
              pekerjaan_ayah || "",
              agama_ayah || "",
              pendidikan_ayah || "",
              alamat_ayah || "",
              kantor_ayah || "",
              nama_ibu || "",
              ttl_ibu || "",
              pekerjaan_ibu || "",
              agama_ibu || "",
              pendidikan_ibu || "",
              alamat_ibu || "",
              kantor_ibu || "",
              nama_ortu || nama,
              "Menunggu Verifikasi",
            ];

            db.query(sql, values, (err2) => {
              if (err2) {
                console.error("INSERT PENDAFTARAN ERROR:", err2);

                db.query("DELETE FROM users WHERE id = ?", [userId]);

                return res.json({
                  success: false,
                  message: "Gagal simpan data siswa",
                });
              }

              req.session.user = {
                id: userId,
                nama,
                email: cleanEmail,
                role: "wali",
              };

              res.json({ success: true, redirect: "/dashboard" });
            });
          },
        );
      },
    );
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: "Terjadi kesalahan server" });
  }
});

/* ==================================
   LOGIN
================================== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Email dan password wajib diisi",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email=? LIMIT 1",
    [email],
    async (err, result) => {
      if (err) return res.json({ success: false, message: "Database error" });
      if (result.length === 0)
        return res.json({ success: false, message: "Email tidak ditemukan" });

      const user = result[0];
      const cocok = await bcrypt.compare(password, user.password);
      if (!cocok)
        return res.json({ success: false, message: "Password salah" });

      req.session.user = {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      };

      const redirect = user.role === "admin" ? "/admin" : "/dashboard";
      console.log(`LOGIN OK: ${user.email} → ${redirect}`);
      res.json({ success: true, redirect });
    },
  );
});

/* ==================================
   LOGOUT
================================== */
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

/* ==================================
   UPLOAD DOKUMEN
================================== */
app.post(
  "/upload-dokumen",
  cekLogin,
  upload.fields([
    { name: "akta_kelahiran", maxCount: 1 },
    { name: "kartu_keluarga", maxCount: 1 },
    { name: "foto_anak", maxCount: 1 },
    { name: "bukti_pembayaran", maxCount: 1 },
  ]),
  (req, res) => {
    const userId = req.session.user.id;
    const files = req.files;

    const akta = files.akta_kelahiran ? files.akta_kelahiran[0].filename : null;
    const kk = files.kartu_keluarga ? files.kartu_keluarga[0].filename : null;
    const foto = files.foto_anak ? files.foto_anak[0].filename : null;
    const bukti = files.bukti_pembayaran
      ? files.bukti_pembayaran[0].filename
      : null;

    db.query(
      `UPDATE pendaftaran SET
    akta_kelahiran = COALESCE(?, akta_kelahiran),
    kartu_keluarga = COALESCE(?, kartu_keluarga),
    foto_anak = COALESCE(?, foto_anak),
    bukti_pembayaran = COALESCE(?, bukti_pembayaran),
    status_pembayaran = CASE
      WHEN ? IS NOT NULL THEN 'Menunggu Verifikasi'
      ELSE status_pembayaran
    END,
    tanggal_pembayaran = CASE
      WHEN ? IS NOT NULL THEN NOW()
      ELSE tanggal_pembayaran
    END,
    updated_at = NOW()
   WHERE user_id = ?`,
      [akta, kk, foto, bukti, bukti, bukti, userId],
      (err) => {
        if (err) {
          console.error(err);
          return res.json({ success: false, message: "Gagal upload" });
        }
        res.json({ success: true, redirect: "/dashboard" });
      },
    );
  },
);

/* ==================================
   DASHBOARD
================================== */
app.get("/dashboard", cekLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/api/dashboard", cekLogin, (req, res) => {
  const userId = req.session.user.id;

  db.query(
    "SELECT * FROM pendaftaran WHERE user_id = ? LIMIT 1",
    [userId],
    (err, dataSiswa) => {
      if (err) return res.json({ success: false, message: err.message });

      db.query(
        "SELECT * FROM pengumuman ORDER BY created_at DESC LIMIT 5",
        (err2, pengumuman) => {
          if (err2) return res.json({ success: false });

          res.json({
            success: true,
            user: req.session.user,
            siswa: dataSiswa[0] || null,
            pengumuman: pengumuman || [],
          });
        },
      );
    },
  );
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, user: req.session.user });
});

/* ==================================
   ADMIN
================================== */
app.get("/admin", cekAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/api/admin/stats", cekAdmin, (req, res) => {
  db.query(
    "SELECT status, COUNT(*) as total FROM pendaftaran GROUP BY status",
    (err, stats) => {
      if (err) return res.json({ success: false });
      db.query("SELECT COUNT(*) as total FROM pendaftaran", (err2, total) => {
        if (err2) return res.json({ success: false });
        res.json({ success: true, stats, total: total[0].total });
      });
    },
  );
});

app.get("/api/admin/pendaftar", cekAdmin, (req, res) => {
  db.query(
    `SELECT p.*, u.email
     FROM pendaftaran p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC`,
    (err, result) => {
      if (err) return res.json({ success: false });
      res.json({ success: true, data: result });
    },
  );
});

app.post("/api/admin/status", cekAdmin, (req, res) => {
  const { id, status, keterangan, kelas } = req.body;

  db.query(
    "UPDATE pendaftaran SET status=?, keterangan=?, kelas=? WHERE id=?",
    [status, keterangan || "", kelas || "", id],
    (err) => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    },
  );
});

app.post("/api/admin/verifikasi-pembayaran", cekAdmin, (req, res) => {
  const { id, status } = req.body;

  db.query(
    "UPDATE pendaftaran SET status_pembayaran=? WHERE id=?",
    [status, id],
    (err) => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    },
  );
});

/* ==================================
   CETAK BUKTI
================================== */
app.get("/cetak", cekLogin, (req, res) => {
  const userId = req.session.user.id;

  db.query(
    `SELECT p.*, u.email FROM pendaftaran p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ? LIMIT 1`,
    [userId],
    (err, result) => {
      if (err || result.length === 0) return res.send("Data tidak ditemukan");

      const s = result[0];
      const tgl = s.created_at
        ? new Date(s.created_at).toLocaleDateString("id-ID")
        : "-";
      const statusColor = {
        Diterima: "#155724",
        Ditolak: "#721c24",
        "Menunggu Verifikasi": "#856404",
      };
      const statusBg = {
        Diterima: "#d4edda",
        Ditolak: "#f8d7da",
        "Menunggu Verifikasi": "#fff3cd",
      };

      res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Bukti Pendaftaran - ${s.nama_anak}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:36px;color:#222;max-width:820px;margin:auto}
    .header{text-align:center;border-bottom:3px solid #0f7c5e;padding-bottom:18px;margin-bottom:24px}
    .header h1{color:#0f7c5e;font-size:22px;margin:0}
    .header p{color:#555;margin:3px 0;font-size:13px}
    .sec{background:#e1f5ee;color:#0f7c5e;padding:7px 14px;border-radius:6px;font-weight:bold;margin:18px 0 8px;font-size:13px}
    table{width:100%;border-collapse:collapse}
    td{padding:7px 11px;border-bottom:1px solid #eee;font-size:13px}
    td:first-child{color:#555;width:38%}
    td:last-child{font-weight:600}
    .badge{display:inline-block;padding:3px 14px;border-radius:20px;font-weight:bold;font-size:12px}
    .footer{margin-top:36px;text-align:center;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:16px}
    @media print{button{display:none}}
  </style>
</head>
<body>
  <div class="header">
    <h1>TK AL ANSHOR</h1>
    <p>Jl. Raya Legok, Kec. Legok, Kab. Tangerang, Prov. Banten | Telp: 081298077964</p>
    <h2 style="color:#222;margin-top:14px;font-size:16px">Bukti Pendaftaran Peserta Didik</h2>
    <p>Tahun Ajaran ${s.tahun_ajaran || "2026/2027"}</p>
  </div>

  <div class="sec">Data Calon Peserta Didik</div>
  <table>
    <tr><td>Nama Lengkap</td><td>${s.nama_anak}</td></tr>
    <tr><td>Nama Panggilan</td><td>${s.nama_panggilan || "-"}</td></tr>
    <tr><td>Tempat, Tanggal Lahir</td><td>${s.ttl}</td></tr>
    <tr><td>Jenis Kelamin</td><td>${s.jk}</td></tr>
    <tr><td>Agama</td><td>${s.agama || "-"}</td></tr>
    <tr><td>Anak Ke-</td><td>${s.anak_ke || "-"}</td></tr>
    <tr><td>Jumlah Saudara</td><td>${s.jumlah_saudara ?? "-"}</td></tr>
    <tr><td>Alamat</td><td>${s.alamat_anak || "-"}</td></tr>
    <tr><td>No. Telepon</td><td>${s.no_telepon || "-"}</td></tr>
    <tr><td>Size Seragam</td><td>${s.size_seragam || "-"}</td></tr>
  </table>

  <div class="sec">Data Ayah</div>
  <table>
    <tr><td>Nama Ayah</td><td>${s.nama_ayah || "-"}</td></tr>
    <tr><td>Tempat, Tanggal Lahir</td><td>${s.ttl_ayah || "-"}</td></tr>
    <tr><td>Pekerjaan</td><td>${s.pekerjaan_ayah || "-"}</td></tr>
    <tr><td>Agama</td><td>${s.agama_ayah || "-"}</td></tr>
    <tr><td>Pendidikan Terakhir</td><td>${s.pendidikan_ayah || "-"}</td></tr>
    <tr><td>Alamat Rumah</td><td>${s.alamat_ayah || "-"}</td></tr>
    <tr><td>Alamat Kantor / Telp</td><td>${s.kantor_ayah || "-"}</td></tr>
  </table>

  <div class="sec">Data Ibu</div>
  <table>
    <tr><td>Nama Ibu</td><td>${s.nama_ibu || "-"}</td></tr>
    <tr><td>Tempat, Tanggal Lahir</td><td>${s.ttl_ibu || "-"}</td></tr>
    <tr><td>Pekerjaan</td><td>${s.pekerjaan_ibu || "-"}</td></tr>
    <tr><td>Agama</td><td>${s.agama_ibu || "-"}</td></tr>
    <tr><td>Pendidikan Terakhir</td><td>${s.pendidikan_ibu || "-"}</td></tr>
    <tr><td>Alamat Rumah</td><td>${s.alamat_ibu || "-"}</td></tr>
    <tr><td>Alamat Kantor / Telp</td><td>${s.kantor_ibu || "-"}</td></tr>
  </table>

  <div class="sec">Status Pendaftaran</div>
  <table>
    <tr><td>Status</td>
      <td><span class="badge" style="background:${statusBg[s.status] || "#eee"};color:${statusColor[s.status] || "#333"}">${s.status}</span></td>
    </tr>
    <tr><td>Kelas</td><td>${s.kelas || "-"}</td></tr>
    <tr><td>Tanggal Daftar</td><td>${tgl}</td></tr>
    ${s.keterangan ? `<tr><td>Keterangan</td><td>${s.keterangan}</td></tr>` : ""}
  </table>

  <div class="footer">
    <p>Dokumen ini dicetak dari sistem pendaftaran TK AL ANSHOR</p>
    <p>© 2026 TK AL ANSHOR. All rights reserved.</p>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`);
    },
  );
});

/* ==================================
   404
================================== */
app.use((req, res) => {
  res.status(404).send(`
    <div style="text-align:center;padding:80px;font-family:sans-serif">
      <h2 style="color:#0f7c5e">404 - Halaman tidak ditemukan</h2>
      <a href="/" style="color:#0f7c5e">Kembali ke Home</a>
    </div>`);
});

/* ==================================
   START
================================== */
ensureAdmin();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server jalan di network port ${PORT}`);
});
