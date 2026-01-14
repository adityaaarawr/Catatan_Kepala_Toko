-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Waktu pembuatan: 14 Jan 2026 pada 16.17
-- Versi server: 9.1.0
-- Versi PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `catatan_kepala_toko`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `divisi`
--

DROP TABLE IF EXISTS `divisi`;
CREATE TABLE IF NOT EXISTS `divisi` (
  `id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `nama_divisi` varchar(255) DEFAULT NULL,
  `deskripsi` text,
  `toko_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `divisi`
--

INSERT INTO `divisi` (`id`, `created_at`, `username`, `nama_divisi`, `deskripsi`, `toko_id`) VALUES
(1, '2026-01-14 11:51:18', 'admin', 'IT', 'IT Support ', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `karyawan`
--

DROP TABLE IF EXISTS `karyawan`;
CREATE TABLE IF NOT EXISTS `karyawan` (
  `id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `nama_karyawan` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `divisi_id` int DEFAULT NULL,
  `toko_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `divisi_id` (`divisi_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `karyawan`
--

INSERT INTO `karyawan` (`id`, `created_at`, `username`, `nama_karyawan`, `name`, `divisi_id`, `toko_id`) VALUES
(1, '2026-01-14 11:51:56', 'admin', 'Andika', 'Dika', 1, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `notes`
--

DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `toko_id` int DEFAULT NULL,
  `karyawan_id` int DEFAULT NULL,
  `divisi_id` int DEFAULT NULL,
  `topik_id` int DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `catatan` text,
  `file_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `toko_id` (`toko_id`),
  KEY `karyawan_id` (`karyawan_id`),
  KEY `divisi_id` (`divisi_id`),
  KEY `topik_id` (`topik_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `notes`
--

INSERT INTO `notes` (`id`, `user_id`, `toko_id`, `karyawan_id`, `divisi_id`, `topik_id`, `tanggal`, `catatan`, `file_name`, `created_at`) VALUES
(1, 1, 1, 1, 1, 1, '2026-01-14', 'hehehehehehhehehehehehehehehehehehehehehehehehehehehehehehehehehehehehehehehehehehe', 'adit.png', '2026-01-14 12:26:05');

-- --------------------------------------------------------

--
-- Struktur dari tabel `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL,
  `role_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `role_name` (`role_name`(250))
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `created_at`, `created_by`) VALUES
(1, 'administrator', '2026-01-13 17:00:04', 1),
(2, 'kepala_toko_tms', '2026-01-14 09:05:58', 1),
(3, 'kepala_toko_ol', '2026-01-14 09:06:49', 1),
(4, 'kepala_toko_rj', '2026-01-14 09:07:50', 1),
(5, 'kepala_toko_hk', '2026-01-14 09:08:18', 1),
(6, 'kepala_toko_ik', '2026-01-14 09:08:58', 1),
(7, 'kepala_toko_tmj', '2026-01-14 09:09:21', 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `role_key`
--

DROP TABLE IF EXISTS `role_key`;
CREATE TABLE IF NOT EXISTS `role_key` (
  `id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `role_key_name` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `role_key`
--

INSERT INTO `role_key` (`id`, `created_at`, `role_key_name`) VALUES
(1, NULL, 'enable'),
(2, NULL, 'expiration_date'),
(3, NULL, 'update_toko'),
(4, NULL, 'manage_user'),
(5, NULL, 'update_role'),
(6, NULL, 'update_divisi'),
(7, NULL, 'update_topik'),
(8, NULL, 'update_karyawan'),
(9, NULL, 'view_note'),
(10, NULL, 'input_note'),
(11, NULL, 'update_note'),
(12, NULL, 'delete_note');

-- --------------------------------------------------------

--
-- Struktur dari tabel `toko`
--

DROP TABLE IF EXISTS `toko`;
CREATE TABLE IF NOT EXISTS `toko` (
  `id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `nama_toko` varchar(255) DEFAULT NULL,
  `kode` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `toko`
--

INSERT INTO `toko` (`id`, `created_at`, `username`, `nama_toko`, `kode`) VALUES
(1, '2026-01-13 15:38:46', 'admin', 'Toyomatsu Surabaya', 'TMS'),
(2, '2026-01-13 15:39:24', 'admin', 'Robin Jaya', 'RJ'),
(3, '2026-01-13 15:39:32', 'admin', 'Hikomi', 'HK'),
(4, '2026-01-13 15:39:42', 'admin', 'Online', 'OL'),
(5, '2026-01-13 15:39:52', 'admin', 'Ikkou', 'IK'),
(6, '2026-01-13 15:40:02', 'admin', 'Toyomatsu Japanan', 'TMJ');

-- --------------------------------------------------------

--
-- Struktur dari tabel `topik`
--

DROP TABLE IF EXISTS `topik`;
CREATE TABLE IF NOT EXISTS `topik` (
  `id` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `nama_topik` varchar(255) DEFAULT NULL,
  `toko_id` int DEFAULT NULL,
  `divisi_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `divisi_id` (`divisi_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `topik`
--

INSERT INTO `topik` (`id`, `created_at`, `username`, `nama_topik`, `toko_id`, `divisi_id`) VALUES
(1, '2026-01-14 11:52:54', 'admin', 'Kebersihan', 1, 1);

-- --------------------------------------------------------

--
-- Struktur dari tabel `transaksi_user_role`
--

DROP TABLE IF EXISTS `transaksi_user_role`;
CREATE TABLE IF NOT EXISTS `transaksi_user_role` (
  `id` int NOT NULL,
  `role_id` int DEFAULT NULL,
  `role_key_name` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `key_value_datetime` datetime DEFAULT NULL,
  `key_value_bool` tinyint(1) DEFAULT NULL,
  `key_value_integer` int DEFAULT NULL,
  `key_value_string` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `transaksi_user_role`
--

INSERT INTO `transaksi_user_role` (`id`, `role_id`, `role_key_name`, `key_value_datetime`, `key_value_bool`, `key_value_integer`, `key_value_string`) VALUES
(1, 1, 'enable', NULL, 1, NULL, NULL),
(2, 1, 'expiration_date', NULL, NULL, NULL, 'forever'),
(3, 1, 'update_toko', NULL, 1, NULL, NULL),
(4, 1, 'manage_user', NULL, NULL, NULL, 'all'),
(5, 1, 'update_role', NULL, NULL, NULL, 'all'),
(6, 1, 'update_divisi', NULL, NULL, NULL, 'all'),
(7, 1, 'update_topik', NULL, NULL, NULL, 'all'),
(8, 1, 'update_karyawan', NULL, NULL, NULL, 'all'),
(9, 1, 'view_note', NULL, NULL, NULL, 'all'),
(10, 1, 'input_note', NULL, NULL, NULL, 'all'),
(11, 1, 'update_note', NULL, NULL, NULL, 'all'),
(12, 1, 'delete_note', NULL, NULL, NULL, 'all');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `role_id`, `created_at`) VALUES
(1, 'administrator', 'admin', 1, '2026-01-14 08:57:27'),
(2, 'budi santoso', 'budi_tms', 1, '2026-01-14 16:37:18');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
