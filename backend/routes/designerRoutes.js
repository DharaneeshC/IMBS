const express = require('express');
const router = express.Router();
const { activityLogger } = require('../middleware/activityLogger');
const {
    getAllDesigners,
    getDesignerById,
    createDesigner,
    updateDesigner,
    deleteDesigner
} = require('../controllers/designerController');

router.route('/')
    .get(getAllDesigners)
    .post(
        activityLogger('CREATE', 'designer', (req) => `Created designer: ${req.body.name}`),
        createDesigner
    );

router.route('/:id')
    .get(getDesignerById)
    .put(
        activityLogger('UPDATE', 'designer', (req) => `Updated designer: ${req.body.name || 'ID ' + req.params.id}`),
        updateDesigner
    )
    .delete(
        activityLogger('DELETE', 'designer', (req) => `Deleted designer: ID ${req.params.id}`),
        deleteDesigner
    );

module.exports = router;
