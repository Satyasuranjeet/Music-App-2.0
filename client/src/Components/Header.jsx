import { Search } from 'lucide-react';

const Header = ({ searchQuery, setSearchQuery, handleSearch }) => {
    return (
        <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                JStream
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
    );
};

export default Header;