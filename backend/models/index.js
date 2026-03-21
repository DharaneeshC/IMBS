const { sequelize } = require('../config/db');
const User = require('./User');
const Designer = require('./Designer');
const Product = require('./Product');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Payment = require('./Payment');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const StockMovement = require('./StockMovement');
const InventoryChange = require('./InventoryChange');
const UserActivity = require('./UserActivity');
const RepairOrder = require('./RepairOrder');

// Define relationships

// Designer -> Products (One-to-Many)
Designer.hasMany(Product, {
    foreignKey: 'designerId',
    as: 'products',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

Product.belongsTo(Designer, {
    foreignKey: 'designerId',
    as: 'designer'
});

// Customer -> Sales (One-to-Many)
Customer.hasMany(Sale, {
    foreignKey: 'customerId',
    as: 'sales',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

Sale.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

// Sale -> SaleItems (One-to-Many)
Sale.hasMany(SaleItem, {
    foreignKey: 'saleId',
    as: 'items',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

SaleItem.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

// Product -> SaleItems (One-to-Many)
Product.hasMany(SaleItem, {
    foreignKey: 'productId',
    as: 'saleItems',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

SaleItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// Sale -> Payments (One-to-Many)
Sale.hasMany(Payment, {
    foreignKey: 'saleId',
    as: 'payments',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Payment.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

// Product -> InventoryChanges (One-to-Many)
Product.hasMany(InventoryChange, {
    foreignKey: 'productId',
    as: 'inventoryChanges',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

InventoryChange.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// Designer -> PurchaseOrders (One-to-Many)
Designer.hasMany(PurchaseOrder, {
    foreignKey: 'designerId',
    as: 'purchaseOrders',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

PurchaseOrder.belongsTo(Designer, {
    foreignKey: 'designerId',
    as: 'designer'
});

// PurchaseOrder -> PurchaseOrderItems (One-to-Many)
PurchaseOrder.hasMany(PurchaseOrderItem, {
    foreignKey: 'purchaseOrderId',
    as: 'items',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

PurchaseOrderItem.belongsTo(PurchaseOrder, {
    foreignKey: 'purchaseOrderId',
    as: 'purchaseOrder'
});

// Product -> PurchaseOrderItems (One-to-Many)
Product.hasMany(PurchaseOrderItem, {
    foreignKey: 'productId',
    as: 'purchaseOrderItems',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

PurchaseOrderItem.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// Product -> StockMovements (One-to-Many)
Product.hasMany(StockMovement, {
    foreignKey: 'productId',
    as: 'stockMovements',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

StockMovement.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// Export all models and sequelize instance
module.exports = {
    sequelize,
    User,
    Designer,
    Product,
    Customer,
    Sale,
    SaleItem,
    Payment,
    PurchaseOrder,
    PurchaseOrderItem,
    StockMovement,
    InventoryChange,
    UserActivity,
    RepairOrder
};
