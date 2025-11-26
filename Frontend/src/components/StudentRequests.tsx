import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';

interface BorrowRequestUI {
  _id: string;
  bookTitle: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | string;
  requestDate: string | null;
  dueDate: string | null;
  fine?: number;
}

interface NewBookRequestUI {
  _id: string;
  bookName: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  requestDate: string | null;
}

// added interface for room requests
interface RoomRequestUI {
  _id: string;
  roomName: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: 'pending' | 'approved' | 'rejected' | string;
}

// added interface for game requests
interface GameRequestUI {
  _id: string;
  gameType: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | string;
}

const StudentRequests: React.FC = () => {
  const { user } = useAuth();
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequestUI[]>([]);
  const [newBookRequests, setNewBookRequests] = useState<NewBookRequestUI[]>([]);
  const [roomRequests, setRoomRequests] = useState<RoomRequestUI[]>([]); // new state
  const [gameRequests, setGameRequests] = useState<GameRequestUI[]>([]); // game requests state
  const [loading, setLoading] = useState(true);

  const normalizeBorrow = (r: any): BorrowRequestUI => ({
    _id: String(r._id ?? r.id ?? ''),
    bookTitle: (r.book_title ?? r.title ?? r.bookTitle ?? '').toString(),
    status: (r.status ?? 'pending') as BorrowRequestUI['status'],
    requestDate: r.request_date ?? r.requestDate ?? null,
    dueDate: r.due_date ?? r.dueDate ?? null,
    fine: Number(r.fine ?? 0),
  });

  const normalizeNewBook = (r: any): NewBookRequestUI => ({
    _id: String(r._id ?? r.id ?? ''),
    bookName: (r.title ?? r.book_name ?? r.bookName ?? '').toString(),
    author: (r.author ?? '').toString(),
    status: (r.status ?? 'pending') as NewBookRequestUI['status'],
    requestDate: r.request_date ?? r.requestDate ?? null,
  });

  // normalizer for room requests
  const normalizeRoom = (r: any): RoomRequestUI => ({
    _id: String(r._id ?? r.id ?? ''),
    roomName: (r.room_name ?? r.roomName ?? r.name ?? '').toString(),
    date: r.date ?? r.request_date ?? null,
    startTime: r.start_time ?? r.startTime ?? null,
    endTime: r.end_time ?? r.endTime ?? null,
    status: (r.status ?? 'pending') as RoomRequestUI['status'],
  });

  // normalizer for game requests
  const normalizeGameRequest = (r: any): GameRequestUI => ({
    _id: String(r._id ?? r.id ?? ''),
    gameType: (r.game_type ?? r.gameType ?? '').toString(),
    date: r.date ?? null,
    startTime: r.start_time ?? r.startTime ?? null,
    endTime: r.end_time ?? r.endTime ?? null,
    status: (r.status ?? 'pending') as GameRequestUI['status'],
  });

  const safeExtractArray = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.rows)) return data.rows;
    if (Array.isArray(data.borrowRequests)) return data.borrowRequests;
    if (Array.isArray(data.bookRequests)) return data.bookRequests;
    if (Array.isArray(data.roomRequests)) return data.roomRequests;
    return [];
  };

  const fetchBorrowRequests = async () => {
    try {
      const res = await axiosInstance.get('/student/my-requests');
      if (res.status === 304) return; // keep current state
      const raw = safeExtractArray(res.data);
      setBorrowRequests(raw.map(normalizeBorrow));
    } catch (err: any) {
      console.error('Error fetching borrow requests:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error('Failed to load borrow requests');
    }
  };

  const fetchNewBookRequests = async () => {
    try {
      const res = await axiosInstance.get('/student/new-book-requests');
      if (res.status === 304) return;
      const raw = safeExtractArray(res.data);
      setNewBookRequests(raw.map(normalizeNewBook));
    } catch (err: any) {
      console.error('Error fetching new book requests:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error('Failed to load new book requests');
    }
  };

  // new fetch for room requests
  const fetchRoomRequests = async () => {
    try {
      const res = await axiosInstance.get('/rooms/my-requests');
      if (res.status === 304) return;
      const raw = safeExtractArray(res.data);
      setRoomRequests(raw.map(normalizeRoom));
    } catch (err: any) {
      console.error('Error fetching room requests:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error('Failed to load room requests');
    }
  };

  // fetch game requests
  const fetchGameRequests = async () => {
    try {
      const res = await axiosInstance.get('/games/my-requests');
      if (res.status === 304) return;
      const raw = safeExtractArray(res.data);
      setGameRequests(raw.map(normalizeGameRequest));
    } catch (err: any) {
      console.error('Error fetching game requests:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error('Failed to load game requests');
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchBorrowRequests(), fetchNewBookRequests(), fetchRoomRequests(), fetchGameRequests()]);
      setLoading(false);
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReturn = async (requestId: string) => {
    try {
      await axiosInstance.post(`/student/borrow-requests/${requestId}/return`);
      toast.success('Book returned successfully');
      await fetchBorrowRequests();
    } catch (err: any) {
      console.error('Error returning book:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error('Failed to return book');
    }
  };

  const fmtDate = (val: any) => {
    if (!val) return '-';
    try {
      return new Date(val).toLocaleDateString();
    } catch {
      return String(val);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-8">My Requests</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Borrow/Return Requests</h2>
          <div className="overflow-x-auto">
            {/* make list scrollable */}
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrow Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {borrowRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No requests found</td>
                    </tr>
                  ) : (
                    borrowRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.bookTitle || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              r.status === 'approved' ? 'bg-green-100 text-green-800' :
                                r.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                            }`}>
                            {r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDate(r.requestDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDate(r.dueDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {r.status === 'approved' && (
                            <button onClick={() => handleReturn(r._id)} className="text-blue-600 hover:text-blue-900">Return Book</button>
                          )}
                          {r.status === 'returned' && r.fine && r.fine > 0 && (
                            <span className="text-red-600">Fine: ${r.fine}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">New Book Requests</h2>
          <div className="overflow-x-auto">
            {/* make list scrollable */}
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Generated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {newBookRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No requests found</td>
                    </tr>
                  ) : (
                    newBookRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.bookName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.author || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              r.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                            }`}>{r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDate(r.requestDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Room Requests table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Room Booking Requests</h2>
          <div className="overflow-x-auto">
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roomRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No room requests found</td>
                    </tr>
                  ) : (
                    roomRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.roomName || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDate(r.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(r.startTime ?? '-') + (r.endTime ? ` — ${r.endTime}` : '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              r.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                            }`}>{r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : '-'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* New Game Requests table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Requests</h2>
          <div className="overflow-x-auto">
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gameRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No game requests found</td>
                    </tr>
                  ) : (
                    gameRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{r.gameType || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDate(r.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(r.startTime ?? '-') + (r.endTime ? ` — ${r.endTime}` : '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              r.status === 'approved' ? 'bg-green-100 text-green-800' :
                                r.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                            }`}>{r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : '-'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentRequests;