import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface RoomOption {
  _id: string;
  room_name: string;
  location?: string;
  capacity?: number;
}

interface RoomRequestForm {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

const NewRoomRequest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<RoomRequestForm>({
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        const res = await axiosInstance.get('/rooms');
        setRooms(res.data || []);
      } catch (err) {
        console.error('Failed to load rooms', err);
        toast.error('Failed to load rooms. Try again later.');
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    if (!form.roomId) {
      toast.error('Please select a room.');
      return false;
    }
    if (!form.date) {
      toast.error('Please choose a date.');
      return false;
    }
    if (!form.startTime || !form.endTime) {
      toast.error('Please select start and end times.');
      return false;
    }
    if (form.endTime <= form.startTime) {
      toast.error('End time must be after start time.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await axiosInstance.post('/rooms/request', {
        roomId: Number(form.roomId),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes,
      });
      toast.success('Room booking request submitted.');
      navigate('/rooms/my-requests');
    } catch (err: any) {
      console.error('Error submitting room request', err);
      toast.error(err?.response?.data?.message || 'Failed to submit room request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Request a Room</h1>
            <button
              onClick={() => navigate('/rooms')}
              className="text-sm text-white bg-red-500 px-3 py-1 rounded hover:bg-red-600"
            >
              ← Back to Rooms
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Room</label>
              <select
                name="roomId"
                value={form.roomId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg"
                required
              >
                <option value="">{loadingRooms ? 'Loading rooms...' : 'Select a room'}</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.room_name} {r.location ? `— ${r.location}` : ''} {r.capacity ? `(${r.capacity} seats)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Date</label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Start Time</label>
                <input
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">End Time</label>
                <input
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Notes (optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg"
                placeholder="Any additional details for the admin"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRoomRequest;