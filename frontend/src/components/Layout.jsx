import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, Briefcase, FileText, Users, Home as HomeIcon,
  LayoutDashboard, Search, PlusCircle, ScrollText,
  FolderKanban, LogOut, ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = localStorage.getItem("isAuthenticated");
  const userRole = localStorage.getItem("userRole");

  const { logout } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Nav link configs
  const publicLinks = [
    { to: "/", label: "Home", icon: <HomeIcon size={16} /> },
  ];

  const sharedAuthLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/dashboard", label: "Browse Jobs", icon: <Search size={16} /> },
    { to: "/workspace", label: "Workspace", icon: <FolderKanban size={16} /> },
  ];

  const clientLinks = [
    { to: "/client/post-job", label: "Post Job", icon: <PlusCircle size={16} /> },
    { to: "/dashboard", label: "My Jobs", icon: <Briefcase size={16} /> },
  ];

  const freelancerLinks = [
    { to: "/dashboard", label: "My Proposals", icon: <ScrollText size={16} /> },
    { to: "/dashboard", label: "My Contracts", icon: <FileText size={16} /> },
  ];

  const roleLinks = userRole === "CLIENT" ? clientLinks : userRole === "FREELANCER" ? freelancerLinks : [];

  const NavLink = ({ to, label, icon, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive(to) && to !== "/dashboard"
          ? "text-blue-600 bg-blue-50"
          : isActive(to)
          ? "text-blue-600 bg-blue-50"
          : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
      }`}
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </Link>
  );

  const roleBadgeColor = userRole === "CLIENT"
    ? "bg-violet-100 text-violet-700"
    : "bg-emerald-100 text-emerald-700";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-extrabold tracking-tight"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-black">H</span>
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HighNess
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {/* Home always visible */}
              <NavLink to="/" label="Home" icon={<HomeIcon size={16} />} />

              {isLoggedIn ? (
                <>
                  {sharedAuthLinks.map((link) => (
                    <NavLink key={link.label} {...link} />
                  ))}

                  {/* Role-specific divider + links */}
                  {roleLinks.length > 0 && (
                    <>
                      <div className="w-px h-5 bg-gray-200 mx-1" />
                      {roleLinks.map((link) => (
                        <NavLink key={link.label} {...link} />
                      ))}
                    </>
                  )}

                  {/* User pill + logout */}
                  <div className="flex items-center gap-2 ml-3 pl-3 border-l border-gray-200">
                    {userRole && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadgeColor}`}>
                        {userRole}
                      </span>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile: right side */}
            <div className="md:hidden flex items-center gap-2">
              {isLoggedIn && userRole && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
                  {userRole}
                </span>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-gray-100 transition-all"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isMenuOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">

                {/* Home */}
                <MobileNavLink to="/" label="Home" icon={<HomeIcon size={16} />} isActive={isActive("/")} onClick={() => setIsMenuOpen(false)} />

                {isLoggedIn ? (
                  <>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                      General
                    </div>
                    {sharedAuthLinks.map((link) => (
                      <MobileNavLink key={link.label} {...link} isActive={isActive(link.to)} onClick={() => setIsMenuOpen(false)} />
                    ))}

                    {roleLinks.length > 0 && (
                      <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1">
                          {userRole === "CLIENT" ? "Client" : "Freelancer"}
                        </div>
                        {roleLinks.map((link) => (
                          <MobileNavLink key={link.label} {...link} isActive={isActive(link.to)} onClick={() => setIsMenuOpen(false)} />
                        ))}
                      </>
                    )}

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-2 pb-1">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-center py-2.5 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-all"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-center py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
                    >
                      Get Started →
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-black">H</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  HighNess
                </h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connect with top talent or find your next opportunity. Building amazing experiences for freelancers and clients.
              </p>
              <div className="flex gap-3 mt-5">
                {[
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>,
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>,
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                ].map((pathEl, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{pathEl}</svg>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* For Clients */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <h3 className="text-sm font-bold mb-4 text-gray-300 uppercase tracking-wider">For Clients</h3>
              <ul className="space-y-2.5">
                {(isLoggedIn && userRole === "CLIENT" ? [
                  { to: "/client/post-job", label: "Post a Job" },
                  { to: "/dashboard", label: "My Jobs" },
                ] : [
                  { to: "/register", label: "Hire Talent" },
                  { to: "/register", label: "Post Jobs" },
                ]).map(({ to, label }) => (
                  <li key={label}>
                    <Link to={to} className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2 group">
                      <span className="w-4 h-px bg-gray-600 group-hover:w-6 group-hover:bg-blue-400 transition-all duration-300" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li><a href="#" className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2 group"><span className="w-4 h-px bg-gray-600 group-hover:w-6 group-hover:bg-blue-400 transition-all duration-300" />How It Works</a></li>
              </ul>
            </motion.div>

            {/* For Freelancers */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
              <h3 className="text-sm font-bold mb-4 text-gray-300 uppercase tracking-wider">For Freelancers</h3>
              <ul className="space-y-2.5">
                {(isLoggedIn && userRole === "FREELANCER" ? [
                  { to: "/dashboard", label: "Browse Jobs" },
                  { to: "/dashboard", label: "My Proposals" },
                  { to: "/dashboard", label: "My Contracts" },
                ] : [
                  { to: "/register", label: "Find Work" },
                  { to: "#", label: "Success Stories" },
                ]).map(({ to, label }) => (
                  <li key={label}>
                    <Link to={to} className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2 group">
                      <span className="w-4 h-px bg-gray-600 group-hover:w-6 group-hover:bg-blue-400 transition-all duration-300" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
              <h3 className="text-sm font-bold mb-4 text-gray-300 uppercase tracking-wider">Company</h3>
              <ul className="space-y-2.5">
                {[
                  { to: "/", label: "About Us" },
                  { to: "#", label: "Contact Support" },
                  { to: "#", label: "Privacy Policy" },
                  { to: "#", label: "Terms of Service" },
                ].map(({ to, label }) => (
                  <li key={label}>
                    <Link to={to} className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2 group">
                      <span className="w-4 h-px bg-gray-600 group-hover:w-6 group-hover:bg-blue-400 transition-all duration-300" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Contact Bar */}
          <div className="border-t border-gray-800 mt-10 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center md:text-left">
              {[
                { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", text: "info@highness.com" },
                { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", text: "+1 234 567 8900" },
                { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z", text: "123 Street, City, Country" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  <span className="text-gray-400 text-sm">{text}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} HighNess. All rights reserved. Made with ❤️
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Mobile nav link helper
const MobileNavLink = ({ to, label, icon, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "text-blue-600 bg-blue-50"
        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
    }`}
  >
    <span className={`${isActive ? "text-blue-500" : "text-gray-400"}`}>{icon}</span>
    {label}
    {isActive && <span className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />}
  </Link>
);

export default Layout;