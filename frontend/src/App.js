import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { FilterProvider } from './contexts/FilterContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import SlidePanel from './components/SlidePanel';
import Dashboard from './components/Dashboard';
import ComingSoon from './components/ComingSoon';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './components/products/ProductList';
import ProductShow from './components/products/ProductShow';
import ProductNew from './components/products/ProductNew';
import ProductEdit from './components/products/ProductEdit';
import ProductType from './components/products/ProductType';
import DesignerList from './components/designers/DesignerList';
import DesignerShow from './components/designers/DesignerShow';
import DesignerNew from './components/designers/DesignerNew';
import DesignerEdit from './components/designers/DesignerEdit';
import CustomerList from './components/customers/CustomerList';
import CustomerNew from './components/customers/CustomerNew';
import CustomerShow from './components/customers/CustomerShow';
import SaleList from './components/sales/SaleList';
import SaleNew from './components/sales/SaleNew';
import SaleShow from './components/sales/SaleShow';
import PurchaseOrderList from './components/purchaseOrders/PurchaseOrderList';
import PurchaseOrderShow from './components/purchaseOrders/PurchaseOrderShow';
import PurchaseOrderNew from './components/purchaseOrders/PurchaseOrderNew';
import StockLevels from './components/inventory/StockLevels';
import LowStockAlerts from './components/inventory/LowStockAlerts';
import RepairOrderList from './components/services/RepairOrderList';
import RepairOrderNew from './components/services/RepairOrderNew';
import RepairOrderEdit from './components/services/RepairOrderEdit';
import StockNotifications from './components/StockNotifications';
import ConnectionStatus from './components/ConnectionStatus';
import Reports from './components/Reports';
import SystemAlerts from './components/SystemAlerts';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [slidePanel, setSlidePanel] = useState({ isOpen: false, type: '', title: '' });

  const openSlidePanel = (type, title) => {
    setSlidePanel({ isOpen: true, type, title });
  };

  const closeSlidePanel = () => {
    setSlidePanel({ isOpen: false, type: '', title: '' });
  };

  return (
    <DarkModeProvider>
      <SettingsProvider>
        <ActivityProvider>
          <FilterProvider>
            <SocketProvider>
              <AuthProvider>
                <Router
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected Routes */}
                    <Route path="/*" element={
                      <ProtectedRoute>
                        <div className="App flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
                          {/* Real-time Stock Notifications */}
                          <StockNotifications />
                          
                          {/* Connection Status Indicator */}
                          <ConnectionStatus />
                          
                          {/* Sidebar */}
                          <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
                          
                          {/* Main Content */}
                          <div className={`flex-1 flex flex-col ${isSidebarCollapsed ? 'ml-20' : 'ml-56'} overflow-hidden transition-all duration-300`}>
                            {/* Top Bar - Fixed positioning with left offset */}
                            <div className={`fixed top-0 right-0 ${isSidebarCollapsed ? 'left-20' : 'left-56'} transition-all duration-300 z-50`}>
                              <TopBar
                                isSidebarCollapsed={isSidebarCollapsed}
                                onFilterClick={() => openSlidePanel('filter', 'Filters')}
                                onNotificationClick={() => openSlidePanel('notification', 'Notifications')}
                                onSettingsClick={() => openSlidePanel('settings', 'Settings')}
                              />
                            </div>
                            
                            {/* Page Content - Add top padding to account for fixed TopBar */}
                            <main className="flex-1 overflow-y-auto pt-14">
                              <Routes>
                                <Route path="/" element={<Navigate to="/dashboard" />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/alerts" element={<SystemAlerts />} />
                                
                                {/* Product/Items Routes */}
                                <Route path="/products" element={<ProductList />} />
                                <Route path="/products/new" element={<ProductNew />} />
                                <Route path="/products/:id" element={<ProductShow />} />
                                <Route path="/products/:id/edit" element={<ProductEdit />} />
                                <Route path="/products/type/:type" element={<ProductType />} />
                                
                                {/* Inventory Routes */}
                                <Route path="/inventory/stock-levels" element={<StockLevels />} />
                                <Route path="/inventory/low-stock" element={<LowStockAlerts />} />
                                <Route path="/inventory/adjustments" element={<ComingSoon title="Inventory Adjustments" description="Track and manage inventory adjustments" />} />
                                <Route path="/inventory/adjustments/new" element={<ComingSoon title="New Adjustment" description="Create a new inventory adjustment" />} />
                                <Route path="/inventory/overview" element={<ComingSoon title="Stock Overview" description="View complete stock status across all locations" />} />
                                <Route path="/inventory/packages" element={<ComingSoon title="Packages" description="Manage product packages and bundles" />} />
                                <Route path="/inventory/shipments" element={<ComingSoon title="Shipments" description="Track shipment status and delivery" />} />
                                
                                {/* Customer Routes */}
                                <Route path="/customers" element={<CustomerList />} />
                                <Route path="/customers/new" element={<CustomerNew />} />
                                <Route path="/customers/:id" element={<CustomerShow />} />
                                <Route path="/customers/:id/edit" element={<CustomerNew />} />
                                
                                {/* Sales Routes */}
                                <Route path="/sales/invoices" element={<SaleList />} />
                                <Route path="/sales/invoices/new" element={<SaleNew />} />
                                <Route path="/sales/invoices/:id" element={<SaleShow />} />
                                <Route path="/designers" element={<DesignerList />} />
                                <Route path="/designers/new" element={<DesignerNew />} />
                                <Route path="/designers/:id" element={<DesignerShow />} />
                                <Route path="/designers/:id/edit" element={<DesignerEdit />} />
                                <Route path="/sales/orders" element={<ComingSoon title="Sales Orders" description="Manage customer sales orders" />} />
                                <Route path="/sales/orders/new" element={<ComingSoon title="Create Sales Order" description="Create a new sales order" />} />
                                <Route path="/sales/payments" element={<ComingSoon title="Payments Received" description="Track customer payments" />} />
                                <Route path="/sales/returns" element={<ComingSoon title="Sales Returns" description="Process customer returns and refunds" />} />
                                
                                {/* Purchases Routes */}
                                <Route path="/purchase-orders" element={<PurchaseOrderList />} />
                                <Route path="/purchase-orders/new" element={<PurchaseOrderNew />} />
                                <Route path="/purchase-orders/:id" element={<PurchaseOrderShow />} />
                                <Route path="/purchases/bills" element={<ComingSoon title="Bills" description="Manage vendor bills and payments" />} />
                                
                                {/* Services Routes - Phase 2 */}
                                <Route path="/services/repair-orders" element={<RepairOrderList />} />
                                <Route path="/services/repair-orders/new" element={<RepairOrderNew />} />
                                <Route path="/services/repair-orders/:id/edit" element={<RepairOrderEdit />} />
                                
                                {/* Reports & Documents */}
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/documents" element={<ComingSoon title="Documents" description="Store and manage business documents" />} />
                                
                                {/* Settings & Help */}
                                <Route path="/settings" element={<ComingSoon title="Settings" description="System configuration options coming soon" />} />
                                <Route path="/help" element={<ComingSoon title="Help Center" description="Documentation and support coming soon" />} />
                                <Route path="/shipment" element={<ComingSoon title="Shipment Management" description="Track and manage shipments coming soon" />} />
                                <Route path="/store" element={<ComingSoon title="Store Management" description="Manage store locations and inventory coming soon" />} />
                                <Route path="/privacy" element={<ComingSoon title="Privacy Settings" description="Privacy and security settings coming soon" />} />
                              </Routes>
                            </main>
                          </div>

                          {/* Slide Panel */}
                          <SlidePanel
                            isOpen={slidePanel.isOpen}
                            onClose={closeSlidePanel}
                            type={slidePanel.type}
                            title={slidePanel.title}
                          />
                        </div>
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Router>
              </AuthProvider>
            </SocketProvider>
          </FilterProvider>
        </ActivityProvider>
      </SettingsProvider>
    </DarkModeProvider>
  );
}

export default App;
