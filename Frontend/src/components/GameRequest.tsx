import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

interface Game {
    _id: string;
    game_type: string;
    is_available: boolean;
}

interface GameRequestPayload {
    gameId: string;
    date: string;
    startTime: string;
    endTime: string;
}

const GameRequest: React.FC = () => {
    const { userRole } = useAuth();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestForm, setRequestForm] = useState<Record<string, GameRequestPayload>>({});
    const [openRequestFor, setOpenRequestFor] = useState<string | null>(null);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const res = await axiosInstance.get('/games');
                setGames(res.data || []);
            } catch (err) {
                console.error('Error fetching games', err);
                toast.error('Failed to load games');
            } finally {
                setLoading(false);
            }
        };
        fetchGames();
    }, []);

    const handleRequestChange = (gameId: string, field: keyof GameRequestPayload, value: string) => {
        setRequestForm(prev => ({
            ...prev,
            [gameId]: {
                ...(prev[gameId] ?? { gameId, date: '', startTime: '', endTime: '' }),
                [field]: value
            }
        }));
    };

    const submitRequest = async (gameId: string) => {
        const data = requestForm[gameId];
        if (!data || !data.date || !data.startTime || !data.endTime) {
            toast.error('Please fill date, start time and end time');
            return;
        }

        try {
            await axiosInstance.post('/games/request', {
                game_id: gameId,
                date: data.date,
                start_time: data.startTime,
                end_time: data.endTime
            });
            toast.success('Game request submitted');
            setOpenRequestFor(null);
        } catch (err: any) {
            console.error('Error requesting game', err);
            toast.error(err?.response?.data?.message || 'Failed to submit request');
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white pt-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-6">Board Games</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map(game => (
                        <div key={game._id} className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-blue-900 capitalize">{game.game_type}</h3>
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${game.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {game.is_available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                {userRole === 'student' && game.is_available && (
                                    <button
                                        onClick={() => setOpenRequestFor(openRequestFor === game._id ? null : game._id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                        {openRequestFor === game._id ? 'Cancel' : 'Request'}
                                    </button>
                                )}
                            </div>

                            {openRequestFor === game._id && (
                                <div className="mt-4 pt-4 border-t space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border rounded"
                                            onChange={(e) => handleRequestChange(game._id, 'date', e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">Start</label>
                                            <input
                                                type="time"
                                                className="w-full px-3 py-2 border rounded"
                                                onChange={(e) => handleRequestChange(game._id, 'startTime', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-700 mb-1">End</label>
                                            <input
                                                type="time"
                                                className="w-full px-3 py-2 border rounded"
                                                onChange={(e) => handleRequestChange(game._id, 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => submitRequest(game._id)}
                                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-2"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameRequest;
