-- =====================================================
-- SHANMUGA JEWELLERS - SEED DATA
-- Mock data for testing and development
-- =====================================================

-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_scans;
TRUNCATE TABLE inventory;
TRUNCATE TABLE purchases;
TRUNCATE TABLE sales;
TRUNCATE TABLE metal_rates;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- METAL RATES DATA
-- =====================================================
INSERT INTO metal_rates (metal_type, rate_per_gram, trend) VALUES
('24K Gold', 7150.00, 'up'),
('22K Gold', 6554.00, 'up'),
('18K Gold', 5362.00, 'up'),
('Silver', 89.00, 'up'),
('Platinum', 3200.00, 'stable');

-- =====================================================
-- SALES DATA (15 records - Last 4 weeks)
-- =====================================================
INSERT INTO sales (invoice_number, customer_name, item_name, item_sku, quantity, weight_grams, metal_type, amount, profit, sale_date, status) VALUES
-- Week 4 (3 weeks ago) - 2026-02-24 to 2026-03-02
('INV-2026-001', 'Ramesh Kumar', 'Gold Chain Necklace', 'GC-001', 1, 45.5, '22K Gold', 285000, 35000, '2026-02-24 10:30:00', 'Delivered'),
('INV-2026-002', 'Priya Sharma', 'Diamond Ring', 'DR-045', 1, 8.2, '18K Gold', 125000, 18000, '2026-02-25 14:20:00', 'Delivered'),
('INV-2026-003', 'Vijay Anand', 'Pearl Earrings', 'PE-023', 2, 15.0, 'Silver', 24000, 3500, '2026-02-26 11:45:00', 'Delivered'),
('INV-2026-004', 'Lakshmi Menon', 'Gold Bangles Set', 'GB-067', 4, 125.0, '22K Gold', 820000, 95000, '2026-02-27 16:10:00', 'Delivered'),

-- Week 3 (2 weeks ago) - 2026-03-03 to 2026-03-09
('INV-2026-005', 'Suresh Babu', 'Platinum Band Ring', 'PR-008', 1, 12.5, 'Platinum', 58000, 8500, '2026-03-03 09:15:00', 'Delivered'),
('INV-2026-006', 'Divya Reddy', 'Tennis Bracelet', 'TB-015', 1, 28.3, '18K Gold', 185000, 22000, '2026-03-04 13:50:00', 'Delivered'),
('INV-2026-007', 'Arjun Patel', 'Kundan Choker Set', 'KC-042', 1, 95.0, '22K Gold', 465000, 58000, '2026-03-05 15:25:00', 'Delivered'),
('INV-2026-008', 'Meera Iyer', 'Silver Bracelet', 'SB-205', 2, 45.0, 'Silver', 17000, 2200, '2026-03-06 10:40:00', 'Shipped'),
('INV-2026-009', 'Karthik Nair', 'Diamond Pendant', 'DP-308', 1, 15.5, '18K Gold', 289000, 35000, '2026-03-07 12:20:00', 'Delivered'),

-- Week 2 (1 week ago) - 2026-03-10 to 2026-03-16
('INV-2026-010', 'Radhika Krishnan', 'Gold Ring 22K', 'GR-101', 1, 12.0, '22K Gold', 95000, 12000, '2026-03-10 11:00:00', 'Delivered'),
('INV-2026-011', 'Prakash Varma', 'Emerald Pendant', 'GEN-0006', 1, 18.5, '18K Gold', 325000, 42000, '2026-03-11 14:30:00', 'Shipped'),
('INV-2026-012', 'Anjali Das', 'Gold Chain Necklace', 'GC-001', 1, 48.0, '22K Gold', 295000, 38000, '2026-03-13 10:15:00', 'Packed'),
('INV-2026-013', 'Naveen Reddy', 'Diamond Solitaire Ring', 'GEN-0001', 1, 6.5, '18K Gold', 425000, 55000, '2026-03-14 16:45:00', 'Delivered'),
('INV-2026-014', 'Shalini Rao', 'Pearl Necklace Set', 'PN-112', 1, 65.0, '22K Gold', 385000, 48000, '2026-03-15 13:20:00', 'Shipped'),

