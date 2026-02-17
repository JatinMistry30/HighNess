import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Briefcase, FileText, Users, Home as HomeIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  //Check if the user is logged in
  const isLoggedIn = localStorage.getItem("isAuthenticated");
  const userRole = localStorage.getItem("userRole"); // Assuming role is stored in localStorage

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    logout();
    // Redirect to home
    navigate("/login");
    setIsMenuOpen(false);
  };

  // Helper function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Animation variants
  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <motion.nav
        className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HighNess
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1 items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/"
                  className={`transition px-4 py-2 rounded-lg font-medium ${
                    isActive("/")
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  Home
                </Link>
              </motion.div>

              {isLoggedIn ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/dashboard"
                      className={`transition px-4 py-2 rounded-lg font-medium ${
                        isActive("/dashboard")
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      Dashboard
                    </Link>
                  </motion.div>

                  {/* Browse Jobs - visible to all authenticated users */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/dashboard"
                      className={`transition px-4 py-2 rounded-lg font-medium ${
                        isActive("/dashboard")
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      Browse Jobs
                    </Link>
                  </motion.div>

                  {/* Client-specific links */}
                  {userRole === "CLIENT" && (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          to="/client/post-job"
                          className={`transition px-4 py-2 rounded-lg font-medium ${
                            isActive("/client/post-job")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                        >
                          Post Job
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          to="/dashboard"
                          className={`transition px-4 py-2 rounded-lg font-medium ${
                            isActive("/dashboard")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                        >
                          My Jobs
                        </Link>
                      </motion.div>
                    </>
                  )}

                  {/* Freelancer-specific links */}
                  {userRole === "FREELANCER" && (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          to="/dashboard"
                          className={`transition px-4 py-2 rounded-lg font-medium ${
                            isActive("/dashboard")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                        >
                          My Proposals
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          to="/dashboard"
                          className={`transition px-4 py-2 rounded-lg font-medium ${
                            isActive("/dashboard")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                        >
                          My Contracts
                        </Link>
                      </motion.div>
                    </>
                  )}

                  <motion.button
                    onClick={handleLogout}
                    className="ml-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className={`transition px-4 py-2 rounded-lg font-medium ${
                        isActive("/login")
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      Login
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-sm"
                    >
                      Register
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <motion.button
                onClick={toggleMenu}
                className="text-gray-700 hover:text-blue-600 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition"
                whileTap={{ scale: 0.9 }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>

          {/* Mobile navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="md:hidden overflow-hidden"
                variants={mobileMenuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="flex flex-col space-y-2 pb-4">
                  <motion.div
                    custom={0}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      to="/"
                      className={`transition px-4 py-2 rounded-lg block font-medium ${
                        isActive("/")
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                  </motion.div>

                  {isLoggedIn ? (
                    <>
                      <motion.div
                        custom={1}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          to="/dashboard"
                          className={`transition px-4 py-2 rounded-lg block font-medium ${
                            isActive("/dashboard")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      </motion.div>

                      {/* Browse Jobs - visible to all authenticated users */}
                      <motion.div
                        custom={2}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          to="/dashboard"
                          className={`transition px-4 py-2 rounded-lg block font-medium ${
                            isActive("/dashboard")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Browse Jobs
                        </Link>
                      </motion.div>

                      {/* Client-specific mobile links */}
                      {userRole === "CLIENT" && (
                        <>
                          <motion.div
                            custom={3}
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <Link
                              to="/client/post-job"
                              className={`transition px-4 py-2 rounded-lg block font-medium ${
                                isActive("/client/post-job")
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Post Job
                            </Link>
                          </motion.div>
                          <motion.div
                            custom={4}
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <Link
                              to="/dashboard"
                              className={`transition px-4 py-2 rounded-lg block font-medium ${
                                isActive("/dashboard")
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              My Jobs
                            </Link>
                          </motion.div>
                        </>
                      )}

                      {/* Freelancer-specific mobile links */}
                      {userRole === "FREELANCER" && (
                        <>
                          <motion.div
                            custom={3}
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <Link
                              to="/dashboard"
                              className={`transition px-4 py-2 rounded-lg block font-medium ${
                                isActive("/dashboard")
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              My Proposals
                            </Link>
                          </motion.div>
                          <motion.div
                            custom={4}
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <Link
                              to="/dashboard"
                              className={`transition px-4 py-2 rounded-lg block font-medium ${
                                isActive("/dashboard")
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              My Contracts
                            </Link>
                          </motion.div>
                        </>
                      )}

                      <motion.div
                        custom={5}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <button
                          onClick={handleLogout}
                          className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-left font-medium"
                        >
                          Logout
                        </button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        custom={1}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          to="/login"
                          className={`transition px-4 py-2 rounded-lg block font-medium ${
                            isActive("/login")
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Login
                        </Link>
                      </motion.div>
                      <motion.div
                        custom={2}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          to="/register"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition block font-medium text-center"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                HighNess
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connect with top talent or find your next opportunity. Building amazing experiences for freelancers and clients.
              </p>
              <div className="flex gap-4 mt-6">
                <motion.a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </motion.a>
                <motion.a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </motion.a>
                <motion.a
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </motion.a>
              </div>
            </motion.div>

            {/* For Clients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="text-lg font-bold mb-4">For Clients</h3>
              <ul className="space-y-3">
                {isLoggedIn && userRole === "CLIENT" ? (
                  <>
                    <li>
                      <Link
                        to="/client/post-job"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        Post a Job
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dashboard"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        My Jobs
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/register"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        Hire Talent
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/register"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        Post Jobs
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                  >
                    <motion.span
                      className="inline-block mr-2"
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.span>
                    How It Works
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* For Freelancers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <h3 className="text-lg font-bold mb-4">For Freelancers</h3>
              <ul className="space-y-3">
                {isLoggedIn && userRole === "FREELANCER" ? (
                  <>
                    <li>
                      <Link
                        to="/dashboard"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        Browse Jobs
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dashboard"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        My Proposals
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dashboard"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        My Contracts
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/register"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        Find Work
                      </Link>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                      >
                        <motion.span
                          className="inline-block mr-2"
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                        Success Stories
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </motion.div>

            {/* Company & Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/"
                    className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                  >
                    <motion.span
                      className="inline-block mr-2"
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.span>
                    About Us
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                  >
                    <motion.span
                      className="inline-block mr-2"
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.span>
                    Contact Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                  >
                    <motion.span
                      className="inline-block mr-2"
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.span>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition text-sm flex items-center group"
                  >
                    <motion.span
                      className="inline-block mr-2"
                      whileHover={{ x: 5 }}
                    >
                      →
                    </motion.span>
                    Terms of Service
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Contact Bar */}
          <motion.div
            className="border-t border-gray-800 mt-8 pt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center md:justify-start">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400 text-sm">info@highness.com</span>
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-400 text-sm">+1 234 567 8900</span>
              </div>
              <div className="flex items-center justify-center md:justify-end">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400 text-sm">123 Street, City, Country</span>
              </div>
            </div>
          </motion.div>

          {/* Copyright */}
          <motion.div
            className="border-t border-gray-800 pt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} HighNess. All rights reserved. Made with ❤️
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;