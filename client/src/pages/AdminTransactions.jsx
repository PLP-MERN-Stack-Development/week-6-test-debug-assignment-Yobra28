import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';
import { 
  FileText, 
  Search, 
  Filter, 
  BookOpen,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filterStatus, filterType]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { 
        page: currentPage, 
        limit: 10,
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await transactionsAPI.getTransactions(params);
      setTransactions(response.data.transactions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleStatusUpdate = async (transactionId, newStatus, notes = '') => {
    try {
      await transactionsAPI.updateTransactionStatus(transactionId, newStatus, notes);
      toast.success(`Transaction ${newStatus} successfully`);
      fetchTransactions();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update transaction';
      toast.error(message);
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (window.confirm(`Are you sure you want to delete this ${transaction.type} transaction for "${transaction.book?.title}"? This action cannot be undone.`)) {
      try {
        await transactionsAPI.deleteTransaction(transaction._id);
        toast.success('Transaction deleted successfully');
        fetchTransactions();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete transaction';
        toast.error(message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      case 'completed': return CheckCircle;
      default: return AlertCircle;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'issue' ? BookOpen : FileText;
  };

  const TransactionCard = ({ transaction }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const StatusIcon = getStatusIcon(transaction.status);
    const TypeIcon = getTypeIcon(transaction.type);

    return (
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <TypeIcon className="h-6 w-6 text-primary-600" />
              </div>
              <StatusIcon className={`h-5 w-5 ${
                transaction.status === 'approved' ? 'text-green-600' :
                transaction.status === 'pending' ? 'text-yellow-600' :
                transaction.status === 'rejected' ? 'text-red-600' :
                'text-blue-600'
              }`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {transaction.book?.title || 'Book Title'}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    by {transaction.book?.author || 'Unknown Author'}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{transaction.user?.firstName} {transaction.user?.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className="capitalize">{transaction.type}</span>
                  </div>

                  {transaction.dueDate && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Due Date:</strong> {new Date(transaction.dueDate).toLocaleDateString()}
                      {new Date(transaction.dueDate) < new Date() && transaction.status === 'approved' && (
                        <span className="ml-2 text-red-600 font-medium">OVERDUE</span>
                      )}
                    </div>
                  )}

                  {transaction.notes && (
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Notes:</strong> {transaction.notes}
                    </p>
                  )}

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                    
                    {transaction.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(transaction._id, 'approved')}
                          className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(transaction._id, 'rejected')}
                          className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {transaction.status === 'approved' && transaction.type === 'issue' && !transaction.returnedAt && (
                      <button
                        onClick={() => transactionsAPI.completeReturn(transaction._id).then(() => {
                          toast.success('Book return completed');
                          fetchTransactions();
                        })}
                        className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Mark Returned
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowTransactionModal(true);
                      setShowDropdown(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteTransaction(transaction);
                      setShowDropdown(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Transaction</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TransactionDetailsModal = ({ transaction, isOpen, onClose }) => {
    if (!isOpen || !transaction) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-primary-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Transaction Details
                  </h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <span className="font-medium text-gray-500">Book:</span>
                    <p className="text-gray-900">{transaction.book?.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Author:</span>
                    <p className="text-gray-900">{transaction.book?.author}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">User:</span>
                    <p className="text-gray-900">
                      {transaction.user?.firstName} {transaction.user?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{transaction.user?.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Type:</span>
                    <p className="text-gray-900 capitalize">{transaction.type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Date:</span>
                    <p className="text-gray-900">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {transaction.dueDate && (
                    <div>
                      <span className="font-medium text-gray-500">Due Date:</span>
                      <p className="text-gray-900">
                        {new Date(transaction.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {transaction.returnedAt && (
                    <div>
                      <span className="font-medium text-gray-500">Returned:</span>
                      <p className="text-gray-900">
                        {new Date(transaction.returnedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {transaction.notes && (
                  <div className="mb-6">
                    <span className="font-medium text-gray-500">Notes:</span>
                    <p className="text-gray-900 mt-1">{transaction.notes}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <button onClick={onClose} className="btn-secondary">
                    Close
                  </button>
                  {transaction.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => {
                          handleStatusUpdate(transaction._id, 'approved');
                          onClose();
                        }}
                        className="btn-primary bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => {
                          handleStatusUpdate(transaction._id, 'rejected');
                          onClose();
                        }}
                        className="btn-primary bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const approvedCount = transactions.filter(t => t.status === 'approved').length;
  const overdueCount = transactions.filter(t => 
    t.status === 'approved' && 
    t.dueDate && 
    new Date(t.dueDate) < new Date() && 
    !t.returnedAt
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
      <p className="mt-2 text-gray-600">Manage book requests and returns</p>

      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">All Types</option>
              <option value="issue">Issue</option>
              <option value="return">Return</option>
            </select>

            <button
              onClick={handleSearch}
              className="btn-primary flex items-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <TransactionCard key={transaction._id} transaction={transaction} />
            ))}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms or filters' 
                  : 'No transactions match the current filters'
                }
              </p>
            </div>
          )}

          <Pagination />
        </>
      )}

      <TransactionDetailsModal 
        transaction={selectedTransaction}
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
};

export default AdminTransactions; 