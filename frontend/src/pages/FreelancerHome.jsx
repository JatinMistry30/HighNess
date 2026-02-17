import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Search, 
  Filter, 
  Briefcase, 
  DollarSign, 
  Clock, 
  MapPin,
  Bookmark,
  BookmarkCheck,
  TrendingUp
} from "lucide-react";
import api from "../services/api";

const FreelancerHome = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    project_type: "",
    experience_level: "",
    min_budget: "",
    max_budget: "",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());

  const categories = [
    "All Categories",
    "Web Development",
    "Mobile App",
    "Backend",
    "Frontend",
    "DevOps",
    "UI/UX Design",
    "Data Science",
    "Testing/QA",
    "Other",
  ];

  const experienceLevels = ["All Levels", "Entry", "Mid", "Expert"];

  // Fetch jobs
  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && filters.category !== "All Categories" && { category: filters.category }),
        ...(filters.project_type && { project_type: filters.project_type }),
        ...(filters.experience_level && filters.experience_level !== "All Levels" && { 
          experience_level: filters.experience_level 
        }),
        ...(filters.min_budget && { min_budget: filters.min_budget }),
        ...(filters.max_budget && { max_budget: filters.max_budget }),
      });

      const response = await api.get(
        `/api-freelancer/browse?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setJobs(response.data.jobs);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved jobs
  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        "/api-freelancer/saved/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const savedIds = new Set(response.data.savedJobs.map((job) => job.id));
        setSavedJobs(savedIds);
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    }
  };

  useEffect(() => {
    fetchJobs(pagination.page);
    fetchSavedJobs();
  }, []);

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchJobs(1);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      project_type: "",
      experience_level: "",
      min_budget: "",
      max_budget: "",
    });
    fetchJobs(1);
  };

  // Save/Unsave job
  const toggleSaveJob = async (jobId, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const isSaved = savedJobs.has(jobId);

      if (isSaved) {
        await api.delete(
          `/api-freelancer/jobs/${jobId}/unsave`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSavedJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await api.post(
          `/api-freelancer/jobs/${jobId}/save`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSavedJobs((prev) => new Set([...prev, jobId]));
      }
    } catch (err) {
      console.error("Failed to save/unsave job:", err);
    }
  };

  // Navigate to job details
  const viewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Find Your Next Project
              </h1>
              <p className="text-gray-600 mt-1">
                Browse {pagination.total} available opportunities
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              My Dashboard
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Search jobs by title, skills, or description..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={applyFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat === "All Categories" ? "" : cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={filters.project_type}
                    onChange={(e) =>
                      handleFilterChange("project_type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={filters.experience_level}
                    onChange={(e) =>
                      handleFilterChange("experience_level", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level} value={level === "All Levels" ? "" : level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={filters.min_budget}
                    onChange={(e) =>
                      handleFilterChange("min_budget", e.target.value)
                    }
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={filters.max_budget}
                    onChange={(e) =>
                      handleFilterChange("max_budget", e.target.value)
                    }
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => viewJobDetails(job.id)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {timeAgo(job.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.preferred_location}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => toggleSaveJob(job.id, e)}
                          className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {savedJobs.has(job.id) ? (
                            <BookmarkCheck className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Bookmark className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.required_skills?.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.required_skills?.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-gray-900 font-semibold">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            {job.project_type === "Fixed Price" ? (
                              <span>₹{job.fixed_budget?.toLocaleString()}</span>
                            ) : (
                              <span>
                                ₹{job.hourly_min} - ₹{job.hourly_max}/hr
                              </span>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {job.project_type}
                          </span>
                          {job.experience_level && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
                              {job.experience_level}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{job.proposal_count} proposals</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => fetchJobs(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchJobs(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FreelancerHome;