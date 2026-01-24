import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';

export default function ForgotPassword() {
    const { startLoading, stopLoading } = useGlobalLoader();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        startLoading("Sending password reset link...");
        setError('');
        setMessage('');

        try {
            await authService.forgotPassword(email);
            stopLoading(true, "Reset link sent!");
            setMessage('If an account exists with this email, you will receive password reset instructions.');
        } catch (err) {
            stopLoading(false, "Failed to send link");
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-outfit">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center text-3xl font-bold text-[#11676a]">
                    Jurify<span className="text-[#a5f3fc]">.</span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {message ? (
                        <div className="rounded-md bg-green-50 p-4 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{message}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-green-700 hover:text-green-600"
                                >
                                    &larr; Back to login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400">mail</span>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="focus:ring-[#11676a] focus:border-[#11676a] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                                        placeholder="you@example.com"
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
                                    Send reset link
                                </button>
                            </div>
                        </form>
                    )}

                    {!message && (
                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="font-medium text-[#11676a] hover:text-[#0e5255]">
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
