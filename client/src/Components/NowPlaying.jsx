import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat , Music2 } from 'lucide-react';

const NowPlaying = ({ 
    currentSong, 
    isPlaying, 
    togglePlay, 
    playPreviousSong, 
    playNextSong, 
    currentTime, 
    duration, 
    handleTimeChange, 
    volume, 
    handleVolumeChange, 
    isMuted, 
    toggleMute, 
    isLooping, 
    toggleLoop 
}) => {
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
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
    );
};

export default NowPlaying;