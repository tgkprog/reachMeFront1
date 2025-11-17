/**
 * Database Schema for ReachMe
 * MariaDB 10.6.19
 */

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  account_status ENUM('active', 'disabled', 'pending', 'expired') DEFAULT 'active',
  balance_tokens INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expired_at TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_google_id (google_id),
  INDEX idx_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Public ReachMe URLs table
CREATE TABLE IF NOT EXISTS pblcRechms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  url_code VARCHAR(10) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  deactivate_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_url_code (url_code),
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active),
  INDEX idx_deactivate (deactivate_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ReachMe messages/alarms table
CREATE TABLE IF NOT EXISTS reach_me_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  public_reachme_id INT NOT NULL,
  message TEXT NOT NULL,
  datetime_alarm TIMESTAMP NOT NULL,
  is_ack_app BOOLEAN DEFAULT FALSE,
  is_ack_all BOOLEAN DEFAULT FALSE,
  sender_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (public_reachme_id) REFERENCES pblcRechms(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_public_reachme (public_reachme_id),
  INDEX idx_datetime_alarm (datetime_alarm),
  INDEX idx_ack_app (is_ack_app),
  INDEX idx_ack_all (is_ack_all)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
  allowed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_code (invite_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
