-- ========================================
-- Migration 004: Add Product Images Support
-- Adds frontImage column to inventory table and updates with new local images
-- ========================================

-- Add frontImage column to inventory table
ALTER TABLE inventory
ADD COLUMN frontImage VARCHAR(255) NULL COMMENT 'Local image path or URL for product front view' AFTER weight_grams;

-- ========================================
-- Update products with new local images
-- ========================================

-- Update Diamond Solitaire Ring with new image
UPDATE inventory
SET frontImage = '/diamondsolitarering.webp'
WHERE sku = 'GEN-0001' AND product_name = 'Diamond Solitaire Ring';

-- Update Diamond Ring with new image
UPDATE inventory
SET frontImage = '/diamondring.webp'
WHERE product_name LIKE '%Diamond Ring%' AND sku != 'GEN-0001';

-- Update Emerald Pendant with new image
UPDATE inventory
SET frontImage = '/emeraldpendant.webp'
WHERE sku = 'GEN-0006' AND product_name = 'Emerald Pendant';

-- Update Gold Chain Necklace with new image
UPDATE inventory
SET frontImage = '/goldchainnecklace.jpg'
WHERE sku = 'GC-001' AND product_name = 'Gold Chain Necklace';

-- Update Kundan Choker Set with new image
UPDATE inventory
SET frontImage = '/Kundan.webp'
WHERE sku = 'KC-042' AND product_name = 'Kundan Choker Set';

-- ========================================
-- Add index for frontImage column (optional, for future image queries)
-- ========================================
CREATE INDEX idx_inventory_frontImage ON inventory(frontImage);

-- ========================================
-- Migration Complete!
-- ========================================
--
-- Summary of Changes:
-- 1. Added frontImage column to inventory table
-- 2. Updated existing products with new local image paths
-- 3. Added index for image queries
--
-- Products Updated:
-- - Diamond Solitaire Ring (GEN-0001) -> /diamondsolitarering.webp
-- - Diamond Ring -> /diamondring.webp
-- - Emerald Pendant (GEN-0006) -> /emeraldpendant.webp
-- - Gold Chain Necklace (GC-001) -> /goldchainnecklace.jpg
-- - Kundan Choker Set (KC-042) -> /Kundan.webp
-- ========================================