]-- ===================================
-- DATABASE TK AL ANSHOR
-- Jalankan di phpMyAdmin tab SQL, atau:
-- mysql -u root -p < database.sql
-- ===================================
DROP DATABASE IF EXISTS tk_al_anshor;
CREATE DATABASE tk_al_anshor;
USE tk_al_anshor;

-- ===================================
-- TABEL USERS
-- ===================================
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nama       VARCHAR(100),
  email      VARCHAR(100) UNIQUE,
  password   VARCHAR(255),
  role       ENUM('admin','wali') DEFAULT 'wali',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- TABEL PENDAFTARAN (lengkap)
-- ===================================
CREATE TABLE pendaftaran (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT,

  -- ── Data Anak ──
  nama_anak       VARCHAR(100),
  nama_panggilan  VARCHAR(100),
  ttl             VARCHAR(150),         -- tempat, tanggal lahir gabung
  jk              VARCHAR(20),          -- Laki-laki / Perempuan
  agama           VARCHAR(30),
  anak_ke         INT DEFAULT 1,
  jumlah_saudara  INT DEFAULT 0,
  alamat_anak     TEXT,                 -- alamat + telepon anak/keluarga
  size_seragam    VARCHAR(10),          -- S / M / L / XL / XXL / XXXL

  -- ── Data Ayah ──
  nama_ayah       VARCHAR(100),
  ttl_ayah        VARCHAR(150),
  pekerjaan_ayah  VARCHAR(100),
  agama_ayah      VARCHAR(30),
  alamat_ayah     TEXT,
  kantor_ayah     VARCHAR(255),         -- alamat kantor + telepon ayah
  pendidikan_ayah VARCHAR(50),

  -- ── Data Ibu ──
  nama_ibu        VARCHAR(100),
  ttl_ibu         VARCHAR(150),
  pekerjaan_ibu   VARCHAR(100),
  agama_ibu       VARCHAR(30),
  alamat_ibu      TEXT,
  kantor_ibu      VARCHAR(255),
  pendidikan_ibu  VARCHAR(50),

  -- ── Kontak utama (untuk login/notif) ──
  no_telepon      VARCHAR(20),
  nama_ortu       VARCHAR(100),         -- nama wali yang daftar

  -- ── Alamat detail ──
  kelurahan       VARCHAR(100),
  kecamatan       VARCHAR(100),
  kabupaten       VARCHAR(100),
  provinsi        VARCHAR(100),
  kode_pos        VARCHAR(10),

  -- ── Dokumen upload ──
  akta_kelahiran  VARCHAR(255),
  kartu_keluarga  VARCHAR(255),
  foto_anak       VARCHAR(255),

  -- ── Status ──
  status          VARCHAR(30)  DEFAULT 'Menunggu Verifikasi',
  keterangan      TEXT,
  tahun_ajaran    VARCHAR(10)  DEFAULT '2026/2027',
  kelas           VARCHAR(10),

  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===================================
-- TABEL PENGUMUMAN
-- ===================================
CREATE TABLE pengumuman (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  judul      VARCHAR(200) NOT NULL,
  isi        TEXT NOT NULL,
  tipe       ENUM('info','penting','peringatan') DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================
-- ADMIN DEFAULT
-- email    : admin@tkalanshor.sch.id
-- password : admin123
-- ===================================
INSERT INTO users (nama, email, password, role) VALUES
('Admin', 'admin@tkalanshor.sch.id',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uAdQTboy',
 'admin');

-- ===================================
-- PENGUMUMAN AWAL
-- ===================================
INSERT INTO pengumuman (judul, isi, tipe) VALUES
('Pembukaan Tahun Ajaran Baru',  'Tahun ajaran baru dimulai 15 Juli 2026',          'info'),
('Jadwal Orientasi Siswa Baru',  'Orientasi akan diadakan pada 10 Juli 2026',        'penting'),
('Pengambilan Seragam',          'Seragam dapat diambil mulai 5 Juli 2026',          'info');