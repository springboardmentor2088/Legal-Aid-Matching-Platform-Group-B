import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const { startLoading, stopLoading } = useGlobalLoader();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsSubmitting(true);
        startLoading("Resetting your password...");

        try {
            await authService.resetPassword(token, password);
            stopLoading(true, "Password reset successful!");
            setIsSuccess(true);
            // Optional: Auto redirect after few seconds
            setTimeout(() => navigate('/login'), 5000);
        } catch (err) {
            stopLoading(false, "Reset failed");
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-outfit">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-600">Invalid Link</h2>
                    <p className="mt-2 text-gray-600">This password reset link is invalid or missing a token.</p>
                    <Link to="/forgot-password" className="mt-4 block font-medium text-[#11676a]">Request a new link</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-outfit">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center text-3xl font-bold text-[#11676a]">
                    Jurify<span className="text-[#a5f3fc]">.</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Set new password
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {isSuccess ? (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Password Reset Successful</h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>Your password has been successfully updated. You can now login with your new password.</p>
                                    </div>
                                    <div className="mt-4">
                                        <Link to="/login" className="text-sm font-medium text-green-700 hover:text-green-600">
                                            Proceed to Login &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400">lock</span>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="focus:ring-[#11676a] focus:border-[#11676a] block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-2"
                                        placeholder="New password"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                        <span className="material-symbols-outlined text-gray-400">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400">lock_reset</span>
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="focus:ring-[#11676a] focus:border-[#11676a] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <span className="material-symbols-outlined text-red-400">error</span>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#11676a] hover:bg-[#0e5255] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#11676a] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
