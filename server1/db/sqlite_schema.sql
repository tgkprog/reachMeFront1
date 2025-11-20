-- SQLite schema adapted from MySQL schema_full.sql

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS reach_me_messages;
DROP TABLE IF EXISTS pblcRechms;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  pwdLogin INTEGER DEFAULT 0,
  admin TEXT DEFAULT 'no',
  googleOauth INTEGER DEFAULT 0,
  USER_GOOGLE_EMAIL TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  account_status TEXT DEFAULT 'active',
  balance_tokens INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pblcRechms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  url_code TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  deactivate_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE reach_me_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  public_reachme_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  datetime_alarm DATETIME NOT NULL,
  is_ack_app INTEGER DEFAULT 0,
  is_ack_all INTEGER DEFAULT 0,
  reached_client INTEGER DEFAULT 0,
  sender_info TEXT NULL,
  sent_details TEXT DEFAULT '{}',
  auto_deactivate_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (public_reachme_id) REFERENCES pblcRechms(id) ON DELETE CASCADE
);

CREATE TABLE invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  allowed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
