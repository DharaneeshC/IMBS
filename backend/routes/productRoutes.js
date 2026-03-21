const express = require('express');
const router = express.Router();
const { activityLogger } = require('../middleware/activityLogger');
const {
    getAllProducts,
    getProductById,
    getProductsByType,
    getProductsByDesigner,
    getProductTypes,
    createProduct,
    updateProduct,
    deleteProduct,
    generateSKUSuggestion,
    getProductBySKU
} = require('../controllers/productController');

// Special routes first
router.post('/generate-sku', generateSKUSuggestion);
router.get('/sku/:sku', getProductBySKU);
router.get('/types/all', getProductTypes);
router.get('/type/:type', getProductsByType);
router.get('/designer/:designerId', getProductsByDesigner);

// Standard CRUD routes with activity logging
router.route('/')
    .get(getAllProducts)
    .post(
        activityLogger('CREATE', 'product', (req) => `Created product: ${req.body.name}`),
        createProduct
    );

router.route('/:id')
    .get(getProductById)
    .put(
        activityLogger('UPDATE', 'product', (req) => `Updated product: ${req.body.name || 'ID ' + req.params.id}`),
        updateProduct
    )
    .delete(
        activityLogger('DELETE', 'product', (req) => `Deleted product: ID ${req.params.id}`),
        deleteProduct
    );

module.exports = router;
