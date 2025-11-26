import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface Room {
  _id: string;
  room_name: string;
  capacity: number;
  location: string;
  created_at?: string;
}

interface RoomRequestPayload {
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
}

const Rooms: React.FC = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [filtered, setFiltered] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state for filters / sort
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minCapacity, setMinCapacity] = useState<number | ''>('');
  const [sortField, setSortField] = useState<'room_name' | 'capacity'>('room_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // request form state keyed by room id
  const [openRequestFor, setOpenRequestFor] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState<Record<string, { date: string; startTime: string; endTime: string }>>({});

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axiosInstance.get('/rooms');
        setRooms(res.data || []);
        setFiltered(res.data || []);
      } catch (err) {
        console.error('Error fetching rooms', err);
        toast.error('Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    let list = [...rooms];

    if (nameFilter) {
      list = list.filter(r => r.room_name.toLowerCase().includes(nameFilter.toLowerCase()));
    }
    if (locationFilter) {
      list = list.filter(r => r.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }
    if (minCapacity !== '') {
      list = list.filter(r => r.capacity >= Number(minCapacity));
    }

    list.sort((a, b) => {
      const aVal = sortField === 'room_name' ? a.room_name.toLowerCase() : a.capacity;
      const bVal = sortField === 'room_name' ? b.room_name.toLowerCase() : b.capacity;
      if (aVal < (bVal as any)) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > (bVal as any)) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(list);
  }, [rooms, nameFilter, locationFilter, minCapacity, sortField, sortOrder]);

  const handleSortToggle = (field: 'room_name' | 'capacity') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const openRequestForm = (roomId: string) => {
    setOpenRequestFor(roomId);
    setRequestForm(prev => ({
      ...prev,
      [roomId]: prev[roomId] ?? { date: '', startTime: '', endTime: '' }
    }));
  };

  const closeRequestForm = () => setOpenRequestFor(null);

  const handleRequestChange = (roomId: string, field: keyof RoomRequestPayload, value: string) => {
    setRequestForm(prev => ({
      ...prev,
      [roomId]: { ...(prev[roomId] ?? { date: '', startTime: '', endTime: '' }), [field]: value }
    }));
  };

  const submitRequest = async (roomId: string) => {
    const data = requestForm[roomId];
    if (!data || !data.date || !data.startTime || !data.endTime) {
      toast.error('Please fill date, start time and end time');
      return;
    }
    if (data.endTime <= data.startTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      await axiosInstance.post('/rooms/request', {
        roomId: Number(roomId),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime
      });
      toast.success('Room booking request submitted');
      closeRequestForm();
      // optionally navigate to "my requests" page
      navigate('/rooms/my-requests');
    } catch (err: any) {
      console.error('Error creating room request', err);
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    }
  };

  const navigateToAddRoom = () => {
    if (userRole !== 'admin') return;
    navigate('/admin/add-room');
  };

  const navigateToMyRequests = () => {
    if (userRole !== 'student') return;
    navigate('/requests');
  };

  const navigateToRequestRoom = () => {
    if (userRole !== 'student') return;
    navigate('/new-room-request');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">Rooms</h1>
          <div className="flex gap-3">
            {userRole === 'student' && (
              <div className="flex gap-4">
                <button
                  onClick={navigateToMyRequests}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  My Requests
                </button>

                <button
                  onClick={navigateToRequestRoom}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Request Room
                </button>
              </div>
            )}
            {userRole === 'admin' && (
              <button
                onClick={navigateToAddRoom}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Add Room
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-blue-900">Filters</h2>
            <span className="text-sm text-blue-800">Showing {filtered.length} of {rooms.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Room name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="px-3 py-2 border rounded bg-white text-blue-900"
            />
            <input
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border rounded bg-white text-blue-900"
            />
            <input
              placeholder="Min capacity"
              type="number"
              min={0}
              value={minCapacity === '' ? '' : String(minCapacity)}
              onChange={(e) => setMinCapacity(e.target.value === '' ? '' : Number(e.target.value))}
              className="px-3 py-2 border rounded bg-white text-blue-900"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-900">Available Rooms</h3>
              <div className="flex gap-2 text-blue-900">
                <button onClick={() => handleSortToggle('room_name')} className="px-3 py-1 border rounded text-sm bg-white">
                  Sort: Name {sortField === 'room_name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </button>
                <button onClick={() => handleSortToggle('capacity')} className="px-3 py-1 border rounded text-sm bg-white">
                  Sort: Capacity {sortField === 'capacity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-blue-600">Loading rooms...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(room => (
                    <React.Fragment key={room._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{room.room_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{room.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{room.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {userRole === 'student' && (
                            <button
                              onClick={() => openRequestForm(room._id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                              Request
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => navigate(`/admin/rooms/${room._id}`)}
                              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                            >
                              Manage
                            </button>
                          )}
                        </td>
                      </tr>

                      {openRequestFor === room._id && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                              <div>
                                <label className="text-sm text-gray-700">Date</label>
                                <input
                                  type="date"
                                  value={requestForm[room._id]?.date ?? ''}
                                  onChange={(e) => handleRequestChange(room._id, 'date', e.target.value)}
                                  className="mt-1 px-3 py-2 border rounded w-full"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">Start</label>
                                <input
                                  type="time"
                                  value={requestForm[room._id]?.startTime ?? ''}
                                  onChange={(e) => handleRequestChange(room._id, 'startTime', e.target.value)}
                                  className="mt-1 px-3 py-2 border rounded w-full"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">End</label>
                                <input
                                  type="time"
                                  value={requestForm[room._id]?.endTime ?? ''}
                                  onChange={(e) => handleRequestChange(room._id, 'endTime', e.target.value)}
                                  className="mt-1 px-3 py-2 border rounded w-full"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => submitRequest(room._id)}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                >
                                  Submit
                                </button>
                                <button
                                  onClick={closeRequestForm}
                                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;