-- ========================================
-- Phase 2 Database Migration Script
-- Adds jewellery-specific fields & repair orders table
-- Run this script against your MySQL database
-- ========================================

-- ========================================
-- PART 1: Enhance Products Table with Jewellery Fields
-- ========================================

-- Add SKU field (unique identifier)
ALTER TABLE products 
ADD COLUMN sku VARCHAR(100) NULL AFTER name,
ADD UNIQUE INDEX idx_products_sku (sku);

-- Add metal-related fields
ALTER TABLE products
ADD COLUMN metalType VARCHAR(50) NULL COMMENT 'Gold, Silver, Platinum, etc.' AFTER sku,
ADD COLUMN metalPurity VARCHAR(50) NULL COMMENT '24K, 22K, 18K, 14K, 916, 750, etc.' AFTER metalType;

-- Add weight fields (in grams, 3 decimal precision)
ALTER TABLE products
ADD COLUMN grossWeight DECIMAL(10,3) NULL COMMENT 'Total weight in grams' AFTER metalPurity,
ADD COLUMN netWeight DECIMAL(10,3) NULL COMMENT 'Net metal weight in grams' AFTER grossWeight,
ADD COLUMN stoneWeight DECIMAL(10,3) NULL COMMENT 'Total stone weight in grams' AFTER netWeight;

-- Add gemstone-related fields
ALTER TABLE products
ADD COLUMN gemstoneType VARCHAR(100) NULL COMMENT 'Diamond, Ruby, Emerald, Sapphire, etc.' AFTER stoneWeight,
ADD COLUMN gemstoneCount INT NULL COMMENT 'Number of gemstones' AFTER gemstoneType,
ADD COLUMN gemstoneCarat DECIMAL(10,3) NULL COMMENT 'Total carat weight of gemstones' AFTER gemstoneCount;

-- Add size field for rings/bangles
ALTER TABLE products
ADD COLUMN size VARCHAR(50) NULL COMMENT 'Ring size, bangle size, etc.' AFTER gemstoneCarat;

-- ========================================
-- PART 2: Create Repair Orders Table
-- ========================================

CREATE TABLE IF NOT EXISTS repair_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Order Identification
  orderNumber VARCHAR(50) NOT NULL UNIQUE,
  
  -- Customer Information
  customerName VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(20) NOT NULL,
  customerEmail VARCHAR(255) NULL,
  
  -- Product Information
  productName VARCHAR(255) NOT NULL,
  productSKU VARCHAR(100) NULL,
  
  -- Issue & Service Details
  issueDescription TEXT NOT NULL,
  repairNotes TEXT NULL,
  assignedTo VARCHAR(255) NULL COMMENT 'Staff member assigned',
  
  -- Dates
  receivedDate DATE NOT NULL,
  expectedDeliveryDate DATE NOT NULL,
  actualDeliveryDate DATE NULL,
  
  -- Status Tracking
  status ENUM('Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
  
  -- Financial Details (stored in currency decimal)
  repairCharges DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  advancePayment DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  balanceAmount DECIMAL(10,2) GENERATED ALWAYS AS (repairCharges - advancePayment) STORED,
  
  -- Timestamps
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_repair_orders_orderNumber (orderNumber),
  INDEX idx_repair_orders_status (status),
  INDEX idx_repair_orders_customerPhone (customerPhone),
  INDEX idx_repair_orders_productSKU (productSKU),
  INDEX idx_repair_orders_receivedDate (receivedDate),
  INDEX idx_repair_orders_expectedDeliveryDate (expectedDeliveryDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PART 3: Backfill SKUs for Existing Products (Optional)
-- ========================================

-- This section generates SKUs for existing products that don't have one
-- Format: {TYPE}-{PURITY}-{SEQUENCE}
-- Note: This is a simplified backfill. For production, use the Node.js generator.

-- Update this section based on your product types
-- Example: Assign generic SKUs to existing products
UPDATE products 
SET sku = CONCAT('GEN-', LPAD(id, 4, '0'))
WHERE sku IS NULL;

-- ========================================
-- PART 4: Create Views for Analytics (Optional)
-- ========================================

-- View: Products with Profit Margins
CREATE OR REPLACE VIEW vw_product_profit_analysis AS
SELECT 
  p.id,
  p.sku,
  p.name,
  p.type,
  p.quantity,
  p.cost,
  p.price,
  (p.price - p.cost) AS profit,
  CASE 
    WHEN p.price > 0 THEN ROUND(((p.price - p.cost) / p.price) * 100, 2)
    ELSE 0 
  END AS profitMarginPercentage,
  p.metalType,
  p.metalPurity,
  p.grossWeight,
  p.netWeight
FROM products p;

-- View: Repair Orders Summary
CREATE OR REPLACE VIEW vw_repair_orders_summary AS
SELECT 
  DATE_FORMAT(receivedDate, '%Y-%m') AS month,
  status,
  COUNT(*) AS orderCount,
  SUM(repairCharges) AS totalRevenue,
  SUM(advancePayment) AS totalAdvanceCollected,
  SUM(balanceAmount) AS totalBalancePending
FROM repair_orders
GROUP BY month, status
ORDER BY month DESC, status;

-- ========================================
-- PART 5: Data Validation & Constraints
-- ========================================

-- Ensure cost and price are non-negative
ALTER TABLE products
ADD CONSTRAINT chk_products_cost_nonnegative CHECK (cost >= 0),
ADD CONSTRAINT chk_products_price_nonnegative CHECK (price >= 0);

-- Ensure repair charges are non-negative
ALTER TABLE repair_orders
ADD CONSTRAINT chk_repair_charges_nonnegative CHECK (repairCharges >= 0),
ADD CONSTRAINT chk_advance_payment_nonnegative CHECK (advancePayment >= 0);

-- ========================================
-- Migration Complete!
-- ========================================
-- 
-- Summary of Changes:
-- 1. Added 11 jewellery-specific fields to products table
-- 2. Created repair_orders table with complete schema
-- 3. Added indexes for performance optimization
-- 4. Created analytical views for business intelligence
-- 5. Added data validation constraints
-- 
-- Next Steps:
-- 1. Run this script in MySQL: mysql -u username -p database_name < 001-phase2-schema-updates.sql
-- 2. Verify tables with: SHOW COLUMNS FROM products; SHOW COLUMNS FROM repair_orders;
-- 3. Test with sample data
-- 4. Restart Node.js backend to sync Sequelize models
-- ========================================
