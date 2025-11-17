-- DDL script for creating/updating database schema
-- DROPS AND RECREATES all tables for clean testing
-- TODO: Change back to safe migration (IF NOT EXISTS + ALTER TABLE) before production

CREATE DATABASE IF NOT EXISTS rntPy1;
USE rntPy1;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS Expense;
DROP TABLE IF EXISTS RentPayment;
DROP TABLE IF EXISTS Lease;
DROP TABLE IF EXISTS Unit;
DROP TABLE IF EXISTS Property;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Person;

-- Person table
CREATE TABLE Person (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  middleName VARCHAR(100),
  email1 VARCHAR(150),
  email2 VARCHAR(150),
  phone1 VARCHAR(20),
  phone1HasWhatsApp BOOLEAN DEFAULT FALSE,
  phone2 VARCHAR(20),
  phone2HasWhatsApp BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User table
CREATE TABLE User (
  personId INT PRIMARY KEY,
  mainEmail VARCHAR(150) UNIQUE NOT NULL,
  googleEmail VARCHAR(150),
  googleAuthEnabled BOOLEAN DEFAULT FALSE,
  passwordHash VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  role VARCHAR(50) DEFAULT 'landlord',
  roles2 JSON,
  lastLogin TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (personId) REFERENCES Person(id),
  INDEX idx_mainEmail (mainEmail),
  INDEX idx_googleEmail (googleEmail)
);

-- Add middleName to Person if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'Person';
SET @columnname = 'middleName';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) AFTER lastName')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add mainEmail to User if it doesn't exist
SET @tablename = 'User';
SET @columnname = 'mainEmail';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(150) AFTER personId')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add passwordHash to User if it doesn't exist
SET @columnname = 'passwordHash';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(255) AFTER googleEmail')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Rename isGoogleAuthEnabled to googleAuthEnabled if old column exists
SET @oldColumnname = 'isGoogleAuthEnabled';
SET @newColumnname = 'googleAuthEnabled';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @oldColumnname)) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' CHANGE COLUMN ', @oldColumnname, ' ', @newColumnname, ' BOOLEAN DEFAULT FALSE'),
  'SELECT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Rename googleAuthEmail to googleEmail if old column exists
SET @oldColumnname = 'googleAuthEmail';
SET @newColumnname = 'googleEmail';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @oldColumnname)) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' CHANGE COLUMN ', @oldColumnname, ' ', @newColumnname, ' VARCHAR(150)'),
  'SELECT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Rename userActive to isActive if old column exists
SET @oldColumnname = 'userActive';
SET @newColumnname = 'isActive';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @oldColumnname)) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' CHANGE COLUMN ', @oldColumnname, ' ', @newColumnname, ' BOOLEAN DEFAULT TRUE'),
  'SELECT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add roles2 to User if it doesn't exist
SET @columnname = 'roles2';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON AFTER role')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add lastLogin to User if it doesn't exist
SET @columnname = 'lastLogin';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL AFTER roles2')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add createdAt to User if it doesn't exist
SET @columnname = 'createdAt';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER lastLogin')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add updatedAt to User if it doesn't exist
SET @columnname = 'updatedAt';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename)
   AND (table_schema = @dbname)
   AND (column_name = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Property table
CREATE TABLE IF NOT EXISTS Property (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  name VARCHAR(100),
  type VARCHAR(50),
  address VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(personId)
);

-- Unit table
CREATE TABLE IF NOT EXISTS Unit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  propertyId INT,
  label VARCHAR(100),
  type VARCHAR(50),
  address VARCHAR(255),
  monthlyRent DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (propertyId) REFERENCES Property(id)
);

-- Tenant table
CREATE TABLE IF NOT EXISTS Tenant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  personId INT,
  unitId INT,
  rentStartDate DATE,
  rentEndDate DATE,
  isActive BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (personId) REFERENCES Person(id),
  FOREIGN KEY (unitId) REFERENCES Unit(id)
);

-- RentPayment table
CREATE TABLE IF NOT EXISTS RentPayment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId INT,
  unitId INT,
  amount DECIMAL(10,2),
  periodStart DATE,
  periodEnd DATE,
  paymentDate DATE,
  paymentMethod VARCHAR(50),
  status VARCHAR(50),
  FOREIGN KEY (tenantId) REFERENCES Tenant(id),
  FOREIGN KEY (unitId) REFERENCES Unit(id)
);

-- Expense table
CREATE TABLE IF NOT EXISTS Expense (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  propertyId INT,
  description VARCHAR(255),
  amount DECIMAL(10,2),
  expenseDate DATE,
  category VARCHAR(100),
  FOREIGN KEY (userId) REFERENCES User(personId),
  FOREIGN KEY (propertyId) REFERENCES Property(id)
);

-- Subscription table
CREATE TABLE IF NOT EXISTS Subscription (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  planType ENUM('MONTHLY', 'TEN_DAYS'),
  price DECIMAL(10,2),
  startDate DATE,
  endDate DATE,
  status VARCHAR(50),
  FOREIGN KEY (userId) REFERENCES User(personId)
);
