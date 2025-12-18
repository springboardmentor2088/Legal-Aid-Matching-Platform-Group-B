import React from "react";
import { FaFileAlt, FaComments, FaChartBar, FaSearch, FaUserShield, FaUsers } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function ServicesPage() {
    return (
        <div className="bg-gray-50 py-16 px-6">
            <div className="max-w-screen-xl mx-auto text-center">
                {/* Heading */}
                <h1 className="text-[#11676a] text-5xl font-extrabold mb-6">Our Services</h1>
                <p className="text-gray-700 text-lg max-w-3xl mx-auto mb-12">
                    Jurify empowers citizens, lawyers, and NGOs with tools to simplify legal access, foster collaboration, and drive measurable social impact.
                </p>

                {/* Service Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Service 1 */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaFileAlt className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Case Submission</h3>
                        <p className="text-gray-600 text-sm">
                            Upload legal issues securely and get matched with the right legal expert.
                        </p>
                    </div>

                    {/* Service 2 */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaComments className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Secure Communication</h3>
                        <p className="text-gray-600 text-sm">
                            Chat, schedule, and collaborate with lawyers and NGOs in a safe environment.
                        </p>
                    </div>

                    {/* Service 3 */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaChartBar className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Impact Tracking</h3>
                        <p className="text-gray-600 text-sm">
                            Monitor case progress and measure community-level legal impact.
                        </p>
                    </div>

                    {/* Service 4 */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaSearch className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Legal Aid Discovery</h3>
                        <p className="text-gray-600 text-sm">
                            Browse verified lawyers and NGOs based on location, expertise, and availability.
                        </p>
                    </div>

                    {/* Service 5 */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaUserShield className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Pro Bono Dashboard</h3>
                        <p className="text-gray-600 text-sm">
                            Lawyers and NGOs manage cases, track hours, and report outcomes.
                        </p>
                    </div>

                    {/* Service 6 */}
                    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                        <FaUsers className="text-[#11676a] text-4xl mb-4 mx-auto" />
                        <h3 className="text-xl font-bold text-[#11676a] mb-2">Community Legal Hub</h3>
                        <p className="text-gray-600 text-sm">
                            Citizens access legal guides, FAQs, and community support forums.
                        </p>
                    </div>
                </div>

                {/* CTA Button */}
                <div className="mt-12">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-[#11676a] text-white rounded-lg shadow hover:bg-[#0e5c5f] transition"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </div>
    );
}