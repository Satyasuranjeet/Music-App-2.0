import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Search, Music2, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Loader } from 'lucide-react';

const MusicPlayer = () => {
    const [songs, setSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const nextButtonRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = volume;
        audioRef.current.loop = isLooping;

        // Initial song fetch with default query
        setIsLoading(true);
        fetch('http://localhost:5000/songs?query=Believer')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                setSongs(data);
            })
            .catch(error => {
                console.error('Error fetching songs:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        
        const handleEnded = () => {
            if (isLooping) {
                audio.currentTime = 0;
                audio.play().catch(console.error);
            } else {
                nextButtonRef.current?.click();
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [isLooping]);

    const loadAndPlaySong = async (song) => {
        if (!song) return;
        
        try {
            audioRef.current.src = song.mp3_url;
            setCurrentSong(song);
            
            await audioRef.current.load();
            
            if (hasInteracted) {
                await audioRef.current.play();
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
            }
        } catch (error) {
            console.error("Error playing song:", error);
            setIsPlaying(false);
        }
    };

    const playSong = (song) => {
        setHasInteracted(true);
        loadAndPlaySong(song);
    };

    const togglePlay = async () => {
        try {
            if (!currentSong) {
                if (songs.length > 0) {
                    await loadAndPlaySong(songs[0]);
                }
                return;
            }

            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error("Error toggling play:", error);
        }
    };

    const playNextSong = () => {
        if (songs.length === 0 || !currentSong) return;
        
        const currentIndex = songs.findIndex(song => song.title === currentSong.title);
        const nextIndex = (currentIndex + 1) % songs.length;
        loadAndPlaySong(songs[nextIndex]);
    };

    const playPreviousSong = () => {
        if (songs.length === 0 || !currentSong) return;
        
        const currentIndex = songs.findIndex(song => song.title === currentSong.title);
        const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
        loadAndPlaySong(songs[previousIndex]);
    };

    const handleTimeChange = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        audioRef.current.currentTime = time;
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        audioRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            audioRef.current.volume = volume;
        } else {
            audioRef.current.volume = 0;
        }
        setIsMuted(!isMuted);
    };

    const toggleLoop = () => {
        const newLoopState = !isLooping;
        setIsLooping(newLoopState);
        audioRef.current.loop = newLoopState;
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSearch = () => {
        setIsLoading(true);
        fetch(`http://localhost:5000/songs?query=${encodeURIComponent(searchQuery)}`)
            .then(response => response.json())
            .then(data => setSongs(data))
            .catch(error => {
                console.error('Error fetching search results:', error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Sonic Stream
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search tracks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-all flex items-center gap-2"
                        >
                            <Search size={18} />
                            Search
                        </button>
                    </div>
                </div>

                {currentSong && (
                    <div className="mb-8 bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-64 h-64 rounded-lg overflow-hidden">
                                {currentSong.thumbnail_url ? (
                                    <img 
                                        src={currentSong.thumbnail_url} 
                                        alt={currentSong.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                        <Music2 size={64} className="text-white/50" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-2xl font-bold">{currentSong.title}</h3>
                                    <p className="text-gray-400">Now Playing</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration || 100}
                                            value={currentTime}
                                            onChange={handleTimeChange}
                                            className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%)`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button onClick={playPreviousSong} className="p-2 hover:bg-gray-700/50 rounded-full transition-all">
                                            <SkipBack size={24} />
                                        </button>
                                        <button
                                            onClick={togglePlay}
                                            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-all"
                                        >
                                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                                        </button>
                                        <button 
                                            ref={nextButtonRef}
                                            onClick={playNextSong} 
                                            className="p-2 hover:bg-gray-700/50 rounded-full transition-all"
                                        >
                                            <SkipForward size={24} />
                                        </button>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button onClick={toggleMute} className="p-2 hover:bg-gray-700/50 rounded-full transition-all">
                                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="w-24 h-2 bg-gray-700 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #3b82f6 ${volume * 100}%, #374151 ${volume * 100}%)`
                                            }}
                                        />
                                        <button onClick={toggleLoop} className="p-2 hover:bg-gray-700/50 rounded-full transition-all">
                                            <Repeat size={24} className={isLooping ? "text-blue-500" : "text-gray-400"} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur-sm border border-gray-700">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                            <p className="text-gray-400">Loading songs...</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-700">
                            {songs.map((song, index) => (
                                <li
                                    key={index}
                                    onClick={() => playSong(song)}
                                    className="py-4 px-4 flex items-center space-x-4 hover:bg-gray-700/30 rounded-lg cursor-pointer transition-all duration-200"
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
                                    <span className="flex-1">{song.title}</span>
                                    {currentSong?.title === song.title && (
                                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MusicPlayer;