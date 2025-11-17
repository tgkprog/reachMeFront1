-- Idempotent setup for local MariaDB/MySQL
-- Creates user g8 with full privileges and ensures database rntPy1 exists.
CREATE USER IF NOT EXISTS 'g8'@'%' IDENTIFIED BY 'hk49-Sk94K23m';
GRANT ALL PRIVILEGES ON *.* TO 'g8'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS rntPy1;
USE rntPy1;
