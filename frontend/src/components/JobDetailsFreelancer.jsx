import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const JobDetailsFreelancer = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);

  const [application, setApplication] = useState({
    cover_letter: '',
    proposed_budget: '',
    proposed_duration: '',
    screening_answers: []
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
        
        // Initialize screening answers
        if (response.data.job.screening_questions?.length > 0) {
          setApplication(prev => ({
            ...prev,
            screening_answers: response.data.job.screening_questions.map(() => '')
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err.response?.data?.message || 'Failed to load job details');
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
      console.error('Error saving job:', err);
      alert(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!application.cover_letter.trim()) {
      alert('Please write a cover letter');
      return;
    }

    try {
      setApplying(true);
      
      const response = await api.post(`/api-freelancer/jobs/${jobId}/apply`, application);
      
      if (response.data.success) {
        alert('Application submitted successfully!');
        setShowApplyModal(false);
        fetchJobDetails();
      }
    } catch (err) {
      console.error('Error applying:', err);
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleScreeningAnswerChange = (index, value) => {
    const newAnswers = [...application.screening_answers];
    newAnswers[index] = value;
    setApplication(prev => ({ ...prev, screening_answers: newAnswers }));
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
          <Link to="/" className="text-red-900 underline mt-2 inline-block">
            Back to Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Job not found</p>
        <Link to="/" className="text-blue-600 underline mt-2 inline-block">
          Back to Browse Jobs
        </Link>
      </div>
    );
  }

  const getDaysRemaining = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeft = getDaysRemaining(job.deadline);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:underline">
          ← Back to Browse Jobs
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                {job.status}
              </span>
              <span>Posted {new Date(job.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <span className={`font-medium ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-600'}`}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
              </span>
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Client:</span>
              <span>{job.client_name}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!job.has_applied && (
              <button
                onClick={() => setShowApplyModal(true)}
                disabled={daysLeft <= 0}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  daysLeft <= 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Apply Now
              </button>
            )}
            
            {job.has_applied && (
              <span className="px-6 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                ✓ Applied
              </span>
            )}

            <button
              onClick={handleSaveJob}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                job.is_saved
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {saving ? '...' : job.is_saved ? '★ Saved' : '☆ Save'}
            </button>
          </div>
        </div>

        {/* Proposals Count */}
        <div className="bg-blue-50 rounded-lg p-3 inline-block">
          <span className="text-blue-900 font-medium">
            {job.proposal_count} {job.proposal_count === 1 ? 'proposal' : 'proposals'} submitted
          </span>
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
              <p className="text-sm text-gray-600">Application Deadline</p>
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
          <p className="text-sm text-gray-600 mb-4">You'll need to answer these when applying</p>
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

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Apply to: {job.title}</h2>
            </div>

            <form onSubmit={handleApply} className="p-6">
              {/* Cover Letter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={application.cover_letter}
                  onChange={(e) => setApplication({ ...application, cover_letter: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why you're the best fit for this project..."
                  required
                />
              </div>

              {/* Proposed Budget */}
              {job.project_type === 'Fixed Price' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Budget ($)
                  </label>
                  <input
                    type="number"
                    value={application.proposed_budget}
                    onChange={(e) => setApplication({ ...application, proposed_budget: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your proposed budget"
                  />
                  <p className="text-sm text-gray-500 mt-1">Client's budget: ${job.fixed_budget}</p>
                </div>
              )}

              {/* Proposed Duration */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Duration (days)
                </label>
                <input
                  type="number"
                  value={application.proposed_duration}
                  onChange={(e) => setApplication({ ...application, proposed_duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How many days will you need?"
                />
              </div>

              {/* Screening Questions */}
              {job.screening_questions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Screening Questions</h3>
                  <div className="space-y-4">
                    {job.screening_questions.map((question, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {index + 1}. {question}
                        </label>
                        <textarea
                          value={application.screening_answers[index] || ''}
                          onChange={(e) => handleScreeningAnswerChange(index, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  onClick={() => setShowApplyModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailsFreelancer;