import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { toast } from 'react-toastify';

interface Game {
    _id: string;
    game_type: string;
    is_available: boolean;
}

interface GameRequest {
    _id: string;
    member_id: string;
    game_id: {
        _id: string;
        game_type: string;
    };
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    member_name?: string; // Assuming backend populates this or we fetch it
}

const Admin_Games: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [requests, setRequests] = useState<GameRequest[]>([]);
    const [newGameType, setNewGameType] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'games' | 'requests'>('games');

    const fetchData = async () => {
        try {
            const [gamesRes, requestsRes] = await Promise.all([
                axiosInstance.get('/games'),
                axiosInstance.get('/games/requests')
            ]);
            setGames(gamesRes.data || []);
            setRequests(requestsRes.data || []);
        } catch (err) {
            console.error('Error fetching data', err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddGame = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGameType.trim()) return;

        try {
            await axiosInstance.post('/games', { game_type: newGameType });
            toast.success('Game added successfully');
            setNewGameType('');
            fetchData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to add game');
        }
    };

    const handleDeleteGame = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this game?')) return;
        try {
            await axiosInstance.delete(`/games/${id}`);
            toast.success('Game deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete game');
        }
    };

    const handleProcessRequest = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await axiosInstance.put(`/games/requests/${id}`, { status });
            toast.success(`Request ${status}`);
            fetchData();
        } catch (err) {
            toast.error('Failed to process request');
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 px-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-blue-800 mb-6">Game Management</h1>

                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveTab('games')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'games' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                        Manage Games
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded-lg ${activeTab === 'requests' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                        Game Requests
                    </button>
                </div>

                {activeTab === 'games' ? (
                    <div className="bg-white rounded-xl shadow p-6">
                        <form onSubmit={handleAddGame} className="mb-8 flex gap-4">
                            <input
                                value={newGameType}
                                onChange={(e) => setNewGameType(e.target.value)}
                                placeholder="Enter game type (e.g., Chess)"
                                className="flex-1 px-4 py-2 border rounded-lg"
                            />
                            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                                Add Game
                            </button>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {games.map(game => (
                                <div key={game._id} className="border rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold capitalize">{game.game_type}</h3>
                                        <span className={`text-sm ${game.is_available ? 'text-green-600' : 'text-red-600'}`}>
                                            {game.is_available ? 'Available' : 'In Use'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteGame(game._id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Game</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.map(req => (
                                    <tr key={req._id}>
                                        <td className="px-6 py-4 text-black whitespace-nowrap capitalize">{req.game_id?.game_type || 'Unknown Game'}</td>
                                        <td className="px-6 py-4 text-black whitespace-nowrap">{new Date(req.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-black whitespace-nowrap">{req.start_time} - {req.end_time}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {req.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleProcessRequest(req._id, 'approved')}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleProcessRequest(req._id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin_Games;
