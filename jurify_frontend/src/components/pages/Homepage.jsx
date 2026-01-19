import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/Logo";
import {
  FaHome, FaInfoCircle, FaTools, FaPhone,
  FaFileAlt, FaComments, FaChartBar, FaSearch, FaUserShield, FaUsers,
  FaCompass, FaBalanceScale, FaGlobe
} from "react-icons/fa";
import legalBg from '../../assets/legal_bg.jpg';
import DarkModeToggle from "../common/DarkModeToggle";

export default function HomePage() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900 overflow-x-hidden font-sans transition-colors duration-300">
      {/* Header / Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <Logo />
              </Link>
            </div>

              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="relative flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93] transition-colors group"
                >
                <FaHome /> Home
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[#11676a] transition-all duration-300 group-hover:w-full"></span>
              </button>

              <button
                onClick={() => scrollToSection('about')}
                className="relative flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93] transition-colors group"
              >
                <FaInfoCircle /> About Us
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[#11676a] transition-all duration-300 group-hover:w-full"></span>
              </button>

              <button
                onClick={() => scrollToSection('services')}
                className="relative flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93] transition-colors group"
              >
                <FaTools /> Services
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[#11676a] transition-all duration-300 group-hover:w-full"></span>
              </button>

              <Link
                to="/contact-us"
                className="relative flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93] transition-colors group"
              >
                <FaPhone /> Contact
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-[#11676a] dark:bg-[#198f93] transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <DarkModeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-4">
              <DarkModeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93] focus:outline-none"
              >
                <span className="material-symbols-outlined text-3xl">menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex flex-col space-y-2 p-4">
              <button onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); }} className="text-left text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93]">Home</button>
              <button onClick={() => scrollToSection('about')} className="text-left text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93]">About Us</button>
              <button onClick={() => scrollToSection('services')} className="text-left text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93]">Services</button>
              <Link to="/contact-us" className="text-gray-600 dark:text-gray-300 hover:text-[#11676a] dark:hover:text-[#198f93]">Contact</Link>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <main className="flex-1">
        <div className="p-4">
          <div
            className="flex min-h-[660px] flex-col gap-6 sm:gap-8 rounded-xl 
            items-center justify-center p-6 text-center  bg-cover bg-center"

            style={{
              backgroundImage: `linear-gradient(to right, rgba(17, 103, 106, 0.4), rgba(44, 62, 80, 0.5)), url(${legalBg})`,
            }}

          >
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl sm:text-5xl font-black mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200">
                Access Justice. Anytime. Anywhere.
              </h1>
              <p className="text-slate-200 text-sm sm:text-base">
                Connect with verified pro bono lawyers and NGOs for free legal assistance.
              </p>
            </div>



            {/* CTA Buttons */}
            <div className="flex gap-4 mt-6">
              {!isAuthenticated ? (
                <>
                  {/* Login */}
                  <Link
                    to="/login"
                    className="h-12 px-6 bg-[#11676a] text-white text-base font-semibold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
                  >
                    Login
                  </Link>

                  {/* Register Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setRegisterOpen(!registerOpen)}
                      className="h-12 px-6 bg-white text-[#11676a] border border-[#11676a] text-base font-semibold rounded-xl shadow-md hover:bg-gray-100 active:scale-95 transition-all duration-200 flex items-center justify-center"
                    >
                      Register
                    </button>

                    {registerOpen && (
                      <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                        onMouseLeave={() => setRegisterOpen(false)}>
                        <Link
                          to="/register-citizen"
                          className="flex items-center gap-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-[#e6f4f1] dark:hover:bg-[#11676a]/20 text-gray-700 dark:text-gray-200 transition-colors"
                          onClick={() => setRegisterOpen(false)}
                        >
                          <span className="material-symbols-outlined text-[#11676a]">person</span>
                          Register as Citizen
                        </Link>
                        <Link
                          to="/register-lawyer"
                          className="flex items-center gap-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-[#e6f4f1] dark:hover:bg-[#11676a]/20 text-gray-700 dark:text-gray-200 transition-colors"
                          onClick={() => setRegisterOpen(false)}
                        >
                          <span className="material-symbols-outlined text-[#11676a]">gavel</span>
                          Register as Lawyer
                        </Link>
                        <Link
                          to="/register-ngo"
                          className="flex items-center gap-x-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-[#e6f4f1] dark:hover:bg-[#11676a]/20 text-gray-700 dark:text-gray-200 transition-colors"
                          onClick={() => setRegisterOpen(false)}
                        >
                          <span className="material-symbols-outlined text-[#11676a]">volunteer_activism</span>
                          Register as NGO
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex gap-4">
                  <Link
                    to={
                      user?.role === 'LAWYER' ? '/lawyer/dashboard' :
                        user?.role === 'NGO' ? '/ngo/dashboard' :
                          user?.role === 'ADMIN' ? '/admin/dashboard' :
                            '/citizen/dashboard'
                    }
                    className="h-12 px-6 bg-[#11676a] text-white text-base font-semibold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">dashboard</span>
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="h-12 px-6 bg-white text-red-600 border border-red-200 text-base font-semibold rounded-xl shadow-md hover:bg-red-50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* How It Works */}
        <section className="bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
          <h2 className="text-[#11676a] text-2xl sm:text-3xl font-extrabold px-4 pb-3 tracking-tight">
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 pt-0">
            {/* Card 1 */}
            <div className="relative flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="absolute -top-2 -left-2 bg-[#11676a] text-white text-xs px-2 py-1 rounded-full">1</span>
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-600 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl" title="Upload File">upload_file</span>

              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white text-base font-bold">Submit Case</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Easily upload your case details and documents through our secure portal.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="absolute -top-2 -left-2 bg-[#11676a] text-white text-xs px-2 py-1 rounded-full">2</span>
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">groups</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white text-base font-bold">Get Matched</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Our smart algorithm matches you with the right legal professional or NGO.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="absolute -top-2 -left-2 bg-[#11676a] text-white text-xs px-2 py-1 rounded-full">3</span>
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">forum</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white text-base font-bold">Secure Chat & Scheduling</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Communicate securely and schedule meetings directly on the platform.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="relative flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="absolute -top-2 -left-2 bg-[#11676a] text-white text-xs px-2 py-1 rounded-full">4</span>
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">monitoring</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white text-base font-bold">Track Impact</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Follow the progress of your case and see the difference being made.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- SERVICES SECTION (Moved from ServicePage.jsx) --- */}
        <section id="services" className="bg-gray-50 dark:bg-gray-900 py-16 px-6 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-screen-xl mx-auto text-center">
            {/* Heading */}
            <h2 className="text-[#11676a] dark:text-[#198f93] text-4xl sm:text-5xl font-extrabold mb-6">Our Services</h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg max-w-3xl mx-auto mb-12">
              Jurify empowers citizens, lawyers, and NGOs with tools to simplify legal access, foster collaboration, and drive measurable social impact.
            </p>

            {/* Service Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaFileAlt className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Case Submission</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Upload legal issues securely and get matched with the right legal expert.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaComments className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Secure Communication</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Chat, schedule, and collaborate with lawyers and NGOs in a safe environment.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaChartBar className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Impact Tracking</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Monitor case progress and measure community-level legal impact.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaSearch className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Legal Aid Discovery</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Browse verified lawyers and NGOs based on location, expertise, and availability.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaUserShield className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Pro Bono Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Lawyers and NGOs manage cases, track hours, and report outcomes.
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaUsers className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Community Legal Hub</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Citizens access legal guides, FAQs, and community support forums.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- ABOUT US SECTION (Moved from AboutPage.jsx) --- */}
        <section id="about" className="bg-white dark:bg-gray-800 py-16 px-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-screen-xl mx-auto text-center">
            {/* Heading */}
            <h2 className="text-[#11676a] dark:text-[#198f93] text-4xl sm:text-5xl font-extrabold mb-6">About Us</h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg max-w-3xl mx-auto mb-12">
              Jurify was founded with a simple mission: to make justice accessible to everyone, anytime, anywhere.
              We connect citizens with verified pro bono lawyers and NGOs, ensuring that legal support is not a privilege but a right.
              Our platform is built on trust, transparency, and technology — empowering communities to resolve disputes, seek guidance, and protect their rights without financial barriers.
            </p>

            {/* Mission, Values, Vision Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaCompass className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Our Mission</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  To bridge the gap between citizens, lawyers, and NGOs through a secure, transparent platform.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaBalanceScale className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Our Values</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Integrity, inclusivity, and innovation guide every step of our journey.
                </p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1">
                <FaGlobe className="text-[#11676a] dark:text-[#198f93] text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-[#11676a] dark:text-[#198f93] mb-2">Our Vision</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  A world where justice is accessible to all, regardless of background or income.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-gray-50 dark:bg-gray-900 py-8 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <h2 className="text-[#11676a] dark:text-[#198f93] text-2xl sm:text-3xl font-extrabold px-4 pb-3 tracking-tight">
            Why Choose Us
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 pt-0">
            {/* Card 1 */}
            <div className="flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 
                       group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">balance</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">
                  Trusted lawyers from Bar Council
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Verified professionals from the Bar Council of India.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 
                       group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">verified</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">
                  Verified NGOs from NGO Darpan
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Registered and verified through the NGO Darpan portal.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 
                       group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">price_check</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">
                  Zero-cost legal consultation
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Access to legal advice and support completely free of charge.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col gap-3 border rounded-xl p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 
                       group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">lock</span>
              </span>
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold">
                  Data privacy & secure communication
                </h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm">
                  Secure communication and strict data privacy protocols.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-10 px-6 border-t border-gray-700">
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm text-center sm:text-left">

          {/* Column 1: Brand */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Jurify</h3>
            <p className="text-gray-300">
              Justice simplifies. Connected. Empowering communities through legal access, transparency, and collaboration.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => scrollToSection('about')} className="hover:underline text-left">About</button>
              <a href="/contact-us" className="hover:underline text-left">Contact</a>
              <a href="/admin" className="hover:underline text-left">Admin Login</a>
            </div>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Reach Us</h3>
            <p className="text-gray-300">support@jurify.org</p>
            <p className="text-gray-300">Chennai, India</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} JURIFY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}