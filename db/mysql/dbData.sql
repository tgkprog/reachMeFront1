-- Test data for development/testing
-- This script populates the database with sample data
USE rntPy1;

-- Clear existing test data (optional - comment out if you want to preserve data)
-- DELETE FROM Subscription;
-- DELETE FROM Expense;
-- DELETE FROM RentPayment;
-- DELETE FROM Tenant;
-- DELETE FROM Unit;
-- DELETE FROM Property;
-- DELETE FROM User;
-- DELETE FROM Person;

-- Insert test persons
INSERT INTO Person (firstName, lastName, middleName, email1, phone1, phone1HasWhatsApp) VALUES
  ('Tushar', 'Kapila', NULL, 'tgkprog@gmail.com', '+1234567890', TRUE),
  ('Tushar', 'K', NULL, 'tushar.kapila@gmail.com', '+0987654321', FALSE),
  ('John', 'Tenant', 'Michael', 'john.tenant@example.com', '+1122334455', TRUE),
  ('Jane', 'Renter', NULL, 'jane.renter@example.com', '+5544332211', FALSE)
ON DUPLICATE KEY UPDATE firstName=VALUES(firstName);

-- Get person IDs (assuming they were just inserted or already exist)
SET @person1 = (SELECT id FROM Person WHERE email1 = 'tgkprog@gmail.com' LIMIT 1);
SET @person2 = (SELECT id FROM Person WHERE email1 = 'tushar.kapila@gmail.com' LIMIT 1);
SET @person3 = (SELECT id FROM Person WHERE email1 = 'john.tenant@example.com' LIMIT 1);
SET @person4 = (SELECT id FROM Person WHERE email1 = 'jane.renter@example.com' LIMIT 1);

-- Insert test users (landlords and tenants)
INSERT INTO User (personId, mainEmail, googleEmail, googleAuthEnabled, passwordHash, isActive, role, roles2, lastLogin) VALUES
  (@person1, 'tgkprog@gmail.com', 'tgkprog@gmail.com', TRUE, NULL, TRUE, 'landlord', NULL, NOW()),
  (@person2, 'tushar.kapila@gmail.com', 'tushar.kapila@gmail.com', TRUE, NULL, TRUE, 'landlord', JSON_ARRAY('admin'), NOW()),
  (@person3, 'john.tenant@example.com', NULL, FALSE, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jtRBgKT0s3wC', TRUE, 'tenant', NULL, NULL),
  (@person4, 'jane.renter@example.com', NULL, FALSE, '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jtRBgKT0s3wC', TRUE, 'tenant', NULL, NULL)
ON DUPLICATE KEY UPDATE mainEmail=VALUES(mainEmail), googleAuthEnabled=VALUES(googleAuthEnabled), isActive=VALUES(isActive);

-- Insert test properties
INSERT INTO Property (userId, name, type, address) VALUES
  (@person1, 'Sunset Apartments', 'Multi-Family', '123 Main St, City, State 12345'),
  (@person1, 'Downtown Plaza', 'Commercial', '456 Oak Ave, City, State 12345'),
  (@person2, 'Lakeside Condos', 'Condo', '789 Lake Rd, City, State 12345')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Get property IDs
SET @property1 = (SELECT id FROM Property WHERE name = 'Sunset Apartments' LIMIT 1);
SET @property2 = (SELECT id FROM Property WHERE name = 'Downtown Plaza' LIMIT 1);
SET @property3 = (SELECT id FROM Property WHERE name = 'Lakeside Condos' LIMIT 1);

-- Insert test units
INSERT INTO Unit (propertyId, label, type, address, monthlyRent) VALUES
  (@property1, 'Unit 101', 'Studio', '123 Main St #101', 1200.00),
  (@property1, 'Unit 102', '1BR', '123 Main St #102', 1500.00),
  (@property1, 'Unit 201', '2BR', '123 Main St #201', 1800.00),
  (@property2, 'Suite A', 'Office', '456 Oak Ave Suite A', 2500.00),
  (@property3, 'Condo 5B', '2BR', '789 Lake Rd #5B', 2000.00)
ON DUPLICATE KEY UPDATE label=VALUES(label);

-- Get unit IDs
SET @unit1 = (SELECT id FROM Unit WHERE label = 'Unit 101' AND propertyId = @property1 LIMIT 1);
SET @unit2 = (SELECT id FROM Unit WHERE label = 'Unit 102' AND propertyId = @property1 LIMIT 1);
SET @unit3 = (SELECT id FROM Unit WHERE label = 'Unit 201' AND propertyId = @property1 LIMIT 1);
SET @unit4 = (SELECT id FROM Unit WHERE label = 'Suite A' AND propertyId = @property2 LIMIT 1);
SET @unit5 = (SELECT id FROM Unit WHERE label = 'Condo 5B' AND propertyId = @property3 LIMIT 1);

-- Insert test tenants
INSERT INTO Tenant (personId, unitId, rentStartDate, rentEndDate, isActive) VALUES
  (@person3, @unit1, '2025-01-01', '2025-12-31', TRUE),
  (@person4, @unit2, '2025-02-01', '2026-01-31', TRUE)
ON DUPLICATE KEY UPDATE isActive=VALUES(isActive);

-- Get tenant IDs
SET @tenant1 = (SELECT id FROM Tenant WHERE personId = @person3 AND unitId = @unit1 LIMIT 1);
SET @tenant2 = (SELECT id FROM Tenant WHERE personId = @person4 AND unitId = @unit2 LIMIT 1);

-- Insert test rent payments
INSERT INTO RentPayment (tenantId, unitId, amount, periodStart, periodEnd, paymentDate, paymentMethod, status) VALUES
  (@tenant1, @unit1, 1200.00, '2025-01-01', '2025-01-31', '2025-01-05', 'Bank Transfer', 'paid'),
  (@tenant1, @unit1, 1200.00, '2025-02-01', '2025-02-28', '2025-02-03', 'Check', 'paid'),
  (@tenant1, @unit1, 1200.00, '2025-03-01', '2025-03-31', NULL, NULL, 'pending'),
  (@tenant2, @unit2, 1500.00, '2025-02-01', '2025-02-28', '2025-02-01', 'Cash', 'paid'),
  (@tenant2, @unit2, 1500.00, '2025-03-01', '2025-03-31', NULL, NULL, 'pending')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Insert test expenses
INSERT INTO Expense (userId, propertyId, description, amount, expenseDate, category) VALUES
  (@person1, @property1, 'Plumbing repair Unit 101', 350.00, '2025-01-15', 'Maintenance'),
  (@person1, @property1, 'Property insurance', 1200.00, '2025-01-01', 'Insurance'),
  (@person1, @property2, 'HVAC maintenance', 500.00, '2025-02-10', 'Maintenance'),
  (@person2, @property3, 'HOA fees', 250.00, '2025-01-01', 'Fees')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Insert test subscriptions
INSERT INTO Subscription (userId, planType, price, startDate, endDate, status) VALUES
  (@person1, 'MONTHLY', 29.99, '2025-01-01', '2025-12-31', 'active'),
  (@person2, 'TEN_DAYS', 9.99, '2025-01-01', '2025-01-10', 'expired')
ON DUPLICATE KEY UPDATE status=VALUES(status);

SELECT 'Test data inserted successfully' AS Result;
