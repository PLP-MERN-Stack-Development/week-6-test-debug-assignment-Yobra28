import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { booksAPI, transactionsAPI } from '../services/api';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  Calendar,
  User,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Books = () => {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    description: '',
    availability: {
      totalCopies: 1,
      availableCopies: 1
    }
  });
  const [addBookFormData, setAddBookFormData] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    description: '',
    availability: {
      totalCopies: 1,
      availableCopies: 1
    }
  });

  useEffect(() => {
    fetchBooks();
  }, [currentPage]);

  const fetchBooks = async (search = '') => {
    try {
      setLoading(true);
      const params = { 
        page: currentPage, 
        limit: 12,
        ...(search && { search })
      };
      const response = await booksAPI.getBooks(params);
      setBooks(response.data.books || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setSearching(true);
      setCurrentPage(1);
      try {
        const response = await booksAPI.searchBooks(searchTerm);
        setBooks(response.data || []);
        setTotalPages(1);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Search failed');
      } finally {
        setSearching(false);
      }
    } else {
      setCurrentPage(1);
      fetchBooks();
    }
  };

  const handleRequestBook = async (bookId) => {
    try {
      await transactionsAPI.requestBook(bookId, 'Book request from catalog');
      toast.success('Book request submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request book';
      toast.error(message);
    }
  };

  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      await booksAPI.createBook(addBookFormData);
      toast.success('Book added successfully!');
      
      // Reset form and close modal
      setAddBookFormData({
        title: '',
        author: '',
        genre: '',
        isbn: '',
        description: '',
        availability: {
          totalCopies: 1,
          availableCopies: 1
        }
      });
      setShowAddModal(false);
      fetchBooks();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add book';
      toast.error(message);
    }
  };

  const handleEditBook = (book) => {
    setEditFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      isbn: book.isbn,
      description: book.description,
      availability: {
        totalCopies: book.availability?.totalCopies || 1,
        availableCopies: book.availability?.availableCopies || 1
      }
    });
    setSelectedBook(book);
    setShowEditModal(true);
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      await booksAPI.updateBook(selectedBook._id, editFormData);
      toast.success('Book updated successfully!');
      setShowEditModal(false);
      fetchBooks();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update book';
      toast.error(message);
    }
  };

  const handleDeleteBook = async (book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      try {
        await booksAPI.deleteBook(book._id);
        toast.success('Book deleted successfully!');
        fetchBooks();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete book';
        toast.error(message);
      }
    }
  };

  const BookCard = ({ book }) => (
    <div className="card hover:shadow-lg transition-all duration-200 group">
      <div className="aspect-w-3 aspect-h-4 mb-4">
        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
          {book.coverImage ? (
            <img 
              src={book.coverImage} 
              alt={book.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <BookOpen className="h-16 w-16 text-primary-600" />
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">by {book.author}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
            {book.genre}
          </span>
          {book.rating?.average > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {book.rating.average.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            book.availability?.availableCopies > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {book.availability?.availableCopies > 0 
              ? `${book.availability.availableCopies} Available` 
              : 'Not Available'
            }
          </span>
          <div className="text-xs text-gray-500">
            {book.availability?.totalCopies} total
          </div>
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={() => {
              setSelectedBook(book);
              setShowDetailsModal(true);
            }}
            className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>Details</span>
          </button>
          
          {isAdmin ? (
            <>
              <button 
                onClick={() => handleEditBook(book)}
                className="btn-secondary text-sm py-2 px-3 flex items-center justify-center"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDeleteBook(book)}
                className="btn-secondary text-sm py-2 px-3 flex items-center justify-center text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            book.availability?.availableCopies > 0 && (
              <button 
                onClick={() => handleRequestBook(book._id)}
                className="flex-1 btn-primary text-sm py-2"
              >
                Request
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );

  const BookDetailsModal = ({ book, isOpen, onClose }) => {
    if (!isOpen || !book) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                  {book.coverImage ? (
                    <img 
                      src={book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-primary-600" />
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h2>
                <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded">
                      {book.genre}
                    </span>
                    {book.rating?.average > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {book.rating.average.toFixed(1)} ({book.rating.count} reviews)
                        </span>
                      </div>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-gray-700">{book.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {book.publisher && (
                      <div>
                        <span className="font-medium text-gray-500">Publisher:</span>
                        <p className="text-gray-900">{book.publisher}</p>
                      </div>
                    )}
                    {book.publishedDate && (
                      <div>
                        <span className="font-medium text-gray-500">Published:</span>
                        <p className="text-gray-900">
                          {new Date(book.publishedDate).getFullYear()}
                        </p>
                      </div>
                    )}
                    {book.pages && (
                      <div>
                        <span className="font-medium text-gray-500">Pages:</span>
                        <p className="text-gray-900">{book.pages}</p>
                      </div>
                    )}
                    {book.isbn && (
                      <div>
                        <span className="font-medium text-gray-500">ISBN:</span>
                        <p className="text-gray-900">{book.isbn}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      book.availability?.availableCopies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.availability?.availableCopies > 0 
                        ? `${book.availability.availableCopies} of ${book.availability.totalCopies} available` 
                        : 'Not Available'
                      }
                    </span>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={onClose}
                        className="btn-secondary"
                      >
                        Close
                      </button>
                      {!isAdmin && book.availability?.availableCopies > 0 && (
                        <button 
                          onClick={() => {
                            handleRequestBook(book._id);
                            onClose();
                          }}
                          className="btn-primary"
                        >
                          Request Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AddBookModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleCloseModal();
      }
    };

    const handleCloseModal = () => {
      setAddBookFormData({
        title: '',
        author: '',
        genre: '',
        isbn: '',
        description: '',
        availability: {
          totalCopies: 1,
          availableCopies: 1
        }
      });
      onClose();
    };

    const handleInputChange = (field, value) => {
      setAddBookFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAvailabilityChange = (field, value) => {
      setAddBookFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [field]: value
        }
      }));
    };

    const handleFormSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleCreateBook(e);
    };

    // Handle escape key and initial focus
    React.useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    // Focus title input only when modal is first opened
    React.useEffect(() => {
      if (isOpen) {
        const timer = setTimeout(() => {
          const titleInput = document.querySelector('input[name="book-title"]');
          if (titleInput) {
            titleInput.focus();
          }
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={handleBackdropClick}
          />
          
          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Book</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="book-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="book-title"
                  name="book-title"
                  type="text"
                  value={addBookFormData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter book title"
                  required
                />
              </div>

              <div>
                <label htmlFor="book-author" className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                </label>
                <input
                  id="book-author"
                  name="book-author"
                  type="text"
                  value={addBookFormData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter author name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="book-genre" className="block text-sm font-medium text-gray-700 mb-1">
                    Genre
                  </label>
                  <input
                    id="book-genre"
                    name="book-genre"
                    type="text"
                    value={addBookFormData.genre}
                    onChange={(e) => handleInputChange('genre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. Fiction"
                  />
                </div>
                <div>
                  <label htmlFor="book-isbn" className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN
                  </label>
                  <input
                    id="book-isbn"
                    name="book-isbn"
                    type="text"
                    value={addBookFormData.isbn}
                    onChange={(e) => handleInputChange('isbn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. 978-0-123456-78-9"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="book-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="book-description"
                  name="book-description"
                  value={addBookFormData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Brief description of the book..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="book-total-copies" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Copies *
                  </label>
                  <input
                    id="book-total-copies"
                    name="book-total-copies"
                    type="number"
                    min="1"
                    value={addBookFormData.availability.totalCopies}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 1;
                      handleAvailabilityChange('totalCopies', total);
                      // Adjust available copies if needed
                      if (addBookFormData.availability.availableCopies > total) {
                        handleAvailabilityChange('availableCopies', total);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="book-available-copies" className="block text-sm font-medium text-gray-700 mb-1">
                    Available Copies *
                  </label>
                  <input
                    id="book-available-copies"
                    name="book-available-copies"
                    type="number"
                    min="0"
                    max={addBookFormData.availability.totalCopies}
                    value={addBookFormData.availability.availableCopies}
                    onChange={(e) => handleAvailabilityChange('availableCopies', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const EditBookModal = ({ book, isOpen, onClose }) => {
    if (!isOpen || !book) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
          
          <div className="relative bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Book</h2>
            
            <form onSubmit={handleUpdateBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={editFormData.genre}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, genre: e.target.value }))}
                    className="input"
                    placeholder="e.g. Fiction"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={editFormData.isbn}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isbn: e.target.value }))}
                    className="input"
                    placeholder="e.g. 978-0-123456-78-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder="Brief description of the book..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Copies *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editFormData.availability.totalCopies}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 1;
                      setEditFormData(prev => ({ 
                        ...prev, 
                        availability: { 
                          ...prev.availability, 
                          totalCopies: total
                        } 
                      }));
                    }}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Copies *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editFormData.availability.totalCopies}
                    value={editFormData.availability.availableCopies}
                    onChange={(e) => setEditFormData(prev => ({ 
                      ...prev, 
                      availability: { 
                        ...prev.availability, 
                        availableCopies: parseInt(e.target.value) || 0 
                      } 
                    }))}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Book
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
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + Math.max(1, currentPage - 2);
                if (pageNumber > totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNumber
                        ? 'bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Library Books</h1>
            <p className="mt-2 text-gray-600">
              Discover and explore our collection of books
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Book</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search books by title, author, or genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="btn-primary flex items-center space-x-2"
            >
              {searching ? (
                <LoadingSpinner size="small" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span>Search</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>

          {books.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms or browse all books' 
                  : 'No books are currently available in the library'
                }
              </p>
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    fetchBooks();
                  }}
                  className="btn-primary mt-4"
                >
                  Show All Books
                </button>
              )}
            </div>
          )}

          <Pagination />
        </>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal 
        book={selectedBook}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBook(null);
        }}
      />

      {/* Add Book Modal */}
      <AddBookModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Book Modal */}
      <EditBookModal 
        book={selectedBook}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBook(null);
        }}
      />
    </div>
  );
};

export default Books; 