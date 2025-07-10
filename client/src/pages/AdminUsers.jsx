import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Calendar,
  BookOpen,
  Edit3,
  Trash2,
  Eye,
  User
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    isActive: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { 
        page: currentPage, 
        limit: 10,
        ...(filterRole !== 'all' && { role: filterRole }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await usersAPI.getUsers(params);
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleRoleFilter = (role) => {
    setFilterRole(role);
    setCurrentPage(1);
  };

  const handleEditUser = (user) => {
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.updateUser(selectedUser._id, editFormData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Are you sure you want to delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`)) {
      try {
        await usersAPI.deleteUser(user._id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete user';
        toast.error(message);
      }
    }
  };

  const UserCard = ({ user }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
      <div className="card hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-gray-600 mb-2">@{user.username}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">
                    {user.issuedBooks?.length || 0} books issued
                  </span>
                </div>
                {user.phone && (
                  <span className="text-gray-600">📱 {user.phone}</span>
                )}
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
                      setSelectedUser(user);
                      setShowUserModal(true);
                      setShowDropdown(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleEditUser(user);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit User</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleDeleteUser(user);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete User</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const UserDetailsModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-primary-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Username:</span>
                    <p className="text-gray-900">@{user.username}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  {user.phone && (
                    <div>
                      <span className="font-medium text-gray-500">Phone:</span>
                      <p className="text-gray-900">{user.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-500">Member Since:</span>
                    <p className="text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {user.address && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-500">Address:</span>
                      <p className="text-gray-900">{user.address}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Library Activity</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">
                        {user.issuedBooks?.length || 0}
                      </div>
                      <div className="text-sm text-green-600">Books Issued</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-blue-600">Total Transactions</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-purple-600">Overdue Books</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button onClick={onClose} className="btn-secondary">
                    Close
                  </button>
                  <button className="btn-primary">
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditUserModal = ({ user, isOpen, onClose }) => {
    if (!isOpen || !user) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit User</h2>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active Account
                </label>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update User
                </button>
              </div>
            </form>
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage library users and their permissions
        </p>
      </div>

      {/* Search and Filters */}
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => handleRoleFilter(e.target.value)}
                className="input min-w-[120px]"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Readers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.issuedBooks?.length > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {users.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'No users match the current filters'
                }
              </p>
            </div>
          )}

          <Pagination />
        </>
      )}

      {/* User Details Modal */}
      <UserDetailsModal 
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal 
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default AdminUsers; 