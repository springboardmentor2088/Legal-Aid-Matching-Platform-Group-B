import React from "react";
import { FaCompass, FaBalanceScale, FaGlobe } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function AboutPage() {
    return (
        <div className="bg-gray-50 py-16 px-6">
            <div className="max-w-screen-xl mx-auto text-center">
                {/* Heading */}
                <h1 className="text-[#11676a] text-5xl font-extrabold mb-6">About Us</h1>
                <p className="text-gray-700 text-lg max-w-3xl mx-auto mb-12">
                    Jurify was founded with a simple mission: to make justice accessible to everyone, anytime, anywhere.
                    We connect citizens with verified pro bono lawyers and NGOs, ensuring that legal support is not a privilege but a right.
                    Our platform is built on trust, transparency, and technology — empowering communities to resolve disputes, seek guidance, and protect their rights without financial barriers.
                </p>

                {/* Mission, Values, Vision Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Mission */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaCompass className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Our Mission</h3>
                        <p className="text-gray-600 text-sm">
                            To bridge the gap between citizens, lawyers, and NGOs through a secure, transparent platform.
                        </p>
                    </div>

                    {/* Values */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaBalanceScale className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Our Values</h3>
                        <p className="text-gray-600 text-sm">
                            Integrity, inclusivity, and innovation guide every step of our journey.
                        </p>
                    </div>

                    {/* Vision */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaGlobe className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Our Vision</h3>
                        <p className="text-gray-600 text-sm">
                            A world where justice is accessible to all, regardless of background or income.
                        </p>
                    </div>
                </div>

                {/* CTA Button → Home */}
                <div className="mt-12">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-[#11676a] text-white rounded-lg shadow hover:bg-[#0e5c5f] transition"
                    >
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}