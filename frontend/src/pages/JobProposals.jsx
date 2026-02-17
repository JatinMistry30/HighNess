import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const JobProposals = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [counterOffer, setCounterOffer] = useState({
    counter_offer_budget: "",
    counter_offer_hourly_rate: "",
    counter_offer_duration: "",
    counter_offer_message: "",
  });

  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!jobId || jobId === "undefined") {
      console.error("Invalid jobId:", jobId);
      alert("Invalid job ID. Redirecting to dashboard.");
      navigate("/dashboard");
      return;
    }

    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, filter]);

  const fetchProposals = async () => {
    if (!jobId || jobId === "undefined") {
      console.error("Cannot fetch proposals - invalid jobId:", jobId);
      return;
    }

    try {
      setLoading(true);
      const params = filter !== "all" ? { status: filter } : {};

      const response = await api.get(`/client/jobs/${jobId}/proposals`, {
        params,
      });

      if (response.data.success) {
        setJob(response.data.job || null);
        setProposals(response.data.proposals || []);

        // Check if any proposal is ACCEPTED - redirect to contract review
        const acceptedProposal = response.data.proposals?.find(
          (p) => p.status === "ACCEPTED"
        );
        
        if (acceptedProposal) {
          // Redirect to contract review page for this accepted proposal
          navigate(`/contracts/${acceptedProposal.id}/review`, {
            state: { 
              proposal: acceptedProposal,
              job: response.data.job 
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      if (error.response?.status === 403) {
        alert("You don't have permission to view these proposals.");
        navigate("/dashboard");
      } else if (error.response?.status === 404) {
        alert("Job not found.");
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId) => {
    if (
      !window.confirm(
        "Are you sure you want to accept this proposal? You will be redirected to the contract review page."
      )
    )
      return;

    try {
      const response = await api.post(`/client/proposals/${proposalId}/accept`);

      if (response.data.success) {
        // Redirect to contract review page
        navigate(`/client/contract/${proposalId}/review`, {
          state: { 
            proposal: proposals.find(p => p.id === proposalId),
            job: job 
          }
        });
      }
    } catch (error) {
      console.error("Error accepting proposal:", error);
      alert(error.response?.data?.message || "Failed to accept proposal");
    }
  };

  const openRejectModal = (proposal) => {
    setSelectedProposal(proposal);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedProposal) return;

    try {
      const response = await api.post(
        `/client/proposals/${selectedProposal.id}/reject`,
        {
          rejection_reason: rejectionReason,
        }
      );

      if (response.data.success) {
        alert("Proposal rejected");
        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedProposal(null);
        fetchProposals();
      }
    } catch (error) {
      console.error("Error rejecting proposal:", error);
      alert(error.response?.data?.message || "Failed to reject proposal");
    }
  };

  const openCounterModal = (proposal) => {
    setSelectedProposal(proposal);
    setCounterOffer({
      counter_offer_budget:
        proposal.job_type === "Fixed Price"
          ? proposal.proposed_budget?.toString() || ""
          : "",
      counter_offer_hourly_rate:
        proposal.job_type === "Hourly"
          ? proposal.proposed_hourly_rate?.toString() || ""
          : "",
      counter_offer_duration: proposal.proposed_duration_days?.toString() || "",
      counter_offer_message: "",
    });
    setShowCounterModal(true);
  };

  const handleCounter = async () => {
    if (!selectedProposal) return;

    if (!counterOffer.counter_offer_message) {
      alert("Please provide a message with your counter offer");
      return;
    }

    try {
      const response = await api.post(
        `/client/proposals/${selectedProposal.id}/counter`,
        counterOffer
      );

      if (response.data.success) {
        alert("Counter offer sent successfully!");
        setShowCounterModal(false);
        setCounterOffer({
          counter_offer_budget: "",
          counter_offer_hourly_rate: "",
          counter_offer_duration: "",
          counter_offer_message: "",
        });
        setSelectedProposal(null);
        fetchProposals();
      }
    } catch (error) {
      console.error("Error sending counter offer:", error);
      alert(error.response?.data?.message || "Failed to send counter offer");
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      COUNTERED: "bg-blue-100 text-blue-800",
      COUNTER_REJECTED: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status ? status.replace(/_/g, " ") : "Unknown"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Back to dashboard"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Proposals for: {job?.title || "Job"}
              </h1>
              <p className="text-gray-600 mt-1">
                Review and manage proposals from freelancers
              </p>
            </div>
          </div>

          <Link
            to={`/client/jobs/${jobId}`}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Job Details
          </Link>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({proposals.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "PENDING"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "REJECTED"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("COUNTERED")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === "COUNTERED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Countered
          </button>
        </div>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No proposals yet
          </h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "Freelancers haven't submitted proposals for this job yet."
              : `No ${filter.toLowerCase()} proposals found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Proposal Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {proposal.freelancer_name || "Unknown Freelancer"}
                    </h3>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <p className="text-gray-600">
                    {proposal.freelancer_email || "No email provided"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted{" "}
                    {proposal.created_at
                      ? new Date(proposal.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Unknown date"}
                  </p>
                </div>

                {/* Budget/Rate */}
                <div className="text-right">
                  {proposal.proposed_budget && (
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{parseFloat(proposal.proposed_budget).toLocaleString()}
                    </div>
                  )}
                  {proposal.proposed_hourly_rate && (
                    <div className="text-2xl font-bold text-blue-600">
                      ₹
                      {parseFloat(
                        proposal.proposed_hourly_rate
                      ).toLocaleString()}
                      /hr
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {proposal.proposed_duration_days} days
                  </p>
                </div>
              </div>

              {/* Cover Letter */}
              {proposal.cover_letter && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Cover Letter:
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {proposal.cover_letter}
                  </p>
                </div>
              )}

              {/* Counter Offer Details */}
              {proposal.status === "COUNTERED" &&
                proposal.counter_offer_message && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Your Counter Offer:
                    </h4>
                    {proposal.counter_offer_budget && (
                      <p className="text-sm text-blue-800">
                        Counter Budget: ₹
                        {parseFloat(
                          proposal.counter_offer_budget
                        ).toLocaleString()}
                      </p>
                    )}
                    {proposal.counter_offer_hourly_rate && (
                      <p className="text-sm text-blue-800">
                        Counter Rate: ₹
                        {parseFloat(
                          proposal.counter_offer_hourly_rate
                        ).toLocaleString()}
                        /hr
                      </p>
                    )}
                    {proposal.counter_offer_duration && (
                      <p className="text-sm text-blue-800">
                        Counter Duration: {proposal.counter_offer_duration} days
                      </p>
                    )}
                    <p className="text-sm text-blue-800 mt-2">
                      Message: {proposal.counter_offer_message}
                    </p>
                  </div>
                )}

              {/* Rejection Reason */}
              {proposal.status === "REJECTED" && proposal.rejection_reason && (
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Rejection Reason:
                  </h4>
                  <p className="text-sm text-red-800">
                    {proposal.rejection_reason}
                  </p>
                </div>
              )}

              {/* Action Buttons - Only show for PENDING */}
              {proposal.status === "PENDING" && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAccept(proposal.id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Accept Proposal
                  </button>
                  <button
                    onClick={() => openCounterModal(proposal)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Send Counter
                  </button>
                  <button
                    onClick={() => openRejectModal(proposal)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Counter Offer Modal */}
      {showCounterModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Send Counter Offer
            </h2>

            <div className="space-y-4">
              {/* Budget or Hourly Rate */}
              {selectedProposal.proposed_budget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Counter Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={counterOffer.counter_offer_budget}
                    onChange={(e) =>
                      setCounterOffer({
                        ...counterOffer,
                        counter_offer_budget: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your counter budget"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Original: ₹
                    {parseFloat(
                      selectedProposal.proposed_budget
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedProposal.proposed_hourly_rate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Counter Hourly Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    value={counterOffer.counter_offer_hourly_rate}
                    onChange={(e) =>
                      setCounterOffer({
                        ...counterOffer,
                        counter_offer_hourly_rate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your counter rate"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Original: ₹
                    {parseFloat(
                      selectedProposal.proposed_hourly_rate
                    ).toLocaleString()}
                    /hr
                  </p>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Counter Duration (days)
                </label>
                <input
                  type="number"
                  value={counterOffer.counter_offer_duration}
                  onChange={(e) =>
                    setCounterOffer({
                      ...counterOffer,
                      counter_offer_duration: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter proposed duration"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original: {selectedProposal.proposed_duration_days} days
                </p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={counterOffer.counter_offer_message}
                  onChange={(e) =>
                    setCounterOffer({
                      ...counterOffer,
                      counter_offer_message: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Explain your counter offer..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCounter}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Send Counter Offer
              </button>
              <button
                onClick={() => {
                  setShowCounterModal(false);
                  setSelectedProposal(null);
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Reject Proposal
            </h2>

            <p className="text-gray-600 mb-4">
              Are you sure you want to reject the proposal from{" "}
              <strong>{selectedProposal.freelancer_name}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Provide feedback to the freelancer..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedProposal(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobProposals;