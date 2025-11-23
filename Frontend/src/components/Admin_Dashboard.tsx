import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

interface BorrowRequest {
  _id: string;
  student_name: string;
  book_title: string;
  request_date: string;
  due_date: string | null;
  status: string;
}

interface BookRequest {
  _id: string;
  requester_name: string;
  book_title: string;
  author: string;
  request_date: string;
  status: string;
}

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  pendingBorrowRequests: number;
  pendingBookRequests: number;
  BorrowRequests?: BorrowRequest[];
  BookRequests?: BookRequest[];
}

const Admin_Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    availableBooks: 0,
    pendingBorrowRequests: 0,
    pendingBookRequests: 0,
    BorrowRequests: [],
    BookRequests: []
  });
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const response = await axiosInstance.get("/admin/dashboard/stats");
      setStats(response.data.stats);
      setBorrowRequests(response.data.stats.BorrowRequests || []);
      setBookRequests(response.data.stats.BookRequests || []);
    } catch (error) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  // Handle borrow request action
  const handleBorrowRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await axiosInstance.put(`/admin/borrow/requests/${requestId}`, {
        status: action === 'approve' ? 'approved' : 'rejected'
      });
      toast.success(`Request ${action}ed successfully`);
      fetchDashboard(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    }
  };

  // Handle new book request action
  const handleNewBookRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await axiosInstance.put(`/admin/book/requests/${requestId}`, {
        status: action === 'approve' ? 'approved' : 'rejected'
      });
      toast.success(`Book request ${action}ed successfully`);
      fetchDashboard(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating book request:', error);
      toast.error(error.response?.data?.message || `Failed to ${action} book request`);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Admin Dashboard</h1>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-xl p-6 shadow-md shadow-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Books</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalBooks}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-6 shadow-md shadow-blue-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Available</h3>
              <p className="text-3xl font-bold text-green-600">{stats.availableBooks}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6 shadow-md shadow-blue-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Borrowed</h3>
              <p className="text-3xl font-bold text-yellow-600">{borrowRequests.length}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-6 shadow-md shadow-blue-200">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Pending Requests</h3>
              <p className="text-3xl font-bold text-red-600">{bookRequests.length}</p>
            </div>
          </div>

          {/* Borrow/Return Requests */}
          <div className="mb-8 shadow-md shadow-blue-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Borrow/Return Requests</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {borrowRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No pending requests
                      </td>
                    </tr>
                  ) : (
                    borrowRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.student_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.book_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.request_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleBorrowRequest(request._id, 'approve')}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleBorrowRequest(request._id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Book Requests */}
          <div className="mb-8 shadow-md shadow-blue-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">New Book Requests</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{user?.name}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No pending book requests
                      </td>
                    </tr>
                  ) : (
                    bookRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.requester_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.book_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.author}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleNewBookRequest(request._id, 'approve')}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleNewBookRequest(request._id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = '/admin/add-book'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Add New Book
            </button>
            <button 
              onClick={() => window.location.href = '/library'}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
            >
              View Library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin_Dashboard;