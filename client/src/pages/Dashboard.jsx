import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { booksAPI, usersAPI, transactionsAPI } from '../services/api';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Library,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentBooks, setRecentBooks] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAdmin) {
          // Admin dashboard data
          const [dashboardStatsRes, recentBooksRes] = await Promise.all([
            usersAPI.getDashboardStats(),
            booksAPI.getBooks({ limit: 5 })
          ]);
          
          setRecentBooks(recentBooksRes.data.books || []);
          setStats(dashboardStatsRes.data);
        } else {
          // User dashboard data
          const [booksRes, transactionsRes] = await Promise.all([
            booksAPI.getBooks({ limit: 6 }),
            usersAPI.getMyTransactions()
          ]);
          
          setRecentBooks(booksRes.data.books || []);
          setMyTransactions(transactionsRes.data.slice(0, 5) || []);
          
          const issuedBooks = transactionsRes.data.filter(t => 
            t.type === 'issue' && t.status === 'approved' && !t.returnedAt
          ).length;
          
          setStats({
            issuedBooks,
            totalTransactions: transactionsRes.data.length,
            pendingRequests: transactionsRes.data.filter(t => t.status === 'pending').length
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "primary" }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  const BookCard = ({ book }) => (
    <div className="card p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{book.title}</h4>
          <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            book.availability?.availableCopies > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {book.availability?.availableCopies > 0 ? 'Available' : 'Not Available'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Genre</p>
          <p className="text-sm font-medium text-gray-900">{book.genre}</p>
        </div>
      </div>
    </div>
  );

  const TransactionItem = ({ transaction }) => {
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
      return type === 'issue' ? BookOpen : CheckCircle;
    };

    const TypeIcon = getTypeIcon(transaction.type);

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <TypeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {transaction.book?.title || 'Book Title'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {transaction.type} • {new Date(transaction.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
          {transaction.status}
        </span>
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          {isAdmin 
            ? 'Here\'s an overview of your library system.' 
            : 'Discover and manage your library books.'
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {isAdmin ? (
          <>
            <StatCard 
              icon={BookOpen} 
              title="Total Books" 
              value={stats.totalBooks || 0} 
              subtitle="In collection"
            />
            <StatCard 
              icon={Users} 
              title="Total Users" 
              value={stats.totalUsers || 0} 
              subtitle="Registered members"
              color="green"
            />
            <StatCard 
              icon={Library} 
              title="Available Books" 
              value={stats.availableBooks || 0} 
              subtitle="Ready to borrow"
              color="blue"
            />
            <StatCard 
              icon={Clock} 
              title="Pending Requests" 
              value={stats.pendingRequests || 0} 
              subtitle="Need approval"
              color="yellow"
            />
            <StatCard 
              icon={FileText} 
              title="Active Issues" 
              value={stats.activeIssues || 0} 
              subtitle="Books checked out"
              color="red"
            />
          </>
        ) : (
          <>
            <StatCard 
              icon={BookOpen} 
              title="Books Issued" 
              value={stats.issuedBooks || 0} 
              subtitle="Currently with you"
            />
            <StatCard 
              icon={FileText} 
              title="Total Transactions" 
              value={stats.totalTransactions || 0} 
              subtitle="All time"
              color="green"
            />
            <StatCard 
              icon={Clock} 
              title="Pending Requests" 
              value={stats.pendingRequests || 0} 
              subtitle="Awaiting approval"
              color="yellow"
            />
            <StatCard 
              icon={TrendingUp} 
              title="This Month" 
              value="5" 
              subtitle="Books read"
              color="blue"
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Books */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? 'Recently Added Books' : 'Available Books'}
            </h2>
            <Library className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentBooks.length > 0 ? (
              recentBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No books available</p>
            )}
          </div>
        </div>

        {/* Recent Activity / Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? 'Recent Activity' : 'My Recent Transactions'}
            </h2>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-0">
            {(isAdmin ? [] : myTransactions).length > 0 ? (
              (isAdmin ? [] : myTransactions).map((transaction) => (
                <TransactionItem key={transaction._id} transaction={transaction} />
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {isAdmin ? 'No recent activity' : 'No transactions yet'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {!isAdmin && 'Start by browsing and requesting books'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {!isAdmin && (
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn-primary text-left p-4">
              <BookOpen className="h-6 w-6 mb-2" />
              <div>
                <p className="font-medium">Browse Books</p>
                <p className="text-sm opacity-90">Discover new books</p>
              </div>
            </button>
            <button className="btn-secondary text-left p-4">
              <FileText className="h-6 w-6 mb-2" />
              <div>
                <p className="font-medium">My Transactions</p>
                <p className="text-sm opacity-75">View history</p>
              </div>
            </button>
            <button className="btn-secondary text-left p-4">
              <Users className="h-6 w-6 mb-2" />
              <div>
                <p className="font-medium">Profile</p>
                <p className="text-sm opacity-75">Update info</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 