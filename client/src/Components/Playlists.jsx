import { useState, useEffect, useRef } from 'react';
import {  ChevronRight, Loader, Music2, RefreshCw, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, VolumeX, Trash2, X  } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Playlists = ({ userId, onPlaySong }) => {
    const [playlists, setPlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [expandedPlaylist, setExpandedPlaylist] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlaylist, setCurrentPlaylist] = useState(null);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    useEffect(() => {
        if (userId) {
            fetchPlaylists();
        }
    }, [userId]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(error => {
                    console.error('Playback failed:', error);
                    toast.error('Playback failed. Please try again.');
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    useEffect(() => {
        if (currentPlaylist && currentPlaylist.songs[currentSongIndex] && audioRef.current) {
            audioRef.current.src = currentPlaylist.songs[currentSongIndex].mp3_url;
            if (isPlaying) {
                audioRef.current.play().catch(error => {
                    console.error('Playback failed:', error);
                    toast.error('Playback failed. Please try again.');
                });
            }
        }
    }, [currentSongIndex, currentPlaylist]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);
    const handleDeletePlaylist = async (playlistId, event) => {
        event.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this playlist?')) {
            return;
        }

        try {
            const response = await fetch(`https://music-app-2-0.onrender.com//playlists/${playlistId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            if (response.ok) {
                toast.success('Playlist deleted successfully');
                setPlaylists(playlists.filter(p => p.id !== playlistId));
                if (currentPlaylist?.id === playlistId) {
                    setCurrentPlaylist(null);
                    setIsPlaying(false);
                }
            } else {
                toast.error('Failed to delete playlist');
            }
        } catch (error) {
            toast.error('Error deleting playlist');
        }
    };

    const handleRemoveSong = async (playlistId, songId, event) => {
        event.stopPropagation();
        try {
            const response = await fetch(`https://music-app-2-0.onrender.com//playlists/${playlistId}/remove-song`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    song_id: songId
                }),
            });

            if (response.ok) {
                toast.success('Song removed successfully');
                setPlaylists(playlists.map(playlist => {
                    if (playlist.id === playlistId) {
                        return {
                            ...playlist,
                            songs: playlist.songs.filter(song => song.id !== songId)
                        };
                    }
                    return playlist;
                }));

                if (currentPlaylist?.id === playlistId) {
                    const updatedPlaylist = {
                        ...currentPlaylist,
                        songs: currentPlaylist.songs.filter(song => song.id !== songId)
                    };
                    setCurrentPlaylist(updatedPlaylist);
                    
                    if (currentPlaylist.songs[currentSongIndex].id === songId) {
                        if (updatedPlaylist.songs.length === 0) {
                            setCurrentPlaylist(null);
                            setIsPlaying(false);
                        } else {
                            setCurrentSongIndex(Math.min(currentSongIndex, updatedPlaylist.songs.length - 1));
                        }
                    }
                }
            } else {
                toast.error('Failed to remove song');
            }
        } catch (error) {
            toast.error('Error removing song');
        }
    };

    const fetchPlaylists = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://music-app-2-0.onrender.com//playlists?user_id=${userId}`);
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
            const response = await fetch('https://music-app-2-0.onrender.com//playlists', {
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

    const handlePlaySong = (playlist, songIndex) => {
        setCurrentPlaylist(playlist);
        setCurrentSongIndex(songIndex);
        setIsPlaying(true);
    };

    const handleNextSong = () => {
        if (currentSongIndex < currentPlaylist.songs.length - 1) {
            setCurrentSongIndex(currentSongIndex + 1);
        } else if (isLooping) {
            setCurrentSongIndex(0);
        } else {
            setIsPlaying(false);
        }
    };

    const handlePreviousSong = () => {
        if (currentSongIndex > 0) {
            setCurrentSongIndex(currentSongIndex - 1);
        }
    };

    const handleEnded = () => {
        handleNextSong();
    };

    const toggleMute = () => {
        if (isMuted) {
            setIsMuted(false);
            setVolume(previousVolume);
        } else {
            setPreviousVolume(volume);
            setIsMuted(true);
            setVolume(0);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleDurationChange = () => {
        setDuration(audioRef.current.duration);
    };

    const handleSeek = (e) => {
        const seekTime = parseFloat(e.target.value);
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    };
    return (
        <div className="space-y-6">
            {/* Playlists Container */}
            <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
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
                    <div className="max-h-96 overflow-y-auto pr-2">
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
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700/50 rounded-full transition-all"
                                                title="Delete Playlist"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <ChevronRight
                                                size={20}
                                                className={`text-gray-400 transition-transform ${
                                                    expandedPlaylist === playlist.id ? 'rotate-90' : ''
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    {expandedPlaylist === playlist.id && playlist.songs?.length > 0 && (
                                        <ul className="mt-2 ml-4 space-y-2">
                                            {playlist.songs.map((song, index) => (
                                                <li
                                                    key={song.id}
                                                    className="p-3 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 cursor-pointer transition-all flex items-center justify-between"
                                                >
                                                    <div
                                                        className="flex items-center gap-3 flex-1"
                                                        onClick={() => handlePlaySong(playlist, index)}
                                                    >
                                                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
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
                                                        <span className="text-sm truncate">{song.title}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleRemoveSong(playlist.id, song.id, e)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-700/50 rounded-full ml-2 transition-all"
                                                        title="Remove Song"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Music Player Container */}
            {currentPlaylist && (
                <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                {currentPlaylist.songs[currentSongIndex]?.thumbnail_url ? (
                                    <img
                                        src={currentPlaylist.songs[currentSongIndex].thumbnail_url}
                                        alt={currentPlaylist.songs[currentSongIndex].title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                        <Music2 size={24} className="text-white/50" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">
                                    {currentPlaylist.songs[currentSongIndex]?.title}
                                </h4>
                                <p className="text-sm text-gray-400 truncate">{currentPlaylist.name}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-12 text-right">
                                    {new Date(currentTime * 1000).toISOString().substr(14, 5)}
                                </span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    step="0.01"
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="flex-1 accent-blue-500"
                                />
                                <span className="text-xs text-gray-400 w-12">
                                    {new Date(duration * 1000).toISOString().substr(14, 5)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsLooping(!isLooping)}
                                        className={`p-2 rounded-full hover:bg-gray-700/50 ${
                                            isLooping ? 'text-blue-500' : 'text-gray-400'
                                        }`}
                                    >
                                        <Repeat size={20} />
                                    </button>
                                    <button
                                        onClick={handlePreviousSong}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
                                    >
                                        <SkipBack size={20} />
                                    </button>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white"
                                    >
                                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                    </button>
                                    <button
                                        onClick={handleNextSong}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
                                    >
                                        <SkipForward size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={toggleMute}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full"
                                    >
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-10 accent-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <audio
                        ref={audioRef}
                        onEnded={handleEnded}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleDurationChange}
                        autoPlay
                        style={{ display: 'none' }}
                    />
                </div>
            )}
        </div>
    );
};

export default Playlists;