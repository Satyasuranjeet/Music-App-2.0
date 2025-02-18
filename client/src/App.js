import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Auth from './Components/Auth';
import NavBar from './Components/NavBar';
import Playlists from './Components/Playlists';
import MusicPlayer from './Components/MusicPlayer';

const App = () => {
    const [userId, setUserId] = useState(null);
    const [userName, setUserName] = useState(null);

    const handleLogin = (id, name) => {
        setUserId(id);
        setUserName(name);
    };

    const handleLogout = () => {
        setUserId(null);
        setUserName(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1f2937',
                        color: '#fff',
                    },
                }}
            />
            <NavBar userName={userName} onLogout={handleLogout} />
            <main className="p-8">
                {!userId ? (
                    <Auth onLogin={handleLogin} />
                ) : (
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <MusicPlayer userId={userId} />
                            </div>
                            <div>
                                <Playlists userId={userId} onPlaySong={(song) => {
                                    // Logic to play the song
                                }} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;