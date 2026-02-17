import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/client/jobs/${jobId}`);
      
      if (response.data.success) {
        setJob(response.data.job);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError(error.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to close this job?')) return;

    try {
      const response = await api.delete(`/client/jobs/${jobId}`);
      
      if (response.data.success) {
        alert('Job closed successfully');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error closing job:', error);
      alert(error.response?.data?.message || 'Failed to close job');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
          <Link to="/dashboard" className="text-red-900 underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Job not found</p>
        <Link to="/dashboard" className="text-blue-600 underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className={`
                px-3 py-1 rounded-full text-xs font-medium
                ${job.status === 'OPEN' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
                }
              `}>
                {job.status}
              </span>
              <span>Posted {new Date(job.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {job.status === 'OPEN' && (
            <div className="flex gap-2">
              <Link
                to={`/client/jobs/${job.id}/edit`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Job
              </Link>
              <button
                onClick={handleDeleteJob}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Close Job
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Job Details Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Project Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-600 mb-1">Project Type</p>
          <p className="text-lg font-semibold text-gray-900">{job.project_type}</p>
        </div>

        {/* Budget/Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-600 mb-1">
            {job.project_type === 'Fixed Price' ? 'Budget' : 'Hourly Rate'}
          </p>
          <p className="text-lg font-semibold text-gray-900">
            {job.project_type === 'Fixed Price' 
              ? `$${job.fixed_budget}` 
              : `$${job.hourly_min} - $${job.hourly_max}/hr`
            }
          </p>
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-600 mb-1">Category</p>
          <p className="text-lg font-semibold text-gray-900">{job.category}</p>
        </div>
      </div>

      {/* Overview */}
      {job.overview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Overview</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.overview}</p>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
      </div>

      {/* Required Skills */}
      {job.required_skills?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.required_skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {job.experience_level && (
            <div>
              <p className="text-sm text-gray-600">Experience Level</p>
              <p className="text-gray-900 font-medium">{job.experience_level}</p>
            </div>
          )}

          {job.duration_estimate && (
            <div>
              <p className="text-sm text-gray-600">Duration Estimate</p>
              <p className="text-gray-900 font-medium">{job.duration_estimate}</p>
            </div>
          )}

          {job.duration_days && (
            <div>
              <p className="text-sm text-gray-600">Duration (Days)</p>
              <p className="text-gray-900 font-medium">{job.duration_days} days</p>
            </div>
          )}

          {job.preferred_location && (
            <div>
              <p className="text-sm text-gray-600">Location Preference</p>
              <p className="text-gray-900 font-medium">{job.preferred_location}</p>
            </div>
          )}

          {job.proposals_allowed && (
            <div>
              <p className="text-sm text-gray-600">Proposals Allowed</p>
              <p className="text-gray-900 font-medium">{job.proposals_allowed}</p>
            </div>
          )}

          {job.deadline && (
            <div>
              <p className="text-sm text-gray-600">Deadline</p>
              <p className="text-gray-900 font-medium">
                {new Date(job.deadline).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {job.start_date_pref && (
            <div>
              <p className="text-sm text-gray-600">Preferred Start Date</p>
              <p className="text-gray-900 font-medium">
                {new Date(job.start_date_pref).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      {job.milestones?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Milestones</h2>
          <div className="space-y-3">
            {job.milestones.map((milestone, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-medium text-gray-900">{milestone.title || milestone}</p>
                {milestone.description && (
                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screening Questions */}
      {job.screening_questions?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Screening Questions</h2>
          <div className="space-y-3">
            {job.screening_questions.map((question, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 font-medium">{index + 1}. {question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Criteria */}
      {job.success_criteria && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Success Criteria</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.success_criteria}</p>
        </div>
      )}
    </div>
  );
};

export default JobDetails;