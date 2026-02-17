import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  Briefcase
} from "lucide-react";
import api from "../services/api";

const ContractCreation = () => {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const [proposalDetails, setProposalDetails] = useState(null);
  
  // Contract form fields
  const [formData, setFormData] = useState({
    project_scope: "",
    total_amount: "",
    timeline_days: "",
    revision_limit: 3,
    custom_terms: "",
    meeting_schedule: "",
    milestones: [
      {
        title: "Initial Deliverable",
        description: "",
        percentage: 50,
        amount: "",
        deliverables: "",
        due_date: ""
      },
      {
        title: "Final Deliverable",
        description: "",
        percentage: 50,
        amount: "",
        deliverables: "",
        due_date: ""
      }
    ]
  });

  // Fetch proposal and job details
  const fetchJobDetails = async () => {
    try {
      if (!proposalId) {
        throw new Error("Proposal ID is missing");
      }

      setLoading(true);
      setError("");
      console.log(proposalId)
      const response = await api.get(`/contract/proposals/${proposalId}`);
      
      if (response.data.success) {
        const proposalData = response.data.proposal;
        setProposalDetails(proposalData);
        setJobDetails({
          job_id: proposalData.job_id,
          job_title: proposalData.job_title,
          client_id: proposalData.client_id,
          client_name: proposalData.client_name
        });

        // Pre-fill form with proposal data
        const proposedBudget = proposalData.proposed_budget || 
                              proposalData.proposed_hourly_rate || 
                              (proposalData.project_type === "Fixed Price" ? proposalData.fixed_budget : 0);
        
        const proposedDuration = proposalData.proposed_duration || 30;
        
        setFormData(prev => ({
          ...prev,
          total_amount: proposedBudget,
          timeline_days: proposedDuration,
          project_scope: proposalData.job_description || ""
        }));

        // If proposal has milestones, use them
        if (proposalData.proposed_milestones && proposalData.proposed_milestones.length > 0) {
          setFormData(prev => ({
            ...prev,
            milestones: proposalData.proposed_milestones.map(milestone => ({
              title: milestone.title || "Milestone",
              description: milestone.description || "",
              percentage: milestone.percentage || 0,
              amount: milestone.amount || 0,
              deliverables: milestone.deliverables || "",
              due_date: milestone.due_date || ""
            }))
          }));
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch proposal details");
      }
    } catch (err) {
      console.error("Failed to fetch job details:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proposalId) {
      fetchJobDetails();
    } else {
      setError("No proposal ID provided");
      setLoading(false);
    }
  }, [proposalId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle milestone changes
  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index][field] = value;
    
    // Recalculate amount if percentage changes
    if (field === 'percentage' && formData.total_amount) {
      updatedMilestones[index].amount = (formData.total_amount * value / 100).toFixed(2);
    }
    
    // Recalculate amount if total amount changes
    if (field === 'percentage' || (index === 0 && field === 'amount' && formData.total_amount)) {
      const totalPercentage = updatedMilestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
      if (totalPercentage !== 100) {
        // Auto-adjust last milestone percentage
        const remainingPercentage = 100 - updatedMilestones.slice(0, -1).reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
        updatedMilestones[updatedMilestones.length - 1].percentage = remainingPercentage;
        updatedMilestones[updatedMilestones.length - 1].amount = (formData.total_amount * remainingPercentage / 100).toFixed(2);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      milestones: updatedMilestones
    }));
  };

  // Add new milestone
  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: "New Milestone",
          description: "",
          percentage: 0,
          amount: 0,
          deliverables: "",
          due_date: ""
        }
      ]
    }));
  };

  // Remove milestone
  const removeMilestone = (index) => {
    if (formData.milestones.length > 1) {
      const updatedMilestones = formData.milestones.filter((_, i) => i !== index);
      // Recalculate percentages
      const newPercentage = 100 / updatedMilestones.length;
      const updatedWithRecalc = updatedMilestones.map(m => ({
        ...m,
        percentage: newPercentage,
        amount: (formData.total_amount * newPercentage / 100).toFixed(2)
      }));
      
      setFormData(prev => ({
        ...prev,
        milestones: updatedWithRecalc
      }));
    }
  };

  // Calculate milestone amounts when total amount changes
  useEffect(() => {
    if (formData.total_amount) {
      const updatedMilestones = formData.milestones.map(milestone => ({
        ...milestone,
        amount: ((parseFloat(formData.total_amount) * parseFloat(milestone.percentage)) / 100).toFixed(2)
      }));
      setFormData(prev => ({
        ...prev,
        milestones: updatedMilestones
      }));
    }
  }, [formData.total_amount]);

  // Validate form
  const validateForm = () => {
    if (!formData.project_scope.trim()) {
      return "Project scope is required";
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      return "Total amount must be greater than 0";
    }
    if (!formData.timeline_days || parseInt(formData.timeline_days) <= 0) {
      return "Timeline must be greater than 0 days";
    }
    
    const totalPercentage = formData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return `Milestone percentages must add up to 100% (currently ${totalPercentage}%)`;
    }
    
    for (let i = 0; i < formData.milestones.length; i++) {
      const m = formData.milestones[i];
      if (!m.title.trim()) {
        return `Milestone ${i + 1} title is required`;
      }
      if (!m.percentage || parseFloat(m.percentage) <= 0) {
        return `Milestone ${i + 1} percentage must be greater than 0`;
      }
    }
    
    return null;
  };

  // Submit contract
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!proposalDetails || !jobDetails) {
      setError("Missing job or proposal details");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const contractData = {
        proposal_id: proposalId,
        job_id: jobDetails.job_id,
        client_id: jobDetails.client_id,
        project_scope: formData.project_scope,
        total_amount: parseFloat(formData.total_amount),
        timeline_days: parseInt(formData.timeline_days),
        revision_limit: parseInt(formData.revision_limit),
        custom_terms: formData.custom_terms || null,
        meeting_schedule: formData.meeting_schedule || null,
        milestones: formData.milestones.map(m => ({
          title: m.title,
          description: m.description || "",
          percentage: parseFloat(m.percentage),
          amount: parseFloat(m.amount),
          deliverables: m.deliverables || "",
          due_date: m.due_date || null
        }))
      };

      const response = await api.post("/contract/createcontract", contractData);
      
      if (response.data.success) {
        alert("Contract created successfully!");
        navigate(`/contracts/${response.data.contract_id}`);
      } else {
        throw new Error(response.data.message || "Failed to create contract");
      }
    } catch (err) {
      console.error("Create contract error:", err);
      setError(err.response?.data?.message || err.message || "Failed to create contract");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (error && !jobDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/freelancer/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Contract</h1>
          <p className="text-gray-600">
            Review the job details and create a contract for {jobDetails?.client_name}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Job Details Card */}
        {jobDetails && proposalDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Job Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Job Title</h3>
                <p className="text-gray-900">{jobDetails.job_title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Client</h3>
                <p className="text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {jobDetails.client_name}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Project Type</h3>
                <p className="text-gray-900">{proposalDetails.project_type}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Category</h3>
                <p className="text-gray-900">{proposalDetails.category}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Job Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {proposalDetails.job_description}
              </p>
            </div>
          </div>
        )}

        {/* Contract Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Contract Terms</h2>

          {/* Project Scope */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Scope *
            </label>
            <textarea
              name="project_scope"
              value={formData.project_scope}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the project scope in detail..."
              required
            />
          </div>

          {/* Budget and Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Contract Amount ($) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeline (Days) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="timeline_days"
                  value={formData.timeline_days}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="30"
                  required
                />
              </div>
            </div>
          </div>

          {/* Revision Limit */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Revision Limit
            </label>
            <input
              type="number"
              name="revision_limit"
              value={formData.revision_limit}
              onChange={handleInputChange}
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">Number of free revisions included</p>
          </div>

          {/* Custom Terms */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Terms (Optional)
            </label>
            <textarea
              name="custom_terms"
              value={formData.custom_terms}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional terms or conditions..."
            />
          </div>

          {/* Meeting Schedule */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Schedule (Optional)
            </label>
            <textarea
              name="meeting_schedule"
              value={formData.meeting_schedule}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Weekly check-ins every Monday at 10 AM"
            />
          </div>

          {/* Milestones Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
              <button
                type="button"
                onClick={addMilestone}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                + Add Milestone
              </button>
            </div>

            <div className="space-y-4">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                        className="w-full text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none pb-1"
                        placeholder="Milestone Title"
                      />
                    </div>
                    {formData.milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentage (%) *
                      </label>
                      <input
                        type="number"
                        value={milestone.percentage}
                        onChange={(e) => handleMilestoneChange(index, 'percentage', e.target.value)}
                        step="0.01"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount ($)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={milestone.amount}
                          readOnly
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what this milestone includes..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deliverables (Optional)
                    </label>
                    <textarea
                      value={milestone.deliverables}
                      onChange={(e) => handleMilestoneChange(index, 'deliverables', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="List specific deliverables for this milestone..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={milestone.due_date}
                      onChange={(e) => handleMilestoneChange(index, 'due_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Percentage */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Percentage:</span>
                <span className={`text-lg font-bold ${formData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0).toFixed(2)}%
                </span>
              </div>
              {Math.abs(formData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || 0), 0) - 100) > 0.01 && (
                <p className="text-red-600 text-sm mt-1">
                  Milestone percentages must add up to exactly 100%
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Contract...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Create Contract
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractCreation;