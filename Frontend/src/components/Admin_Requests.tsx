import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface BorrowRequest {
  _id: string;
  book: string;
  student: string;
  studentName: string;
  bookTitle: string;
  borrowDate: string;
  returnDate: string;
  actualReturnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  fine?: number;
}

interface RoomRequest {
  _id: string;
  room_name: string;
  member_name: string;
  member_email: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

const Admin_Requests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [roomRequests, setRoomRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [activeTab, setActiveTab] = useState<'borrow' | 'room'>('borrow');

  const fetchBorrowRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/borrow-requests', {
        params: { status: filter }
      });
      setBorrowRequests(response.data);
    } catch (error) {
      console.error('Error fetching borrow requests:', error);
      toast.error('Failed to load borrow requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/rooms/requests', {
        params: { status: filter }
      });
      setRoomRequests(response.data);
    } catch (error) {
      console.error('Error fetching room requests:', error);
      toast.error('Failed to load room requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'borrow') {
      fetchBorrowRequests();
    } else {
      fetchRoomRequests();
    }
  }, [filter, activeTab]);

  const handleBorrowAction = async (requestId: string, action: 'approve' | 'reject' | 'return') => {
    try {
      if (action === 'return') {
        await axiosInstance.post(`/admin/borrow-requests/${requestId}/return`);
        toast.success('Book returned successfully');
      } else {
        await axiosInstance.put(`/admin/borrow-requests/${requestId}`, {
          status: action === 'approve' ? 'approved' : 'rejected'
        });
        toast.success(`Request ${action}ed successfully`);
      }
      fetchBorrowRequests();
    } catch (error) {
      console.error('Error updating borrow request:', error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const handleRoomAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await axiosInstance.put(`/rooms/requests/${requestId}`, {
        status: action === 'approve' ? 'approved' : 'rejected'
      });
      toast.success(`Room request ${action}ed successfully`);
      fetchRoomRequests();
    } catch (error: any) {
      console.error('Error updating room request:', error);
      toast.error(error?.response?.data?.message || `Failed to ${action} room request`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Manage Requests</h1>
            <div className="flex items-center space-x-4">
              {user && <span className="text-gray-700">Welcome, {user.name}</span>}
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('borrow')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'borrow'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Borrow Requests
              </button>
              <button
                onClick={() => setActiveTab('room')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'room'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Room Requests
              </button>
            </nav>
          </div>

          {/* Filter */}
          <div className="mb-8">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending Requests</option>
              <option value="approved">Approved Requests</option>
              <option value="rejected">Rejected Requests</option>
              {activeTab === 'borrow' && <option value="returned">Returned Books</option>}
              {activeTab === 'room' && <option value="cancelled">Cancelled Requests</option>}
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'borrow' ? (
            // Borrow Requests Table
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {borrowRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No requests found
                      </td>
                    </tr>
                  ) : (
                    borrowRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.studentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.bookTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(request.borrowDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleBorrowAction(request._id, 'approve')}
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleBorrowAction(request._id, 'reject')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <button
                              onClick={() => handleBorrowAction(request._id, 'return')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Return Book
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            // Room Requests Table
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roomRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No room requests found
                      </td>
                    </tr>
                  ) : (
                    roomRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.member_name}</div>
                          <div className="text-sm text-gray-500">{request.member_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.room_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(request.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {request.start_time} — {request.end_time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRoomAction(request._id, 'approve')}
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRoomAction(request._id, 'reject')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin_Requests;