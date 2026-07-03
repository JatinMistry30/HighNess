import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Bookmark,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  Search,
  AlertCircle,
  Send,
} from "lucide-react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_applications: 0,
    pending_applications: 0,
    accepted_applications: 0,
    rejected_applications: 0,
    saved_jobs: 0,
    counter_offers: 0,
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [counterResponse, setCounterResponse] = useState("");
  const [contractStatusMap, setContractStatusMap] = useState({});
  const [proposalContractMap, setProposalContractMap] = useState({});

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await api.get("/api-freelancer/dashboard/stats");
      if (response.data.success) {
        setStats({
          total_applications: response.data.stats.total_proposals || 0,
          pending_applications: response.data.stats.pending_proposals || 0,
          accepted_applications: response.data.stats.accepted_proposals || 0,
          rejected_applications: response.data.stats.rejected_proposals || 0,
          saved_jobs: response.data.stats.saved_jobs || 0,
          counter_offers: response.data.stats.counter_offers || 0,
        });
        setRecentApplications(response.data.recent_proposals || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch stats");
      console.error("Failed to fetch dashboard stats:", err);
    }
  }, []);

  // Fetch all applications
  const fetchApplications = useCallback(async () => {
    try {
      const response = await api.get("/api-freelancer/applications");
      if (response.data.success) {
        setApplications(response.data.applications || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  }, []);

  useEffect(() => {
    const fetchStatuses = async () => {
      const map = {};

      for (const app of applications) {
        if (app.status === "ACCEPTED") {
          try {
            const res = await api.get(
              `/contract/proposals/${app.id}/contract-status`,
            );

            if (res.data.success) {
              map[app.id] = res.data.data;
            }
            console.log(res);
          } catch (err) {
            console.error("Failed to fetch contract status", err);
          }
        }
      }

      setProposalContractMap(map);
    };

    if (applications.length) {
      fetchStatuses();
    }
  }, [applications]);

  // Fetch saved jobs
  const fetchSavedJobs = useCallback(async () => {
    try {
      const response = await api.get("/api-freelancer/saved/all");
      if (response.data.success) {
        setSavedJobs(response.data.savedJobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    }
  }, []);

  // Accept counter offer
  const handleAcceptCounterOffer = async (proposalId) => {
    try {
      const response = await api.post(
        `/api-freelancer/proposals/${proposalId}/counter-accept`,
      );
      if (response.data.success) {
        alert("Counter offer accepted!");
        setShowCounterOfferModal(false);
        setSelectedProposal(null);
        fetchApplications();
        fetchDashboardStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept counter offer");
    }
  };

  // Reject counter offer
  const handleRejectCounterOffer = async (proposalId) => {
    if (!counterResponse.trim()) {
      alert("Please provide a reason for rejecting the counter offer");
      return;
    }

    try {
      const response = await api.post(
        `/api-freelancer/proposals/${proposalId}/counter-reject`,
        {
          counter_response: counterResponse,
        },
      );
      if (response.data.success) {
        alert("Counter offer rejected");
        setShowCounterOfferModal(false);
        setSelectedProposal(null);
        setCounterResponse("");
        fetchApplications();
        fetchDashboardStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject counter offer");
    }
  };

  // Open counter offer modal
  const openCounterOfferModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowCounterOfferModal(true);
  };

  // Navigate to create contract page
  const handleStartJob = (proposal_id) => {
    navigate(`/contracts/new/${proposal_id}`);
  };

  // Format time ago
  const timeAgo = (date) => {
    const givenDate = new Date(date);
    const now = new Date();

    if (givenDate > now) return "in the future";

    const seconds = Math.floor((now - givenDate) / 1000);

    if (seconds < 60) return "just now";

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  };

  // Get status badge class
  const getStatusBadge = useCallback((status) => {
    const badges = {
      PENDING: "bg-yellow-100 text-yellow-700",
      ACCEPTED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      COUNTERED: "bg-blue-100 text-blue-700",
      COUNTER_REJECTED: "bg-red-100 text-red-700",
      WITHDRAWN: "bg-gray-100 text-gray-700",
      OPEN: "bg-blue-100 text-blue-700",
      CLOSED: "bg-gray-100 text-gray-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  }, []);

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchDashboardStats();
        if (activeTab === "applications") {
          await fetchApplications();
        } else if (activeTab === "saved") {
          await fetchSavedJobs();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, fetchDashboardStats, fetchApplications, fetchSavedJobs]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}
              </h1>
              <p className="text-gray-500 mt-1">
                Manage your applications and find new opportunities
              </p>
            </div>
            <motion.button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-5 h-5" />
              Browse Jobs
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg inline-flex">
          <motion.button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-2.5 rounded-md font-medium transition-all text-sm ${
              activeTab === "overview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            Overview
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("applications")}
            className={`px-6 py-2.5 rounded-md font-medium transition-all relative text-sm ${
              activeTab === "applications"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            Applications ({stats.total_applications})
            {stats.counter_offers > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {stats.counter_offers}
              </span>
            )}
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("saved")}
            className={`px-6 py-2.5 rounded-md font-medium transition-all text-sm ${
              activeTab === "saved"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            Saved Jobs ({stats.saved_jobs})
          </motion.button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <motion.div
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Total Applications
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.total_applications}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Pending
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.pending_applications}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Accepted
                        </p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          {stats.accepted_applications}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Send className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Counter Offers
                        </p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {stats.counter_offers}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Rejected
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.rejected_applications}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bookmark className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Saved Jobs
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {stats.saved_jobs}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Recent Applications */}
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 p-6"
                  variants={itemVariants}
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Recent Applications
                  </h2>

                  {!recentApplications || recentApplications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-4">No applications yet</p>
                      <motion.button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Browse Jobs
                      </motion.button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentApplications.map((app) => (
                        <motion.div
                          key={app.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => navigate(`/jobs/${app.job_id}`)}
                          whileHover={{ scale: 1.01 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {app.job_title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  {app.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Applied {timeAgo(app.created_at)}
                                </span>
                                {app.project_type && (
                                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs">
                                    {app.project_type}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {app.status === "COUNTERED" && (
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                              )}
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}
                              >
                                {app.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm line-clamp-2">
                            {app.cover_letter}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  All Applications
                </h2>

                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">No applications yet</p>
                    <motion.button
                      onClick={() => navigate("/")}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Browse Jobs
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {applications.map((app) => (
                        <motion.div
                          key={app.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          layout
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {app.job_title}
                              </h3>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}
                              >
                                {app.status}
                              </span>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-3">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  {app.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Applied {timeAgo(app.created_at)}
                                </span>
                                {app.proposed_budget && (
                                  <span className="flex items-center gap-1 font-semibold">
                                    <DollarSign className="w-4 h-4" />$
                                    {parseFloat(
                                      app.proposed_budget,
                                    ).toLocaleString()}
                                  </span>
                                )}
                                {app.proposed_duration && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {app.proposed_duration} days
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                            {app.cover_letter}
                          </p>

                          {/* Counter Offer Details */}
                          {app.status === "COUNTERED" &&
                            app.counter_offer_message && (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3 mb-3">
                                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-blue-900 mb-2">
                                      Counter Offer from Client
                                    </h4>
                                    <p className="text-blue-800 text-sm mb-3">
                                      {app.counter_offer_message}
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-sm mb-3">
                                      {app.counter_offer_budget && (
                                        <div>
                                          <span className="font-semibold text-gray-700">
                                            Budget:
                                          </span>{" "}
                                          <span className="text-gray-900">
                                            $
                                            {parseFloat(
                                              app.counter_offer_budget,
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                      )}
                                      {app.counter_offer_hourly_rate && (
                                        <div>
                                          <span className="font-semibold text-gray-700">
                                            Rate:
                                          </span>{" "}
                                          <span className="text-gray-900">
                                            $
                                            {parseFloat(
                                              app.counter_offer_hourly_rate,
                                            ).toLocaleString()}
                                            /hr
                                          </span>
                                        </div>
                                      )}
                                      {app.counter_offer_duration && (
                                        <div>
                                          <span className="font-semibold text-gray-700">
                                            Duration:
                                          </span>{" "}
                                          <span className="text-gray-900">
                                            {app.counter_offer_duration} days
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <motion.button
                                      onClick={() => openCounterOfferModal(app)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      Respond to Counter Offer
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Rejection Reason */}
                          {app.status === "REJECTED" &&
                            app.rejection_reason && (
                              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-semibold text-red-900 mb-2 text-sm">
                                  Rejection Reason:
                                </h4>
                                <p className="text-red-800 text-sm">
                                  {app.rejection_reason}
                                </p>
                              </div>
                            )}

                          {/* Accepted Status - Create Contract Button */}
                          {app.status === "ACCEPTED" ? (
                            <div className="mt-4 flex items-center gap-3">
                              {proposalContractMap[app.id]?.has_contract ? (
                                <motion.button
                                  onClick={() => navigate(`/workspace`)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  Go to workspace
                                </motion.button>
                              ) : (
                                <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm font-medium">
                                  Waiting for client to accept contract
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 flex items-center gap-3">
                              <motion.button
                                onClick={() => handleStartJob(app.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                Create Contract
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Saved Jobs Tab */}
            {activeTab === "saved" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Saved Jobs
                </h2>

                {savedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">No saved jobs yet</p>
                    <motion.button
                      onClick={() => navigate("/")}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Browse Jobs
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedJobs.map((job) => (
                      <motion.div
                        key={job.id}
                        className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        whileHover={{ scale: 1.01 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {job.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bookmark className="w-4 h-4" />
                                Saved {timeAgo(job.saved_at)}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}
                              >
                                {job.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.required_skills
                            ?.slice(0, 4)
                            .map((skill, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          {job.required_skills?.length > 4 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{job.required_skills.length - 4} more
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1 font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {job.project_type === "Fixed Price"
                              ? `$${parseFloat(job.fixed_budget || 0).toLocaleString()}`
                              : `$${job.hourly_min}-${job.hourly_max}/hr`}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {job.proposal_count} proposals
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Counter Offer Response Modal */}
        <AnimatePresence>
          {showCounterOfferModal && selectedProposal && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCounterOfferModal(false);
                setSelectedProposal(null);
                setCounterResponse("");
              }}
            >
              <motion.div
                className="bg-white rounded-xl max-w-2xl w-full p-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Respond to Counter Offer
                </h2>

                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Client's Counter Offer:
                  </h3>
                  <p className="text-blue-800 mb-3 text-sm">
                    {selectedProposal.counter_offer_message}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedProposal.counter_offer_budget && (
                      <div>
                        <span className="font-semibold">Budget:</span> $
                        {parseFloat(
                          selectedProposal.counter_offer_budget,
                        ).toLocaleString()}
                      </div>
                    )}
                    {selectedProposal.counter_offer_hourly_rate && (
                      <div>
                        <span className="font-semibold">Rate:</span> $
                        {parseFloat(
                          selectedProposal.counter_offer_hourly_rate,
                        ).toLocaleString()}
                        /hr
                      </div>
                    )}
                    {selectedProposal.counter_offer_duration && (
                      <div>
                        <span className="font-semibold">Duration:</span>{" "}
                        {selectedProposal.counter_offer_duration} days
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Your Original Proposal:
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    {selectedProposal.proposed_budget && (
                      <div>
                        <span className="font-semibold">Budget:</span> $
                        {parseFloat(
                          selectedProposal.proposed_budget,
                        ).toLocaleString()}
                      </div>
                    )}
                    {selectedProposal.proposed_hourly_rate && (
                      <div>
                        <span className="font-semibold">Rate:</span> $
                        {parseFloat(
                          selectedProposal.proposed_hourly_rate,
                        ).toLocaleString()}
                        /hr
                      </div>
                    )}
                    {selectedProposal.proposed_duration && (
                      <div>
                        <span className="font-semibold">Duration:</span>{" "}
                        {selectedProposal.proposed_duration} days
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Message (Optional if rejecting)
                  </label>
                  <textarea
                    value={counterResponse}
                    onChange={(e) => setCounterResponse(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Add a message about your decision..."
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button
                    onClick={() =>
                      handleAcceptCounterOffer(selectedProposal.id)
                    }
                    className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Accept Counter Offer
                  </motion.button>
                  <motion.button
                    onClick={() =>
                      handleRejectCounterOffer(selectedProposal.id)
                    }
                    className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reject Counter Offer
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowCounterOfferModal(false);
                      setSelectedProposal(null);
                      setCounterResponse("");
                    }}
                    className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
