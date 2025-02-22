import { Music2, Loader, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const SongList = ({ songs = [], isLoading, currentSong, playSong, userId }) => {
    const [activeSongMenu, setActiveSongMenu] = useState(null);
    const [playlistData, setPlaylistData] = useState([]);
    const [loadingPlaylists, setLoadingPlaylists] = useState(false);
    const menuRefs = useRef({});

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                activeSongMenu !== null &&
                menuRefs.current[activeSongMenu] &&
                !menuRefs.current[activeSongMenu].contains(event.target)
            ) {
                setActiveSongMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeSongMenu]);

    const fetchPlaylists = async () => {
        setLoadingPlaylists(true);
        try {
            const response = await fetch(`https://music-app-2-0.onrender.com//playlists?user_id=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch playlists');
            }
            const data = await response.json();
            console.log('Fetched playlists:', data);
            setPlaylistData(data);
        } catch (error) {
            console.error("Error fetching playlists:", error);
            toast.error('Failed to fetch playlists');
        } finally {
            setLoadingPlaylists(false);
        }
    };

    const handleAddToPlaylist = async (song, playlistId, event) => {
        event.stopPropagation();
        console.log(`Adding song ${song.id} to playlist ${playlistId}`);
    
        try {
            const response = await fetch('https://music-app-2-0.onrender.com//playlists/add-song', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    playlist_id: playlistId,
                    song_id: song.id,
                    song: song  // Send the complete song object
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong!');
            }
    
            toast.success('Song added to playlist!');
            setActiveSongMenu(null);
        } catch (error) {
            console.error("Error adding song to playlist:", error);
            toast.error(error.message || 'Failed to add song to playlist');
        }
    };

    const toggleMenu = async (event, song) => {
        event.stopPropagation();
        if (activeSongMenu === song.id) {
            setActiveSongMenu(null);
        } else {
            setActiveSongMenu(song.id);
            if (playlistData.length === 0) await fetchPlaylists();
        }
    };

    return (
        <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400">Loading songs...</p>
                </div>
            ) : songs.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No songs found.</p>
            ) : (
                <ul className="divide-y divide-gray-700">
                    {songs.map((song, index) => (
                        <li
                            key={song.id || index}
                            className="py-4 px-4 flex items-center space-x-4 hover:bg-gray-700/30 rounded-lg transition-all duration-200"
                        >
                            <div
                                onClick={() => playSong(song)}
                                className="flex-1 flex items-center space-x-4 cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-lg overflow-hidden">
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
                                <span>{song.title}</span>
                                {currentSong?.title === song.title && (
                                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                )}
                            </div>
                            <div className="relative" ref={(el) => (menuRefs.current[song.id] = el)}>
                                <button
                                    onClick={(e) => toggleMenu(e, song)}
                                    className="p-2 hover:bg-gray-700/50 rounded-full transition-all"
                                    aria-label="Add to playlist"
                                >
                                    <Plus size={20} className="text-gray-400" />
                                </button>
                                
                                {activeSongMenu === song.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-700">
                                        {loadingPlaylists ? (
                                            <div className="px-4 py-2 text-gray-400 flex items-center justify-center">
                                                <Loader className="w-4 h-4 animate-spin mr-2" />
                                                Loading...
                                            </div>
                                        ) : playlistData.length === 0 ? (
                                            <p className="px-4 py-2 text-gray-400">No playlists available</p>
                                        ) : (
                                            playlistData.map((playlist) => (
                                                <button
                                                    key={playlist.id}
                                                    onClick={(e) => handleAddToPlaylist(song, playlist.id, e)}
                                                    className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-all text-gray-200"
                                                >
                                                    {playlist.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SongList;
