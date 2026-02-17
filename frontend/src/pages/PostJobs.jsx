import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import api from "../services/api";

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    description: "",
    category: "Web Development",
    experience_level: "Mid",
    project_type: "Fixed Price",
    fixed_budget: "",
    hourly_min: "",
    hourly_max: "",
    duration_days: "",
    duration_estimate: "1-3 months",
    required_skills: [],
    milestones: [],
    screening_questions: [],
    proposals_allowed: 20,
    preferred_location: "Global",
    start_date_pref: "",
    success_criteria: "",
    deadline: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [milestoneInput, setMilestoneInput] = useState({
    name: "",
    amount: "",
    description: "",
  });
  const [questionInput, setQuestionInput] = useState("");

  // Categories dropdown
  const categories = [
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

  const experienceLevels = ["Entry", "Mid", "Expert"];
  const durationEstimates = [
    "Less than 1 month",
    "1-3 months",
    "3-6 months",
    "More than 6 months",
  ];

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.project_type)
      newErrors.project_type = "Project type is required";
    if (!formData.deadline) newErrors.deadline = "Deadline is required";

    // Project type specific validation
    if (formData.project_type === "Fixed Price") {
      if (!formData.fixed_budget || parseFloat(formData.fixed_budget) <= 0) {
        newErrors.fixed_budget = "Valid fixed budget is required";
      }
    }

    if (formData.project_type === "Hourly") {
      if (!formData.hourly_min || parseFloat(formData.hourly_min) <= 0) {
        newErrors.hourly_min = "Valid minimum hourly rate is required";
      }
      if (!formData.hourly_max || parseFloat(formData.hourly_max) <= 0) {
        newErrors.hourly_max = "Valid maximum hourly rate is required";
      }
      if (
        formData.hourly_min &&
        formData.hourly_max &&
        parseFloat(formData.hourly_min) > parseFloat(formData.hourly_max)
      ) {
        newErrors.hourly_max = "Maximum rate must be higher than minimum";
      }
    }

    // Deadline validation
    const deadline = new Date(formData.deadline);
    if (deadline <= new Date()) {
      newErrors.deadline = "Deadline must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Add skill
  const addSkill = (e) => {
    e.preventDefault();
    const skill = skillInput.trim();
    if (skill && !formData.required_skills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        required_skills: [...prev.required_skills, skill],
      }));
      setSkillInput("");
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
  };

  // Add milestone
  const addMilestone = (e) => {
    e.preventDefault();
    if (milestoneInput.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        milestones: [
          ...prev.milestones,
          {
            name: milestoneInput.name.trim(),
            amount: milestoneInput.amount || "",
            description: milestoneInput.description || "",
          },
        ],
      }));
      setMilestoneInput({ name: "", amount: "", description: "" });
    }
  };

  // Remove milestone
  const removeMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  // Add screening question
  const addQuestion = (e) => {
    e.preventDefault();
    if (questionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        screening_questions: [
          ...prev.screening_questions,
          questionInput.trim(),
        ],
      }));
      setQuestionInput("");
    }
  };

  // Remove screening question
  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      screening_questions: prev.screening_questions.filter((_, i) => i !== index),
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setSuccess("");
    setErrors({});

    try {
      const token = localStorage.getItem("token");

      // Prepare data for submission
      const submitData = {
        ...formData,
        fixed_budget: formData.fixed_budget || null,
        hourly_min: formData.hourly_min || null,
        hourly_max: formData.hourly_max || null,
        duration_days: formData.duration_days || null,
      };

      const response = await api.post(
        "/client/create",
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Job posted successfully! 🎉");
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      setErrors({ submit: errMsg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Post New Job
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Attract top freelancers by posting a detailed job. Set your budget
            and timeline clearly.
          </p>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-2xl animate-pulse">
                {success}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-2xl">
                {errors.submit}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Senior React Developer for Dashboard"
                className={`w-full px-4 py-4 border-2 rounded-2xl text-lg focus:outline-none focus:ring-4 transition-all ${
                  errors.title
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Overview */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Project Overview
              </label>
              <textarea
                name="overview"
                rows="3"
                value={formData.overview}
                onChange={handleInputChange}
                placeholder="Brief summary of your project (2-3 sentences)"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl resize-vertical focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                A quick overview to catch freelancers' attention
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Job Description *
              </label>
              <textarea
                name="description"
                rows="6"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the project in detail. What do you need? What skills are required? Any specific requirements or preferences?"
                className={`w-full px-4 py-4 border-2 rounded-2xl resize-vertical focus:outline-none focus:ring-4 transition-all ${
                  errors.description
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Category & Experience Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Experience Level
                </label>
                <select
                  name="experience_level"
                  value={formData.experience_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Project Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="project_type"
                    value="Fixed Price"
                    checked={formData.project_type === "Fixed Price"}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 font-medium">
                    Fixed Price
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="project_type"
                    value="Hourly"
                    checked={formData.project_type === "Hourly"}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700 font-medium">Hourly</span>
                </label>
              </div>
            </div>

            {/* Budget Fields - Conditional based on Project Type */}
            {formData.project_type === "Fixed Price" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Fixed Budget (₹) *
                </label>
                <input
                  type="number"
                  name="fixed_budget"
                  value={formData.fixed_budget}
                  onChange={handleInputChange}
                  placeholder="e.g. 50000"
                  className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 ${
                    errors.fixed_budget
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
                {errors.fixed_budget && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.fixed_budget}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Minimum Hourly Rate (₹/hr) *
                  </label>
                  <input
                    type="number"
                    name="hourly_min"
                    value={formData.hourly_min}
                    onChange={handleInputChange}
                    placeholder="e.g. 500"
                    className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 ${
                      errors.hourly_min
                        ? "border-red-300 focus:ring-red-200 bg-red-50"
                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                  {errors.hourly_min && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.hourly_min}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Maximum Hourly Rate (₹/hr) *
                  </label>
                  <input
                    type="number"
                    name="hourly_max"
                    value={formData.hourly_max}
                    onChange={handleInputChange}
                    placeholder="e.g. 1500"
                    className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 ${
                      errors.hourly_max
                        ? "border-red-300 focus:ring-red-200 bg-red-50"
                        : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                  />
                  {errors.hourly_max && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.hourly_max}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Duration Estimate
                </label>
                <select
                  name="duration_estimate"
                  value={formData.duration_estimate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
                >
                  {durationEstimates.map((estimate) => (
                    <option key={estimate} value={estimate}>
                      {estimate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Required Skills
              </label>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. React, Node.js, MySQL"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && addSkill(e)}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                >
                  Add Skill
                </button>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:bg-blue-200 rounded-full p-1 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Project Milestones (Optional)
              </label>
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={milestoneInput.name}
                  onChange={(e) =>
                    setMilestoneInput({ ...milestoneInput, name: e.target.value })
                  }
                  placeholder="Milestone name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={milestoneInput.amount}
                    onChange={(e) =>
                      setMilestoneInput({
                        ...milestoneInput,
                        amount: e.target.value,
                      })
                    }
                    placeholder="Amount (₹)"
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={milestoneInput.description}
                    onChange={(e) =>
                      setMilestoneInput({
                        ...milestoneInput,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description"
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Add Milestone
                </button>
              </div>

              {/* Milestones List */}
              {formData.milestones.length > 0 && (
                <div className="space-y-2">
                  {formData.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {milestone.name}
                        </p>
                        {milestone.amount && (
                          <p className="text-sm text-gray-600">
                            ₹{milestone.amount}
                          </p>
                        )}
                        {milestone.description && (
                          <p className="text-sm text-gray-600">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Screening Questions */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Screening Questions (Optional)
              </label>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="e.g. Have you worked with React before?"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && addQuestion(e)}
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all whitespace-nowrap"
                >
                  Add Question
                </button>
              </div>

              {/* Questions List */}
              {formData.screening_questions.length > 0 && (
                <div className="space-y-2">
                  {formData.screening_questions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl"
                    >
                      <p className="text-gray-900">{question}</p>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Proposals Allowed
                </label>
                <input
                  type="number"
                  name="proposals_allowed"
                  value={formData.proposals_allowed}
                  onChange={handleInputChange}
                  placeholder="20"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Preferred Location
                </label>
                <input
                  type="text"
                  name="preferred_location"
                  value={formData.preferred_location}
                  onChange={handleInputChange}
                  placeholder="e.g. Global, India, USA"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Start Date & Success Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Preferred Start Date
                </label>
                <input
                  type="date"
                  name="start_date_pref"
                  value={formData.start_date_pref}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 ${
                    errors.deadline
                      ? "border-red-300 focus:ring-red-200 bg-red-50"
                      : "border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  }`}
                />
                {errors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
                )}
              </div>
            </div>

            {/* Success Criteria */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Success Criteria (Optional)
              </label>
              <textarea
                name="success_criteria"
                rows="3"
                value={formData.success_criteria}
                onChange={handleInputChange}
                placeholder="How will you measure success for this project?"
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl resize-vertical focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Posting Job...
                  </>
                ) : (
                  "Post Job Now"
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 px-8 rounded-2xl font-semibold text-lg border border-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Jobs are reviewed before going live. You'll be notified once
            approved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostJob;