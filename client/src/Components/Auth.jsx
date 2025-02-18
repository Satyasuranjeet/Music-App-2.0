import { useState } from 'react';
import { Loader, Mail, KeyRound, Music2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Auth = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Enter name and email, 2: Enter OTP
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async () => {
        if (!email) {
            toast.error('Please enter your email');
            return;
        }
        
        if (!name) {
            toast.error('Please enter your name');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('https://music-app-2-0.vercel.app/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name }),
            });
            const data = await response.json();
            if (data.message) {
                toast.success('OTP sent successfully!');
                setStep(2);
            } else {
                toast.error('Failed to send OTP');
            }
        } catch (error) {
            toast.error('Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) {
            toast.error('Please enter the OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('https://music-app-2-0.vercel.app/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await response.json();
            if (data.user_id && data.user_name) {
                toast.success('Login successful!');
                onLogin(data.user_id, data.user_name);
            } else {
                toast.error('Invalid OTP');
            }
        } catch (error) {
            toast.error('Failed to verify OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center p-8">
            <div className="bg-gray-800/30 rounded-xl p-8 backdrop-blur-sm border border-gray-700 max-w-md w-full">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <Music2 className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                        Welcome to JStream
                    </h2>
                    <p className="text-gray-400 text-center mt-2">
                        {step === 1 ? 'Enter your details to get started' : 'Enter the OTP sent to your email'}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">
                            {step === 1 ? 'Sending OTP...' : 'Verifying OTP...'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {step === 1 ? (
                            <>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                                    />
                                </div>
                                <button
                                    onClick={handleSendOtp}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full transition-all flex items-center justify-center gap-2"
                                >
                                    <Mail size={18} />
                                    Send OTP
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                                    />
                                </div>
                                <button
                                    onClick={handleVerifyOtp}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full transition-all flex items-center justify-center gap-2"
                                >
                                    <KeyRound size={18} />
                                    Verify OTP
                                </button>
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setOtp('');
                                    }}
                                    className="w-full text-gray-400 hover:text-gray-300 py-2 transition-all text-sm"
                                >
                                    Back to enter details
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;