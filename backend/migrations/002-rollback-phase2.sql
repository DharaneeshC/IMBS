-- ========================================
-- Phase 2 Database Migration Rollback Script
-- Use this to revert Phase 2 changes if needed
-- WARNING: This will drop repair_orders table and remove jewellery fields
-- ========================================

-- ========================================
-- PART 1: Drop Views
-- ========================================

DROP VIEW IF EXISTS vw_repair_orders_summary;
DROP VIEW IF EXISTS vw_product_profit_analysis;

-- ========================================
-- PART 2: Drop Repair Orders Table
-- ========================================

DROP TABLE IF EXISTS repair_orders;

-- ========================================
-- PART 3: Remove Jewellery Fields from Products Table
-- ========================================

-- Drop constraints first
ALTER TABLE products
DROP CONSTRAINT IF EXISTS chk_products_cost_nonnegative,
DROP CONSTRAINT IF EXISTS chk_products_price_nonnegative;

-- Remove jewellery-specific columns
ALTER TABLE products
DROP COLUMN IF EXISTS size,
DROP COLUMN IF EXISTS gemstoneCarat,
DROP COLUMN IF EXISTS gemstoneCount,
DROP COLUMN IF EXISTS gemstoneType,
DROP COLUMN IF EXISTS stoneWeight,
DROP COLUMN IF EXISTS netWeight,
DROP COLUMN IF EXISTS grossWeight,
DROP COLUMN IF EXISTS metalPurity,
DROP COLUMN IF EXISTS metalType,
DROP INDEX IF EXISTS idx_products_sku,
DROP COLUMN IF EXISTS sku;

-- ========================================
-- Rollback Complete!
-- ========================================
-- 
-- All Phase 2 database changes have been reverted.
-- Your database is now back to pre-Phase 2 state.
-- ========================================
