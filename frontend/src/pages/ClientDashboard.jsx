import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

const ClientDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalProposals: 0,
    pendingProposals: 0,
  });

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchStats();
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const response = await api.get("/client/stats");

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching client stats:", error);

      if (error.response?.status === 401) {
        setError("Authentication failed. Please login again.");
      } else {
        setError(error.message || "Failed to fetch stats");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);

      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/client/jobs', { params });

      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(error.message || "Failed to fetch jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job?')) return;

    try {
      const response = await api.delete(`/client/jobs/${jobId}`);
      
      if (response.data.success) {
        alert('Job closed successfully');
        fetchJobs(); 
        fetchStats();
      }
    } catch (error) {
      console.error('Error closing job:', error);
      alert(error.response?.data?.message || 'Failed to close job');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name}
              </h1>
              <p className="text-gray-500 mt-1">Here's what's happening with your projects</p>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/client/post-job"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post New Job
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid - Cleaner Design */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Total Jobs */}
          <motion.div
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors"
            variants={itemVariants}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? "—" : stats.totalJobs || 0}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Active Jobs */}
          <motion.div
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
            variants={itemVariants}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Jobs</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {loading ? "—" : stats.activeJobs || 0}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Total Proposals */}
          <motion.div
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors"
            variants={itemVariants}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Proposals</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {loading ? "—" : stats.totalProposals || 0}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Pending Proposals */}
          <motion.div
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 transition-colors"
            variants={itemVariants}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {loading ? "—" : stats.pendingProposals || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Jobs Section */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Jobs</h2>
                <p className="text-sm text-gray-500 mt-1">Manage and track your job postings</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <motion.button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    filter === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  All
                </motion.button>
                <motion.button
                  onClick={() => setFilter('OPEN')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    filter === 'OPEN' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  Open
                </motion.button>
                <motion.button
                  onClick={() => setFilter('CLOSED')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    filter === 'CLOSED' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  Closed
                </motion.button>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="p-6">
            {jobsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="mt-4 text-gray-500">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {filter === 'all' ? 'No jobs posted yet' : `No ${filter.toLowerCase()} jobs`}
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {filter === 'all' 
                    ? 'Get started by posting your first job and connect with talented freelancers.'
                    : `You don't have any ${filter.toLowerCase()} jobs at the moment.`
                  }
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/client/post-job"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post Your First Job
                  </Link>
                </motion.div>
              </div>
            ) : (
              /* Jobs List */
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                    >
                      {/* Job Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 flex-1">
                              {job.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              job.status === 'OPEN' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {job.overview || job.description}
                          </p>
                        </div>
                      </div>

                      {/* Job Meta Info */}
                      <div className="flex flex-wrap gap-4 text-sm mb-4">
                        <div className="flex items-center text-gray-600">
                          <span className="font-medium">{job.category}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <span>{job.project_type}</span>
                        </div>

                        {job.project_type === 'Fixed Price' && job.fixed_budget && (
                          <div className="flex items-center text-gray-900 font-semibold">
                            ${parseFloat(job.fixed_budget).toLocaleString()}
                          </div>
                        )}

                        {job.project_type === 'Hourly' && job.hourly_min && job.hourly_max && (
                          <div className="flex items-center text-gray-900 font-semibold">
                            ${job.hourly_min} - ${job.hourly_max}/hr
                          </div>
                        )}

                        <div className="flex items-center text-blue-600 font-medium">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {job.proposal_count || 0} Proposals
                        </div>

                        {job.deadline && (
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.required_skills.slice(0, 6).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.required_skills.length > 6 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{job.required_skills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer - Actions and Date */}
                      <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Posted {new Date(job.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>

                        <div className="flex items-center gap-2">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                              to={`/client/jobs/${job.id}/proposals`}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Proposals
                            </Link>
                          </motion.div>

                          {job.status === 'OPEN' && (
                            <>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link
                                  to={`/client/jobs/${job.id}/edit`}
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                  Edit
                                </Link>
                              </motion.div>

                              <motion.button
                                onClick={() => handleDeleteJob(job.id)}
                                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors font-medium"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Close
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;