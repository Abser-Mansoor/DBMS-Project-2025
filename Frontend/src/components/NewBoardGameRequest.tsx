import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface GameOption {
  _id: string;
  title: string;
  game_type?: string;
  location?: string;
  min_players?: number;
  max_players?: number;
}

interface GameRequestForm {
  game_type: string;
  : string;
}

const NewBoardGameRequest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [games, setGames] = useState<GameOption[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<GameRequestForm>({
    gameId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoadingGames(true);
        const res = await axiosInstance.get('/board-games');
        setGames(res.data || []);
      } catch (err) {
        console.error('Failed to load games', err);
        toast.error('Failed to load games. Try again later.');
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    if (!form.gameId) { toast.error('Please select a game.'); return false; }
    if (!form.date) { toast.error('Please choose a date.'); return false; }
    if (!form.startTime || !form.endTime) { toast.error('Please select start and end times.'); return false; }
    if (form.endTime <= form.startTime) { toast.error('End time must be after start time.'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await axiosInstance.post('/board-games/request', {
        gameId: Number(form.gameId),
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes,
      });
      toast.success('Board game request submitted.');
      navigate('/board-games/my-requests');
    } catch (err: any) {
      console.error('Error submitting game request', err);
      toast.error(err?.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Request a Board Game</h1>
            <button onClick={() => navigate('/board-games')} className="text-sm text-white bg-gray-500 px-3 py-1 rounded hover:bg-gray-600">Back to Games</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Game</label>
              <select name="gameId" value={form.gameId} onChange={handleChange} className="w-full px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg" required>
                <option value="">{loadingGames ? 'Loading games...' : 'Select a game'}</option>
                {games.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.title} {g.game_type ? `— ${g.game_type}` : ''} {g.location ? `(${g.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Date</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">Start Time</label>
                <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">End Time</label>
                <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-1">Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} className="w-full px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg" placeholder="Any details for admin" />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => navigate('/board-games')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button type="submit" disabled={submitting} className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewBoardGameRequest;
```// filepath: