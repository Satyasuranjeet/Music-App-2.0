import { Music2, User, LogOut, RadioTower } from 'lucide-react';

const NavBar = ({ userName, onLogout }) => {
    const openBroadcast = () => {
        window.open('https://broadcast-music.onrender.com/', '_blank');
    };

    return (
        <nav className="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700 py-4 px-8 mb-8">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Music2 className="text-blue-500" size={28} />
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        JStream
                    </h1>
                </div>
                
                <div className="flex items-center gap-4">
                    
                    
                    {userName && (
                        <>
                            <div className="flex items-center gap-2">
                                <User size={20} className="text-gray-400" />
                                <span className="text-gray-300">Hi, {userName}!</span>
                            </div>
                            <button
                        onClick={openBroadcast}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                    >
                        <RadioTower size={18}/>
                        Broadcast
                    </button>
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default NavBar;