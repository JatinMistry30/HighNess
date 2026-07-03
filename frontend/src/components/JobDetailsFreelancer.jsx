import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const JobDetailsFreelancer = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [application, setApplication] = useState({
    cover_letter: "",
    proposed_budget: "",
    proposed_duration_days: "", 
    why_best_fit: "", 
    screening_answers: [],
  });

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api-freelancer/jobs/${jobId}`);
      if (response.data.success) {
        setJob(response.data.job);
        // Initialize screening answers if
        if (response.data.job.screening_questions?.length > 0) {
          setApplication((prev) => ({
            ...prev,
            screening_answers: response.data.job.screening_questions.map(
              () => "",
            ),
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching job:", err);
      setError(err.response?.data?.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = async () => {
    try {
      setSaving(true);
      if (job.is_saved) {
        await api.delete(`/api-freelancer/jobs/${jobId}/unsave`);
      } else {
        await api.post(`/api-freelancer/jobs/${jobId}/save`);
      }
      fetchJobDetails();
    } catch (err) {
      console.error("Error saving job:", err);
      alert(err.response?.data?.message || "Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    // Validate cover letter
    if (!application.cover_letter.trim()) {
      errors.cover_letter = "Cover letter is required";
    } else if (application.cover_letter.trim().length < 50) {
      errors.cover_letter = "Cover letter should be at least 50 characters";
    }

    // Validate why_best_fit (why you're the best fit)
    if (!application.why_best_fit.trim()) {
      errors.why_best_fit = "Please explain why you're the best fit";
    }

    // Validate proposed duration
    if (!application.proposed_duration_days) {
      errors.proposed_duration_days = "Proposed duration is required";
    } else if (Number(application.proposed_duration_days) <= 0) {
      errors.proposed_duration_days = "Duration must be greater than 0";
    }

    // Validate proposed budget for fixed price projects
    if (job.project_type === "Fixed Price") {
      if (!application.proposed_budget) {
        errors.proposed_budget = "Proposed budget is required";
      } else if (Number(application.proposed_budget) <= 0) {
        errors.proposed_budget = "Budget must be greater than 0";
      }
    }

    // Validate screening questions
    if (job.screening_questions?.length > 0) {
      const emptyAnswers = application.screening_answers.filter(
        (answer) => !answer.trim()
      );
      if (emptyAnswers.length > 0) {
        errors.screening_answers = "All screening questions must be answered";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setApplying(true);
      
      // Prepare the data to send
      const applicationData = {
        cover_letter: application.cover_letter.trim(),
        why_best_fit: application.why_best_fit.trim(),
        proposed_duration_days: parseInt(application.proposed_duration_days),
        screening_answers: application.screening_answers.map(answer => answer.trim()),
      };

      // Only include proposed_budget for fixed price projects
      if (job.project_type === "Fixed Price") {
        applicationData.proposed_budget = parseFloat(application.proposed_budget);
      }

      console.log("Submitting application:", applicationData); // Debug log

      const response = await api.post(
        `/api-freelancer/jobs/${jobId}/apply`,
        applicationData,
      );

      if (response.data.success) {
        alert("Application submitted successfully!");
        setShowApplyModal(false);
        // Reset form
        setApplication({
          cover_letter: "",
          proposed_budget: "",
          proposed_duration_days: "",
          why_best_fit: "",
          screening_answers: job.screening_questions?.map(() => "") || [],
        });
        fetchJobDetails();
      }
    } catch (err) {
      console.error("Error applying:", err);
      console.error("Error response:", err.response?.data); // Debug log
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
      
      alert(err.response?.data?.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const handleScreeningAnswerChange = (index, value) => {
    const newAnswers = [...application.screening_answers];
    newAnswers[index] = value;
    setApplication((prev) => ({
      ...prev,
      screening_answers: newAnswers,
    }));
    
    // Clear validation error for screening answers when user types
    if (validationErrors.screening_answers) {
      setValidationErrors(prev => ({
        ...prev,
        screening_answers: undefined
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
        <Link
          to="/freelancer/jobs"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Browse Jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="text-gray-600">Job not found</p>
        </div>
        <Link
          to="/freelancer/jobs"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Browse Jobs
        </Link>
      </div>
    );
  }

  const getDaysRemaining = (deadline) => {
    const days = Math.ceil(
      (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return days;
  };

  const daysLeft = getDaysRemaining(job.deadline);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/freelancer/jobs"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Browse Jobs
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
            {job.status}
          </span>
          <span>
            Posted{" "}
            {new Date(job.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className={daysLeft > 0 ? "text-orange-600" : "text-red-600"}>
            {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
          </span>
        </div>

        {/* Client Info */}
        <div className="mt-4">
          <p className="text-gray-700">
            <span className="font-semibold">Client:</span> {job.client_name}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          {!job.has_applied && (
            <button
              onClick={() => setShowApplyModal(true)}
              disabled={daysLeft <= 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                daysLeft <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Apply Now
            </button>
          )}

          {job.has_applied && (
            <div className="px-6 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
              ✓ Applied
            </div>
          )}

          <button
            onClick={handleSaveJob}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {saving ? "..." : job.is_saved ? "★ Saved" : "☆ Save"}
          </button>
        </div>

        {/* Proposals Count */}
        <div className="mt-4 text-sm text-gray-600">
          <strong>{job.proposal_count}</strong>{" "}
          {job.proposal_count === 1 ? "proposal" : "proposals"} submitted
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Project Type */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Project Type</p>
          <p className="font-semibold text-gray-900">{job.project_type}</p>
        </div>

        {/* Budget/Rate */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">
            {job.project_type === "Fixed Price" ? "Budget" : "Hourly Rate"}
          </p>
          <p className="font-semibold text-gray-900">
            {job.project_type === "Fixed Price"
              ? `$${job.fixed_budget}`
              : `$${job.hourly_min} - $${job.hourly_max}/hr`}
          </p>
        </div>

        {/* Category */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-600 mb-1">Category</p>
          <p className="font-semibold text-gray-900">{job.category}</p>
        </div>
      </div>

      {/* Overview */}
      {job.overview && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Overview</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.overview}</p>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Description
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      {/* Required Skills */}
      {job.required_skills?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Required Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {job.required_skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Additional Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {job.experience_level && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Experience Level</p>
              <p className="font-medium text-gray-900">{job.experience_level}</p>
            </div>
          )}

          {job.duration_estimate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration Estimate</p>
              <p className="font-medium text-gray-900">{job.duration_estimate}</p>
            </div>
          )}

          {job.duration_days && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Duration (Days)</p>
              <p className="font-medium text-gray-900">{job.duration_days} days</p>
            </div>
          )}

          {job.preferred_location && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Location Preference</p>
              <p className="font-medium text-gray-900">{job.preferred_location}</p>
            </div>
          )}

          {job.proposals_allowed && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Proposals Allowed</p>
              <p className="font-medium text-gray-900">{job.proposals_allowed}</p>
            </div>
          )}

          {job.deadline && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Application Deadline</p>
              <p className="font-medium text-gray-900">
                {new Date(job.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {job.start_date_pref && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Preferred Start Date</p>
              <p className="font-medium text-gray-900">
                {new Date(job.start_date_pref).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      {job.milestones?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Milestones
          </h2>
          <div className="space-y-4">
            {job.milestones.map((milestone, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {typeof milestone === "string"
                    ? milestone
                    : milestone.title ||
                      milestone.name ||
                      `Milestone ${index + 1}`}
                </h3>
                {typeof milestone === "object" && milestone.description && (
                  <p className="text-gray-700 text-sm mb-2">
                    {milestone.description}
                  </p>
                )}
                {typeof milestone === "object" && milestone.amount && (
                  <p className="text-green-600 font-semibold">
                    Amount: ${milestone.amount}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screening Questions */}
      {job.screening_questions?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Screening Questions
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            You'll need to answer these when applying
          </p>
          <div className="space-y-3">
            {job.screening_questions.map((question, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4"
              >
                <p className="text-gray-900">
                  {index + 1}. {question}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Criteria */}
      {job.success_criteria && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Success Criteria
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {job.success_criteria}
          </p>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Apply to: {job.title}
              </h2>

              <form onSubmit={handleApply}>
                {/* Cover Letter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    value={application.cover_letter}
                    onChange={(e) => {
                      setApplication({
                        ...application,
                        cover_letter: e.target.value,
                      });
                      // Clear validation error when user types
                      if (validationErrors.cover_letter) {
                        setValidationErrors(prev => ({
                          ...prev,
                          cover_letter: undefined
                        }));
                      }
                    }}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.cover_letter
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Introduce yourself and your experience..."
                  />
                  {validationErrors.cover_letter && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.cover_letter}
                    </p>
                  )}
                </div>

                {/* Why You're the Best Fit */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why You're the Best Fit *
                  </label>
                  <textarea
                    value={application.why_best_fit}
                    onChange={(e) => {
                      setApplication({
                        ...application,
                        why_best_fit: e.target.value,
                      });
                      // Clear validation error when user types
                      if (validationErrors.why_best_fit) {
                        setValidationErrors(prev => ({
                          ...prev,
                          why_best_fit: undefined
                        }));
                      }
                    }}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.why_best_fit
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Explain why you're the best fit for this project..."
                  />
                  {validationErrors.why_best_fit && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.why_best_fit}
                    </p>
                  )}
                </div>

                {/* Proposed Budget */}
                {job.project_type === "Fixed Price" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Budget ($) *
                    </label>
                    <input
                      type="number"
                      value={application.proposed_budget}
                      onChange={(e) => {
                        setApplication({
                          ...application,
                          proposed_budget: e.target.value,
                        });
                        // Clear validation error when user types
                        if (validationErrors.proposed_budget) {
                          setValidationErrors(prev => ({
                            ...prev,
                            proposed_budget: undefined
                          }));
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.proposed_budget
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your proposed budget"
                    />
                    {validationErrors.proposed_budget && (
                      <p className="text-red-500 text-sm mt-1">
                        {validationErrors.proposed_budget}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Client's budget: ${job.fixed_budget}
                    </p>
                  </div>
                )}

                {/* Proposed Duration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={application.proposed_duration_days}
                    onChange={(e) => {
                      setApplication({
                        ...application,
                        proposed_duration_days: e.target.value,
                      });
                      // Clear validation error when user types
                      if (validationErrors.proposed_duration_days) {
                        setValidationErrors(prev => ({
                          ...prev,
                          proposed_duration_days: undefined
                        }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.proposed_duration_days
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="How many days will you need?"
                  />
                  {validationErrors.proposed_duration_days && (
                    <p className="text-red-500 text-sm mt-1">
                      {validationErrors.proposed_duration_days}
                    </p>
                  )}
                </div>

                {/* Screening Questions */}
                {job.screening_questions?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Screening Questions *
                    </h3>
                    {validationErrors.screening_answers && (
                      <p className="text-red-500 text-sm mb-3">
                        {validationErrors.screening_answers}
                      </p>
                    )}
                    <div className="space-y-4">
                      {job.screening_questions.map((question, index) => (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {index + 1}. {question}
                          </label>
                          <textarea
                            value={application.screening_answers[index] || ""}
                            onChange={(e) =>
                              handleScreeningAnswerChange(index, e.target.value)
                            }
                            rows={3}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              validationErrors.screening_answers
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="Your answer..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      setValidationErrors({});
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300"
                  >
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsFreelancer;