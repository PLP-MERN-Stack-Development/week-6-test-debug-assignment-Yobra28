import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  FileText, 
  Edit3,
  Save,
  X,
  Eye,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileRes, transactionsRes] = await Promise.all([
        usersAPI.getProfile(),
        usersAPI.getMyTransactions()
      ]);
      
      setUser(profileRes.data);
      setTransactions(transactionsRes.data || []);
      setFormData({
        firstName: profileRes.data.firstName || '',
        lastName: profileRes.data.lastName || '',
        email: profileRes.data.email || '',
        username: profileRes.data.username || '',
        phone: profileRes.data.phone || '',
        address: profileRes.data.address || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await usersAPI.updateProfile(formData);
      setUser(response.data);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      username: user.username || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setEditMode(false);
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

  const getTypeIcon = (type) => {
    return type === 'issue' ? BookOpen : FileText;
  };

  const TransactionCard = ({ transaction }) => {
    const TypeIcon = getTypeIcon(transaction.type);
    
    return (
      <div className="card p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 bg-primary-100 rounded-lg">
              <TypeIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {transaction.book?.title || 'Book Title'}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                by {transaction.book?.author || 'Unknown Author'}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="capitalize">{transaction.type}</span>
                <span>•</span>
                <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                {transaction.dueDate && (
                  <>
                    <span>•</span>
                    <span>Due: {new Date(transaction.dueDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              {transaction.notes && (
                <p className="text-sm text-gray-600 mt-2">{transaction.notes}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const activeBooks = transactions.filter(t => 
    t.type === 'issue' && t.status === 'approved' && !t.returnedAt
  ).length;

  const overdueBooks = transactions.filter(t => 
    t.type === 'issue' && 
    t.status === 'approved' && 
    !t.returnedAt && 
    new Date(t.dueDate) < new Date()
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and view your library activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={handleCancel}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {saving ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{user.firstName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{user.lastName || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{user.username || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{user.email || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <p className="text-gray-900 capitalize">{user.role}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {editMode ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="input"
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="text-gray-900">{user.address || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.slice(0, 10).map((transaction) => (
                  <TransactionCard key={transaction._id} transaction={transaction} />
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start by browsing and requesting books
                  </p>
                </div>
              )}
            </div>

            {transactions.length > 10 && (
              <div className="mt-6 text-center">
                <button className="btn-secondary">
                  View All Transactions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <div className="card text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-gray-600 mb-1">@{user.username}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
              {user.role}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Library Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Books Issued</span>
                </div>
                <span className="font-semibold text-gray-900">{activeBooks}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-gray-600">Overdue Books</span>
                </div>
                <span className={`font-semibold ${overdueBooks > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {overdueBooks}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Transactions</span>
                </div>
                <span className="font-semibold text-gray-900">{transactions.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-600">This Month</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {transactions.filter(t => {
                    const transactionDate = new Date(t.createdAt);
                    const now = new Date();
                    return transactionDate.getMonth() === now.getMonth() && 
                           transactionDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary text-left flex items-center space-x-3">
                <BookOpen className="h-5 w-5" />
                <span>Browse Books</span>
              </button>
              <button className="w-full btn-secondary text-left flex items-center space-x-3">
                <Eye className="h-5 w-5" />
                <span>View All Transactions</span>
              </button>
              <button className="w-full btn-secondary text-left flex items-center space-x-3">
                <Clock className="h-5 w-5" />
                <span>Renew Books</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 