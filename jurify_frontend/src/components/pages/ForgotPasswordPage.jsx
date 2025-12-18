import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import Logo from '../common/Logo';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authService.forgotPassword(email);
            setSubmitted(true);
            setError('');
        } catch (err) {
            setError(err.response?.data || 'Failed to send reset email');
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center">
                    <Logo className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                    <p className="text-gray-600 mb-6">
                        We have sent a password reset link to <strong>{email}</strong>.
                    </p>
                    <Link to="/login" className="text-primary hover:underline font-semibold">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    <Logo className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
                    <p className="text-gray-500 mt-2">Enter your email to receive a reset link.</p>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                            placeholder="Enter your email"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary/90 transition bg-[#11676a]"
                    >
                        Send Reset Link
                    </button>
                </form>
                <div className="text-center">
                    <Link to="/login" className="text-sm text-gray-500 hover:text-primary transition">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
