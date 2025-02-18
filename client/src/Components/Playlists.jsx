import { useState, useEffect } from 'react';
import { ChevronRight, Loader, Music2, RefreshCw } from 'lucide-react'; // Added RefreshCw icon
import { toast } from 'react-hot-toast';

const Playlists = ({ userId, onPlaySong }) => {
    const [playlists, setPlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [expandedPlaylist, setExpandedPlaylist] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchPlaylists();
        }
    }, [userId]);

    const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://music-app-2-0.vercel.app/playlists?user_id=${userId}`);
            const data = await response.json();
            setPlaylists(data);
        } catch (error) {
            toast.error('Failed to fetch playlists');
        }
        setIsLoading(false);
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            toast.error('Please enter a playlist name');
            return;
        }

        try {
            const response = await fetch('https://music-app-2-0.vercel.app/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, name: newPlaylistName }),
            });
            const data = await response.json();
            if (data.message) {
                toast.success('Playlist created successfully!');
                setPlaylists([...playlists, { id: data.playlist_id, name: newPlaylistName, songs: [] }]);
                setNewPlaylistName('');
            }
        } catch (error) {
            toast.error('Failed to create playlist');
        }
    };

    return (
        <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Your Playlists
                </h3>
                <button
                    onClick={fetchPlaylists}
                    className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all"
                    title="Refresh Playlists"
                >
                    <RefreshCw size={20} className="text-gray-400" />
                </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
                <input
                    type="text"
                    placeholder="New playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    onClick={handleCreatePlaylist}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition-all"
                >
                    Create
                </button>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
            ) : (
                <ul className="space-y-4">
                    {playlists.map((playlist) => (
                        <li key={playlist.id}>
                            <div
                                onClick={() => setExpandedPlaylist(expandedPlaylist === playlist.id ? null : playlist.id)}
                                className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/30 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="text-lg font-semibold">{playlist.name}</h4>
                                    <p className="text-sm text-gray-400">
                                        {playlist.songs?.length || 0} songs
                                    </p>
                                </div>
                                <ChevronRight
                                    size={20}
                                    className={`text-gray-400 transition-transform ${
                                        expandedPlaylist === playlist.id ? 'rotate-90' : ''
                                    }`}
                                />
                            </div>
                            {expandedPlaylist === playlist.id && playlist.songs?.length > 0 && (
                                <ul className="mt-2 ml-4 space-y-2">
                                    {playlist.songs.map((song) => (
                                        <li
                                            key={song.id}
                                            onClick={() => onPlaySong(song)}
                                            className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 cursor-pointer transition-all flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 rounded overflow-hidden">
                                                {song.thumbnail_url ? (
                                                    <img
                                                        src={song.thumbnail_url}
                                                        alt={song.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                                        <Music2 size={16} className="text-white/50" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm">{song.title}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Playlists;