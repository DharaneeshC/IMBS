import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { 
  HiPlus, 
  HiSearch, 
  HiPencil,
  HiTrash,
  HiEye
} from 'react-icons/hi';

const RepairOrderList = () => {
  const navigate = useNavigate();
  const [repairOrders, setRepairOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // New filters: All · Pending · In Progress · Completed · Delivered · Cancelled
  const statusOptions = ['All', 'Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];
  
  const statusColors = {
    'Pending': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Completed': 'bg-green-100 text-green-800',
    'Delivered': 'bg-green-800 text-white',
    'Cancelled': 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchRepairOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [repairOrders, searchTerm, statusFilter]);

  const fetchRepairOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/repair-orders');
      setRepairOrders(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching repair orders:', error);
      setError('Failed to load repair orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...repairOrders];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(search) ||
        order.customerName?.toLowerCase().includes(search) ||
        order.customerPhone?.toLowerCase().includes(search) ||
        order.productName?.toLowerCase().includes(search)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this repair order?')) return;

    try {
      await api.delete(`/repair-orders/${id}`);
      fetchRepairOrders();
    } catch (error) {
      console.error('Error deleting repair order:', error);
      alert('Failed to delete repair order');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A2E] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

    // Filter Button Component
    const FilterPill = ({ label, value, current, onClick }) => (
        <button
            onClick={() => onClick(value)}
            className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors font-medium ${
                current === value
                    ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
        >
            {label}
        </button>
    );

    // Stats calculation
    const totalOrders = repairOrders.length;
    const pendingCount = repairOrders.filter(o => o.status === 'Pending').length;
    const inProgressCount = repairOrders.filter(o => o.status === 'In Progress').length;
    const totalValue = repairOrders.reduce((sum, o) => sum + (parseFloat(o.repairCharges) || 0), 0);

    return (
        <div className="bg-white min-h-screen">
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="px-4 py-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Repair Orders</h1>
                        
                        <div className="flex-1 max-w-2xl mx-auto">
                            <div className="relative">
                                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search repair orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <Link
                            to="/services/repair-orders/new"
                            className="px-4 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                        >
                            <HiPlus /> New Repair Order
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {statusOptions.map(status => (
                            <FilterPill 
                                key={status}
                                label={status} 
                                value={status} 
                                current={statusFilter} 
                                onClick={setStatusFilter} 
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 mt-4 mb-2">
                {!loading && repairOrders.length > 0 && (
                     <div className="flex items-center justify-center mt-6 mb-4 bg-white">
                        <h2 className="text-2xl font-bold text-gray-900 text-center">
                            {totalOrders} orders · {pendingCount} pending · {inProgressCount} in progress · ₹{totalValue.toLocaleString()} total value
                        </h2>
                    </div>
                )}
            </div>

            <div className="px-4 pb-4">
                {filteredOrders.length === 0 ? (
                    <div className="mt-8 text-center text-[13px] text-gray-400">
                        No repair orders yet — create your first order
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Order No</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Product</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Issue</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Received</th>
                                    <th className="px-4 py-2.5 text-left text-sm font-semibold text-gray-900">Delivery</th>
                                    <th className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900">Charges</th>
                                    <th className="px-4 py-2.5 text-center text-sm font-semibold text-gray-900">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.orderNumber}
                                            {order.tokenNumber && <span className="ml-2 text-xs text-gray-400">({order.tokenNumber})</span>}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.customerPhone}</div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                            {order.productName}
                                            {order.metalType && <span className="text-gray-400 text-xs ml-1">· {order.metalType}</span>}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                                            {order.issueDescription}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(order.receivedDate)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(order.expectedDeliveryDate)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                            ₹{parseFloat(order.repairCharges || 0).toLocaleString()}
                                            {parseFloat(order.balanceAmount) > 0 && (
                                                <span className="text-xs text-red-600 block">Bal: ₹{parseFloat(order.balanceAmount).toLocaleString()}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepairOrderList;