-- Week 1 (This week) - 2026-03-17 onwards
('INV-2026-015', 'Ganesh Murti', 'Gold Bangles Set', 'GB-067', 2, 85.0, '22K Gold', 525000, 65000, '2026-03-17 09:30:00', 'Pending');

-- =====================================================
-- PURCHASES DATA (10 records)
-- =====================================================
INSERT INTO purchases (receipt_number, supplier_name, total_items, total_amount, purchase_date, status, notes) VALUES
('RCV-2026-001', 'ABC Gold Suppliers', 12, 850000, '2026-03-15', 'Received', 'Premium 22K gold jewelry collection'),
('RCV-2026-002', 'XYZ Silver Traders', 8, 185000, '2026-03-14', 'Received', 'Sterling silver bracelets and chains'),
('RCV-2026-003', 'Diamond Wholesale Co', 5, 320000, '2026-03-16', 'Pending', 'Certified diamond pendants'),
('RCV-2026-004', 'Platinum Paradise Ltd', 6, 285000, '2026-03-12', 'Received', 'Platinum rings and bands'),
('RCV-2026-005', 'Gem Stone Imports', 10, 425000, '2026-03-10', 'Received', 'Ruby and emerald jewelry'),
('RCV-2026-006', 'Golden Era Jewels', 15, 650000, '2026-03-08', 'Received', 'Traditional gold jewelry'),
('RCV-2026-007', 'Pearl Paradise', 12, 195000, '2026-03-05', 'In Progress', 'Fresh water pearl sets'),
('RCV-2026-008', 'Royal Gems Trading', 8, 380000, '2026-03-03', 'Received', 'Antique design collection'),
('RCV-2026-009', 'Silver City Exports', 20, 285000, '2026-02-28', 'Received', 'Silver earrings and anklets'),
('RCV-2026-010', 'Kundan Craft House', 7, 525000, '2026-02-25', 'Received', 'Traditional kundan jewelry');

-- =====================================================
-- INVENTORY DATA (15 records)
-- =====================================================
INSERT INTO inventory (product_name, sku, category, metal_type, current_stock, reorder_level, last_sold_date, cost_price, selling_price, weight_grams, front_image) VALUES
-- Dead Stock Items (90+ days unsold)
('Gold Chain Necklace', 'GC-001', 'Necklaces', '22K Gold', 8, 5, '2023-12-17', 60000, 75000, 45.5, '/goldchainnecklace.jpg'),
('Pearl Earrings', 'PE-023', 'Earrings', 'Silver', 15, 10, '2023-12-17', 8000, 12000, 15.0, null),
('Platinum Band Ring', 'PR-008', 'Rings', 'Platinum', 6, 5, '2023-12-17', 45000, 58000, 12.5, null),
('Tennis Bracelet', 'TB-015', 'Bracelets', '18K Gold', 4, 5, '2023-12-17', 35000, 48000, 28.3, null),
('Kundan Choker Set', 'KC-042', 'Sets', '22K Gold', 3, 5, '2023-12-17', 125000, 165000, 95.0, '/Kundan.webp'),
('Gold Bangles Set', 'GB-067', 'Bangles', '22K Gold', 10, 8, '2023-12-17', 95000, 125000, 85.0, null),

-- Low Stock Items (below reorder level)
('Gold Ring 22K', 'GR-101', 'Rings', '22K Gold', 2, 5, '2026-03-16', 42000, 55000, 12.0, null),
('Silver Bracelet', 'SB-205', 'Bracelets', 'Silver', 1, 3, '2026-03-15', 5500, 8500, 22.5, null),
('Diamond Pendant', 'DP-308', 'Pendants', '18K Gold', 3, 5, '2026-03-14', 68000, 89000, 15.5, null),

