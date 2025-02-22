import { useState, useEffect } from 'react';
import { Loader, Mail, KeyRound, Music2, User, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Auth = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [step, setStep] = useState(1); // 1: Initial, 2: OTP, 3: Complete Registration
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check for existing JWT token on component mount
        const token = localStorage.getItem('jstream_token');
        if (token) {
            verifyToken(token);
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            const response = await fetch('https://music-app-2-0.onrender.com//verify-token', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.valid) {
                onLogin(data.user_id, data.user_name);
            } else {
                localStorage.removeItem('jstream_token');
            }
        } catch (error) {
            localStorage.removeItem('jstream_token');
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleRegistration = async () => {
        if (!validateEmail(email)) {
            toast.error('Please enter a valid email');
            return;
        }
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (!name) {
            toast.error('Please enter your name');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('https://music-app-2-0.onrender.com//register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password }),
            });
            const data = await response.json();
            
            if (data.message) {
                toast.success('Registration started! Please verify your email.');
                setStep(2);
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (error) {
            toast.error('Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!validateEmail(email)) {
            toast.error('Please enter a valid email');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('https://music-app-2-0.onrender.com//send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
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
            const response = await fetch('https://music-app-2-0.onrender.com//verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    otp,
                    isRegistering
                }),
            });
            const data = await response.json();
            
            if (data.token) {
                localStorage.setItem('jstream_token', data.token);
                toast.success(isRegistering ? 'Registration successful!' : 'Login successful!');
                onLogin(data.user_id, data.user_name);
            } else {
                toast.error('Invalid OTP');
            }
        } catch (error) {
            toast.error('Verification failed');
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
                        {step === 1 ? (isRegistering ? 'Create your account' : 'Sign in to your account') : 
                         step === 2 ? 'Enter the OTP sent to your email' : 'Complete your registration'}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">
                            {step === 1 ? (isRegistering ? 'Starting registration...' : 'Sending OTP...') :
                             'Verifying OTP...'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {step === 1 && (
                            <>
                                {isRegistering && (
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
                                )}
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {isRegistering && (
                                    <>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                            <input
                                                type="password"
                                                placeholder="Create password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                            <input
                                                type="password"
                                                placeholder="Confirm password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </>
                                )}
                                <button
                                    onClick={isRegistering ? handleRegistration : handleLogin}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full transition-all flex items-center justify-center gap-2"
                                >
                                    {isRegistering ? <User size={18} /> : <Mail size={18} />}
                                    {isRegistering ? 'Register' : 'Send OTP'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsRegistering(!isRegistering);
                                        setPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className="w-full text-gray-400 hover:text-gray-300 py-2 transition-all text-sm"
                                >
                                    {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
                                </button>
                            </>
                        )}
                        
                        {step === 2 && (
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
                                    Back to {isRegistering ? 'registration' : 'login'}
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