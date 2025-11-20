-- Local database bootstrap for ReachMe
-- Generated for values from server1/.local.env
-- Safe to run multiple times.

-- Database and user from .local.env:
--   DB_NAME=reachm1
--   DB_USER=g8
--   DB_PWD=hk49-Sk94K23m

-- 1) Create database (UTF8MB4)
CREATE DATABASE IF NOT EXISTS `reachm1`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 2) Create user for localhost and any host
CREATE USER IF NOT EXISTS 'g8'@'localhost' IDENTIFIED BY 'hk49-Sk94K23m';
CREATE USER IF NOT EXISTS 'g8'@'%'         IDENTIFIED BY 'hk49-Sk94K23m';

-- 3) Ensure password (idempotent with ALTER USER)
ALTER USER 'g8'@'localhost' IDENTIFIED BY 'hk49-Sk94K23m';
ALTER USER 'g8'@'%'         IDENTIFIED BY 'hk49-Sk94K23m';

-- 4) Grant privileges on the new database
GRANT ALL PRIVILEGES ON `reachm1`.* TO 'g8'@'localhost';
GRANT ALL PRIVILEGES ON `reachm1`.* TO 'g8'@'%';

FLUSH PRIVILEGES;

-- Optional sanity checks (uncomment to inspect)
-- SHOW DATABASES LIKE 'reachm1';
-- SHOW GRANTS FOR 'g8'@'localhost';
-- SHOW GRANTS FOR 'g8'@'%';
