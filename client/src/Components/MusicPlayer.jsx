import { useState, useRef, useEffect } from 'react';
import Header from './Header';
import NowPlaying from './NowPlaying';
import SongList from './SongList';

const MusicPlayer = ({userId}) => {
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
        fetch('https://music-app-2-0.onrender.com/songs?query=Believer')
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

    const handleSearch = () => {
        setIsLoading(true);
        fetch(`https://music-app-2-0.onrender.com/songs?query=${encodeURIComponent(searchQuery)}`)
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
                <Header 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    handleSearch={handleSearch} 
                />
                {currentSong && (
                    <NowPlaying 
                        currentSong={currentSong} 
                        isPlaying={isPlaying} 
                        togglePlay={togglePlay} 
                        playPreviousSong={playPreviousSong} 
                        playNextSong={playNextSong} 
                        currentTime={currentTime} 
                        duration={duration} 
                        handleTimeChange={handleTimeChange} 
                        volume={volume} 
                        handleVolumeChange={handleVolumeChange} 
                        isMuted={isMuted} 
                        toggleMute={toggleMute} 
                        isLooping={isLooping} 
                        toggleLoop={toggleLoop} 
                    />
                )}
                <SongList 
                    songs={songs} 
                    isLoading={isLoading} 
                    currentSong={currentSong} 
                    playSong={playSong} 
                    userId={userId}
                />
            </div>
        </div>
    );
};

export default MusicPlayer;