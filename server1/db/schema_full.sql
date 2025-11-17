-- Drop all tables
DROP TABLE IF EXISTS reach_me_messages;
DROP TABLE IF EXISTS pblcRechms;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Primary email / User ID for login',
  password_hash VARCHAR(255) NULL COMMENT 'Encrypted password (AES-256)',
  pwdLogin BOOLEAN DEFAULT FALSE COMMENT 'Can login with email/password',
  googleOauth BOOLEAN DEFAULT FALSE COMMENT 'Can login with Google OAuth',
  USER_GOOGLE_EMAIL VARCHAR(255) NULL UNIQUE COMMENT 'Google OAuth email (can differ from primary email)',
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  account_status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
  balance_tokens INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_USER_GOOGLE_EMAIL (USER_GOOGLE_EMAIL),
  INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Public ReachMe URLs table
CREATE TABLE pblcRechms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  url_code VARCHAR(10) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  deactivate_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_url_code (url_code),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_deactivate_at (deactivate_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ReachMe messages/alarms table
CREATE TABLE reach_me_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  public_reachme_id INT NOT NULL,
  message TEXT NOT NULL,
  datetime_alarm TIMESTAMP NOT NULL,
  is_ack_app BOOLEAN DEFAULT FALSE,
  is_ack_all BOOLEAN DEFAULT FALSE,
  sender_info JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (public_reachme_id) REFERENCES pblcRechms(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_public_reachme_id (public_reachme_id),
  INDEX idx_datetime_alarm (datetime_alarm),
  INDEX idx_is_ack_app (is_ack_app),
  INDEX idx_is_ack_all (is_ack_all)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invites table
CREATE TABLE invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
  allowed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_invite_code (invite_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
