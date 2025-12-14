import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Logo from '../common/Logo';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data || 'Failed to reset password');
        }
    };

    if (!token) return <div className="text-center mt-10">Invalid or missing token.</div>;

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center">
                    <Logo className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-green-600">Password Reset Successful!</h2>
                    <p className="text-gray-600 mb-6">You will be redirected to login shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    <Logo className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                            placeholder="New password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                            placeholder="Confirm password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary/90 transition bg-[#11676a]"
                    >
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
