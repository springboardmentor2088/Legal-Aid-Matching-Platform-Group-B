import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiUser, FiBriefcase, FiHeart, FiArrowRight } from 'react-icons/fi';

const RoleSelection = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

    useEffect(() => {
        if (!token || !email) {
            // If relevant params are missing, maybe redirect to login or show error
            console.warn("Missing pre-registration parameters");
            // navigate('/login'); // Optional: redirect back if invalid
        }
    }, [token, email, navigate]);

    const handleSelectRole = (role) => {
        let path = '';
        switch (role) {
            case 'CITIZEN':
                path = '/register-citizen';
                break;
            case 'LAWYER':
                path = '/register-lawyer';
                break;
            case 'NGO':
                path = '/register-ngo';
                break;
            default:
                return;
        }

        // Navigate to registration with state
        navigate(path, {
            state: {
                preRegToken: token,
                preFilledEmail: email,
                preFilledName: name,
                isSocialLogin: true
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Welcome to Jurify
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Finish setting up your account by selecting your role.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-4xl px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Citizen Card */}
                    <div
                        onClick={() => handleSelectRole('CITIZEN')}
                        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-primary/40 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <FiUser />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Citizen</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Find legal help, consult lawyers, and access legal resources for free.
                        </p>
                        <div className="mt-auto flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Continue as Citizen <FiArrowRight className="ml-2" />
                        </div>
                    </div>

                    {/* Lawyer Card */}
                    <div
                        onClick={() => handleSelectRole('LAWYER')}
                        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-primary/40 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <FiBriefcase />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Lawyer</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Join the directory, manage appointments, and grow your legal practice.
                        </p>
                        <div className="mt-auto flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Continue as Lawyer <FiArrowRight className="ml-2" />
                        </div>
                    </div>

                    {/* NGO Card */}
                    <div
                        onClick={() => handleSelectRole('NGO')}
                        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 cursor-pointer border-2 border-transparent hover:border-primary/20 dark:hover:border-primary/40 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">
                            <FiHeart />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">NGO</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                            Connect with beneficiaries, manage legal aid cases, and expand your reach.
                        </p>
                        <div className="mt-auto flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Continue as NGO <FiArrowRight className="ml-2" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        You are signing in as <span className="font-semibold text-gray-900 dark:text-white">{email}</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