-- Good Stock Items
('Emerald Pendant', 'GEN-0006', 'Pendants', '18K Gold', 12, 5, '2026-03-17', 85000, 115000, 18.5, '/emeraldpendant.webp'),
('Diamond Solitaire Ring', 'GEN-0001', 'Rings', '18K Gold', 18, 5, '2026-03-04', 125000, 175000, 6.5, '/diamondsolitarering.webp'),
('Pearl Necklace Set', 'PN-112', 'Necklaces', '22K Gold', 14, 5, '2026-03-15', 95000, 135000, 65.0, null),
('Ruby Ring Set', 'RR-205', 'Rings', '18K Gold', 22, 8, '2026-03-12', 75000, 105000, 14.2, '/diamondring.webp'),
('Gold Earrings', 'GE-308', 'Earrings', '22K Gold', 16, 8, '2026-03-10', 42000, 58000, 18.5, null),
('Silver Anklet Pair', 'SA-412', 'Anklets', 'Silver', 25, 10, '2026-03-08', 8500, 12500, 45.0, null);

-- =====================================================
-- PRODUCT SCANS DATA (20+ records)
-- =====================================================
INSERT INTO product_scans (product_name, sku, scanned_by, scan_timestamp) VALUES
-- Recent scans (last 2 weeks)
('Emerald Pendant', 'GEN-0006', 'Dharaneesh C', '2026-03-17 15:51:00'),
('Gold Ring 22K', 'GR-101', 'Dharaneesh C', '2026-03-17 14:22:00'),
('Diamond Pendant', 'DP-308', 'Dharaneesh C', '2026-03-17 11:35:00'),
('Silver Bracelet', 'SB-205', 'Dharaneesh C', '2026-03-16 16:10:00'),
('Gold Chain Necklace', 'GC-001', 'Dharaneesh C', '2026-03-16 13:45:00'),
('Pearl Necklace Set', 'PN-112', 'Dharaneesh C', '2026-03-15 10:20:00'),
('Diamond Solitaire Ring', 'GEN-0001', 'Dharaneesh C', '2026-03-15 09:15:00'),
('Gold Bangles Set', 'GB-067', 'Sales Staff', '2026-03-14 17:30:00'),
('Emerald Pendant', 'GEN-0006', 'Sales Staff', '2026-03-14 15:22:00'),
('Ruby Ring Set', 'RR-205', 'Dharaneesh C', '2026-03-13 14:10:00'),
('Gold Earrings', 'GE-308', 'Sales Staff', '2026-03-13 11:25:00'),
('Platinum Band Ring', 'PR-008', 'Dharaneesh C', '2026-03-12 16:40:00'),
('Tennis Bracelet', 'TB-015', 'Sales Staff', '2026-03-12 14:15:00'),
('Kundan Choker Set', 'KC-042', 'Dharaneesh C', '2026-03-11 10:30:00'),
('Silver Anklet Pair', 'SA-412', 'Sales Staff', '2026-03-11 09:05:00'),

-- Older scans (for history)
('Diamond Solitaire Ring', 'GEN-0001', 'Dharaneesh C', '2026-03-04 12:03:00'),
('Pearl Earrings', 'PE-023', 'Sales Staff', '2026-03-03 15:20:00'),
('Gold Chain Necklace', 'GC-001', 'Dharaneesh C', '2026-02-28 11:45:00'),
('Diamond Pendant', 'DP-308', 'Sales Staff', '2026-02-26 14:30:00'),
('Silver Bracelet', 'SB-205', 'Dharaneesh C', '2026-02-25 10:15:00'),
('Gold Ring 22K', 'GR-101', 'Sales Staff', '2026-02-24 16:20:00'),
('Emerald Pendant', 'GEN-0006', 'Dharaneesh C', '2026-02-20 13:50:00');

-- =====================================================
-- DATA VERIFICATION QUERIES
-- =====================================================

-- Verify row counts
-- SELECT 'sales' as table_name, COUNT(*) as row_count FROM sales
-- UNION ALL
-- SELECT 'purchases', COUNT(*) FROM purchases
-- UNION ALL
-- SELECT 'inventory', COUNT(*) FROM inventory
-- UNION ALL
-- SELECT 'product_scans', COUNT(*) FROM product_scans
-- UNION ALL
-- SELECT 'metal_rates', COUNT(*) FROM metal_rates;

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================
