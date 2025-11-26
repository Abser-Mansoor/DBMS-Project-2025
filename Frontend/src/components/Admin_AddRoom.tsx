import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';

const Admin_AddRoom: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomName: '',
    capacity: 1,
    location: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value
    }));
  };

  const validate = () => {
    if (!formData.roomName.trim()) {
      toast.error('Room name is required');
      return false;
    }
    if (!formData.location.trim()) {
      toast.error('Location is required');
      return false;
    }
    if (!Number.isFinite(formData.capacity) || formData.capacity < 1) {
      toast.error('Capacity must be a number greater than 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axiosInstance.post('/rooms', {
        roomName: formData.roomName,
        capacity: formData.capacity,
        location: formData.location
      });
      toast.success('Room added successfully');
      navigate('/rooms');
    } catch (err: any) {
      console.error('Error adding room', err);
      toast.error(err?.response?.data?.message || 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-800">Add New Room</h1>
            <button
              onClick={() => navigate('/rooms')}
              className="text-white hover:bg-red-600 bg-red-500 px-3 py-1 rounded"
            >
              ← Back to Rooms
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1" htmlFor="roomName">
                  Room Name*
                </label>
                <input
                  id="roomName"
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1" htmlFor="capacity">
                  Capacity*
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1" htmlFor="location">
                  Location*
                </label>
                <input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Building A - Room 101"
                  className="w-full text-black px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-white hover:bg-green-600 bg-green-500 px-4 py-2 rounded"
              >
                ← Back to Dashboard
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {loading ? 'Adding...' : 'Add Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Admin_AddRoom;