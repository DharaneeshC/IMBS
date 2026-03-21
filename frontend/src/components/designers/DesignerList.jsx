import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { 
  HiExclamationCircle, 
  HiUserGroup, 
  HiPlus, 
  HiUser, 
  HiMail, 
  HiPhone, 
  HiDocumentText, 
  HiChevronRight,
  HiSearch,
  HiUpload,
  HiDownload,
  HiViewList,
  HiViewGrid,
  HiX,
  HiFilter,
  HiChevronDown,
  HiCheck
} from 'react-icons/hi';

const DesignerList = () => {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, active, inactive, gstin
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  useEffect(() => {
    fetchDesigners();
  }, []);

  // Reset selections when designers change
  useEffect(() => {
    setSelectedItems(new Set());
    setSelectAll(false);
  }, [filterType]);

  const fetchDesigners = async () => {
    try {
      const response = await api.get('/designers');
      setDesigners(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load designers');
      setLoading(false);
    }
  };

  const handleSelectItem = (designerId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(designerId)) {
      newSelected.delete(designerId);
    } else {
      newSelected.add(designerId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === filteredAndSortedDesigners.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      setSelectedItems(new Set(filteredAndSortedDesigners.map(d => d.id)));
      setSelectAll(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} selected designers?`)) {
      try {
        await Promise.all([...selectedItems].map(id => api.delete(`/designers/${id}`)));
        setSelectedItems(new Set());
        setSelectAll(false);
        fetchDesigners();
      } catch (err) {
        alert('Failed to delete some designers');
      }
    }
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const importedDesigners = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.replace(/^"|"$/g, ''));
            return {
              companyName: values[0] || '',
              displayName: values[1] || '',
              name: values[2] || '',
              email: values[3] || '',
              phone: values[4] || '',
              gstin: values[5] || '',
              status: values[6] || 'active'
            };
          });

        setLoading(true);
        let successCount = 0;
        let errorsCount = 0;

        // Process sequentially to not overload backend
        for (const designer of importedDesigners) {
          try {
            await api.post('/designers', designer);
            successCount++;
          } catch (err) {
            console.error('Failed appending designer:', err);
            errorsCount++;
          }
        }

        fetchDesigners();
        setImportMenuOpen(false);
        alert(`Successfully imported ${successCount} designers! ${errorsCount > 0 ? `(${errorsCount} failed)` : ''}`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error parsing CSV file. Please check the format.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportCSV = () => {
    const headers = ['Company Name', 'Display Name', 'Contact Person', 'Email', 'Phone', 'GSTIN', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedDesigners.map(designer => [
        `"${designer.companyName || ''}"`,
        `"${designer.displayName || ''}"`,
        `"${designer.name || ''}"`,
        `"${designer.email || ''}"`,
        `"${designer.phone || ''}"`,
        `"${designer.gstin || ''}"`,
        `"${designer.status || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `designers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = designers.filter(d => d.status === 'active').length;
  const inactiveCount = designers.length - activeCount;
  const gstinCount = designers.filter(d => d.gstin && d.gstin.trim()).length;

  const filteredAndSortedDesigners = (() => {
    let filtered = [...designers];

    // Filter type (Filter Pills)
    if (filterType === 'active') filtered = filtered.filter(d => d.status === 'active');
    else if (filterType === 'inactive') filtered = filtered.filter(d => d.status !== 'active');
    else if (filterType === 'gstin') filtered = filtered.filter(d => d.gstin && d.gstin.trim());

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        (d.companyName || '').toLowerCase().includes(query) ||
        (d.displayName || '').toLowerCase().includes(query) ||
        (d.name || '').toLowerCase().includes(query) ||
        (d.email || '').toLowerCase().includes(query) ||
        (d.phone || '').toLowerCase().includes(query) ||
        (d.gstin || '').toLowerCase().includes(query)
      );
    }

    // Sort designers
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = (a.companyName || a.name || '').toLowerCase();
          bValue = (b.companyName || b.name || '').toLowerCase();
          break;
        case 'contact':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
        case 'gstin':
          aValue = (a.gstin || '').toLowerCase();
          bValue = (b.gstin || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        default:
          aValue = (a.companyName || a.name || '').toLowerCase();
          bValue = (b.companyName || b.name || '').toLowerCase();
      }

      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1F3A2E] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading designers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 relative min-h-screen">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 shadow-sm relative z-30">
        <div className="container mx-auto px-6 py-2">
          {/* Top Row: Title, Search, Actions */}
          <div className="flex items-center gap-3">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Designers</h1>
            </div>

            {/* Centered Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto">
              <div className="relative dropdown-container flex items-stretch">
                {/* Filter Dropdown */}
                <div className="relative border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center shrink-0">
                  <button
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    className="flex items-center gap-1.5 pl-3 pr-2 h-full text-gray-600 hover:text-gray-900 focus:outline-none"
                    title="Filter Designers"
                  >
                    <HiFilter className="w-4 h-4" />
                    <HiChevronDown className="w-3 h-3 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {filterMenuOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn">
                      <button
                        onClick={() => { setFilterType('all'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${filterType === 'all' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>All Designers ({designers.length})</span>
                        {filterType === 'all' && <HiCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setFilterType('active'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${filterType === 'active' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>Active ({activeCount})</span>
                        {filterType === 'active' && <HiCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setFilterType('inactive'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${filterType === 'inactive' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>Inactive ({inactiveCount})</span>
                        {filterType === 'inactive' && <HiCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setFilterType('gstin'); setFilterMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${filterType === 'gstin' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <span>GSTIN Registered ({gstinCount})</span>
                        {filterType === 'gstin' && <HiCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <HiSearch className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Name, Email, Phone, GSTIN..."
                    className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-r-lg text-sm shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] transition-all bg-gray-50 focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {designers.length > 0 && (
              <div className="flex items-center gap-2 lg:w-auto">
                <label htmlFor="csv-upload" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-all text-sm font-medium shadow-sm hover:shadow cursor-pointer">
                  <HiUpload className="w-4 h-4" />
                  Import
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                  id="csv-upload"
                />

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-all text-sm font-medium shadow-sm hover:shadow"
                >
                  <HiDownload className="w-4 h-4" />
                  Export
                </button>

                <Link
                  to="/designers/new"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1F3A2E] text-white rounded-lg hover:bg-[#243d32] transition-colors text-sm font-semibold shadow-md"
                >
                  <HiPlus className="w-4 h-4" />
                  Add Designer
                </Link>
              </div>
            )}
          </div>

          {/* View Controls, Summary & Sort - Combined Row */}
          {designers.length > 0 && (
            <div className="flex items-center justify-between gap-4 mt-3">
              {/* Left: View Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2.5 rounded-l-lg transition-all ${
                      viewMode === 'table'
                        ? 'bg-[#1F3A2E] text-white shadow-inner'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Table View"
                  >
                    <HiViewList className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-r-lg transition-all border-l border-gray-200 ${
                      viewMode === 'grid'
                        ? 'bg-[#1F3A2E] text-white shadow-inner'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Grid View"
                  >
                    <HiViewGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Center: Summary Text */}
              <div className="flex-1 text-center">
                <p className="text-lg text-gray-900 font-bold">
                  {designers.length} Designers • {gstinCount} GSTIN registered • {activeCount} active • {inactiveCount} inactive
                </p>
              </div>

              {/* Right: Sort Controls */}
              {filteredAndSortedDesigners.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 mt-0.5">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 pr-8 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1F3A2E] focus:border-[#1F3A2E] bg-white shadow-sm hover:border-gray-300 transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
                  >
                    <option value="name">Company Name</option>
                    <option value="contact">Contact Person</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="gstin">GSTIN</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all bg-white shadow-sm"
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Table or Grid */}
      <div className="container mx-auto px-4 py-4 relative z-10">
        {viewMode === 'table' && selectedItems.size > 0 && (
          <div className="mb-4 bg-[#1a1d2e] text-white rounded-lg px-4 py-2 flex items-center justify-between shadow-lg">
            <span className="text-sm font-medium">{selectedItems.size} item(s) selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {filteredAndSortedDesigners.length === 0 ? (
          <div className="card p-12 text-center bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Designers Found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 
                `No items match "${searchQuery}"` :
                filterType !== 'all'
                  ? `No items found with "${filterType}" filter`
                  : "Start by adding your first designer"
              }
            </p>
            {filterType === 'all' && !searchQuery && (
              <Link to="/designers/new" className="inline-flex items-center px-6 py-3 bg-[#1F3A2E] text-white font-medium rounded-lg hover:bg-[#243d32] transition-colors">
                <HiPlus className="w-5 h-5 mr-2" />
                Add Your First Designer
              </Link>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 w-12">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-[#1F3A2E] bg-gray-100 border-gray-300 rounded focus:ring-[#1F3A2E] focus:ring-2"
                      />
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Company
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Contact
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Email
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Phone
                    </th>
                    <th className="text-left text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      GSTIN
                    </th>
                    <th className="text-center text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Status
                    </th>
                    <th className="text-center text-sm font-bold text-gray-800 tracking-wide px-4 py-2.5">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedDesigners.map((designer) => (
                    <tr key={designer.id} className="transition-colors duration-150 border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(designer.id)}
                          onChange={() => handleSelectItem(designer.id)}
                          className="w-4 h-4 text-[#1F3A2E] bg-gray-100 border-gray-300 rounded focus:ring-[#1F3A2E] focus:ring-2"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Link to={`/designers/${designer.id}`} className="block group">
                          <div className="text-[15px] font-bold text-gray-900 group-hover:text-[#1F3A2E] transition-colors">
                            {designer.companyName || designer.displayName || designer.name}
                          </div>
                          {designer.companyName && designer.displayName && (
                            <div className="text-[13px] text-gray-600 mt-0.5 font-semibold">
                              {designer.displayName}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-gray-700">
                        {designer.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-600">
                        {designer.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm text-gray-600">
                        {designer.phone || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-sm font-mono text-gray-600">
                        {designer.gstin ? (
                          <span title={designer.gstin}>
                            {designer.gstin.length > 12 ? designer.gstin.substring(0, 12) + '···' : designer.gstin}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-center">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${
                          designer.status === 'active' 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }`}>
                          {designer.status.charAt(0).toUpperCase() + designer.status.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-center px-4 py-2.5">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Link to={`/designers/${designer.id}/edit`} className="text-[#1F3A2E] hover:text-[#243d32] font-semibold transition-colors">
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedDesigners.map((designer) => (
              <div 
                key={designer.id} 
                className="bg-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Designer Info */}
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-3">
                    {designer.image ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
                        <img src={designer.image} alt={designer.companyName || designer.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-50 to-cyan-100 text-[#1F3A2E] flex items-center justify-center text-xl font-black shadow-sm border border-teal-100 flex-shrink-0">
                        {(designer.companyName || designer.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <Link to={`/designers/${designer.id}`}>
                        <h3 className="text-base font-bold text-gray-900 hover:text-[#1F3A2E] transition-colors line-clamp-1">
                          {designer.companyName || designer.displayName || designer.name}
                        </h3>
                      </Link>
                      <span className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          designer.status === 'active' 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }`}>
                        {designer.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Contact</span>
                      <span className="text-sm font-bold text-gray-900">{designer.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Phone</span>
                      <span className="text-xs font-semibold text-gray-600">{designer.phone || '-'}</span>
                    </div>
                    {designer.gstin && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">GSTIN</span>
                        <span className="text-xs font-mono font-medium text-gray-600">
                          {designer.gstin.length > 12 ? designer.gstin.substring(0, 12) + '···' : designer.gstin}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Link Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
                    <Link
                      to={`/designers/${designer.id}/edit`}
                      className="text-xs text-[#1F3A2E] hover:underline font-medium pr-1"
                    >
                      Edit Designer
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerList;
