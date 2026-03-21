-- =====================================================
-- SHANMUGA JEWELLERS - DATABASE SCHEMA
-- Inventory & Billing Management System
-- =====================================================

-- Drop tables if exist (for clean setup)
DROP TABLE IF EXISTS product_scans;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS metal_rates;

-- =====================================================
-- TABLE 1: SALES
-- =====================================================
CREATE TABLE sales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_sku VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1,
  weight_grams DECIMAL(10,2),
  metal_type ENUM('24K Gold', '22K Gold', '18K Gold', 'Silver', 'Platinum'),
  amount DECIMAL(12,2) NOT NULL,
  profit DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_date DATETIME NOT NULL,
  status ENUM('Packed', 'Shipped', 'Delivered', 'Pending') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sale_date (sale_date),
  KEY idx_status (status),
  KEY idx_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 2: PURCHASES
-- =====================================================
CREATE TABLE purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(100) NOT NULL,
  total_items INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  purchase_date DATE NOT NULL,
  status ENUM('Received', 'Pending', 'In Progress') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_purchase_date (purchase_date),
  KEY idx_status (status),
  KEY idx_receipt_number (receipt_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 3: INVENTORY
-- =====================================================
CREATE TABLE inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50),
  metal_type VARCHAR(50),
  current_stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 5,
  last_sold_date DATE,
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  weight_grams DECIMAL(10,2),
  front_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_sku (sku),
  KEY idx_current_stock (current_stock),
  KEY idx_last_sold_date (last_sold_date),
  KEY idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 4: PRODUCT SCANS (Activity Tracking)
-- =====================================================
CREATE TABLE product_scans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_name VARCHAR(100) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  scanned_by VARCHAR(50) NOT NULL,
  scan_timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_scan_timestamp (scan_timestamp),
  KEY idx_sku (sku),
  KEY idx_scanned_by (scanned_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 5: METAL RATES (for Top Bar)
-- =====================================================
CREATE TABLE metal_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metal_type ENUM('24K Gold', '22K Gold', '18K Gold', 'Silver', 'Platinum') NOT NULL,
  rate_per_gram DECIMAL(10,2) NOT NULL,
  trend ENUM('up', 'down', 'stable') DEFAULT 'stable',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_metal_type (metal_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Sales table indexes
CREATE INDEX idx_sales_month ON sales(YEAR(sale_date), MONTH(sale_date));
CREATE INDEX idx_sales_week ON sales(YEARWEEK(sale_date));

-- Inventory table indexes
CREATE INDEX idx_inventory_low_stock ON inventory(current_stock, reorder_level);
CREATE INDEX idx_inventory_dead_stock ON inventory(last_sold_date);

-- Purchases table indexes
CREATE INDEX idx_purchases_month ON purchases(YEAR(purchase_date), MONTH(purchase_date));

-- =====================================================
-- VIEWS FOR DASHBOARD QUERIES
-- =====================================================

-- View: Dead Stock Items (90+ days unsold)
CREATE OR REPLACE VIEW view_dead_stock AS
SELECT
  id,
  product_name,
  sku,
  category,
  current_stock,
  last_sold_date,
  DATEDIFF(CURDATE(), last_sold_date) AS days_unsold,
  selling_price
FROM inventory
WHERE DATEDIFF(CURDATE(), last_sold_date) >= 90
  AND current_stock > 0
ORDER BY days_unsold DESC;

-- View: Low Stock Items
CREATE OR REPLACE VIEW view_low_stock AS
SELECT
  id,
  product_name,
  sku,
  category,
  current_stock,
  reorder_level,
  (reorder_level - current_stock) AS shortage,
  last_sold_date
FROM inventory
WHERE current_stock < reorder_level
  AND current_stock > 0
ORDER BY shortage DESC;

-- View: Out of Stock Items
CREATE OR REPLACE VIEW view_out_of_stock AS
SELECT
  id,
  product_name,
  sku,
  category,
  reorder_level,
  last_sold_date
FROM inventory
WHERE current_stock = 0
ORDER BY last_sold_date DESC;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
