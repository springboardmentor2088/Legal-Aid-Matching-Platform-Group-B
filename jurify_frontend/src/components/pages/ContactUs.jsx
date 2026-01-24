import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useGlobalLoader } from '../../context/GlobalLoaderContext';
import Logo from '../common/Logo';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { startLoading, stopLoading } = useGlobalLoader();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        startLoading("Sending your message...");

        try {
            await api.post('/auth/contact-us', formData);
            stopLoading(true, 'Message sent successfully! We will be in touch.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error("Contact Us Error:", error);
            stopLoading(false, error.response?.data || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo />
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93] font-medium transition">Home</Link>
                        <Link to="/login" className="px-6 py-2.5 bg-[#11676a] text-white rounded-xl font-semibold hover:bg-[#0e5658] transition shadow-lg shadow-[#11676a]/20">
                            Log In
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-6 py-12 flex items-center justify-center">
                <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">

                    {/* Left Side: Info */}
                    <div className="bg-[#11676a] p-12 text-white flex flex-col justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
                            <p className="text-blue-100 mb-8">
                                Have questions about Jurify? Need support? We're here to help. Fill out the form and we'll be in touch shortly.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-2xl">mail</span>
                                    <span>jurify.springboard@gmail.com</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-2xl">phone</span>
                                    <span>+91 1800-JURIFY</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-2xl">location_on</span>
                                    <span>Infosys Springboard, India</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4">
                            {/* Social Icons Placeholders */}
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                                <span className="text-xl font-bold">in</span>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                                <span className="text-xl font-bold">𝕏</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#11676a] dark:focus:border-[#198f93] focus:ring-2 focus:ring-[#11676a]/20 outline-none transition"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#11676a] dark:focus:border-[#198f93] focus:ring-2 focus:ring-[#11676a]/20 outline-none transition"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    required
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#11676a] dark:focus:border-[#198f93] focus:ring-2 focus:ring-[#11676a]/20 outline-none transition"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                                <textarea
                                    name="message"
                                    required
                                    rows="4"
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#11676a] dark:focus:border-[#198f93] focus:ring-2 focus:ring-[#11676a]/20 outline-none transition resize-none"
                                    placeholder="Tell us more..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-[#11676a] text-white rounded-xl font-bold hover:bg-[#0e5658] transition shadow-lg shadow-[#11676a]/30 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                Send Message
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ContactUs;
