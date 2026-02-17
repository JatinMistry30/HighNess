import sqlPool from "../DataBase/DB.js";

// Browse all available jobs (with filters)
export const browseJobs = async (req, res) => {
  try {
    const {
      category,
      project_type,
      experience_level,
      min_budget,
      max_budget,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    let query = `
      SELECT 
        j.*,
        u.full_name as client_name,
        u.email as client_email,
        (SELECT COUNT(*) FROM proposals WHERE job_id = j.id) as proposal_count
      FROM jobs j
      LEFT JOIN users u ON j.client_id = u.id
      WHERE j.status = 'OPEN'
        AND j.deadline > NOW()
    `;

    const params = [];

    // Apply filters
    if (category) {
      query += ` AND j.category = ?`;
      params.push(category);
    }

    if (project_type) {
      query += ` AND j.project_type = ?`;
      params.push(project_type);
    }

    if (experience_level) {
      query += ` AND j.experience_level = ?`;
      params.push(experience_level);
    }

    if (min_budget) {
      query += ` AND (j.fixed_budget >= ? OR j.hourly_min >= ?)`;
      params.push(min_budget, min_budget);
    }

    if (max_budget) {
      query += ` AND (j.fixed_budget <= ? OR j.hourly_max <= ?)`;
      params.push(max_budget, max_budget);
    }

    if (search) {
      query += ` AND (j.title LIKE ? OR j.description LIKE ? OR j.required_skills LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY j.created_at DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [jobs] = await sqlPool.execute(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM jobs j WHERE j.status = 'OPEN' AND j.deadline > NOW()`;
    const countParams = [];

    if (category) {
      countQuery += ` AND j.category = ?`;
      countParams.push(category);
    }
    if (project_type) {
      countQuery += ` AND j.project_type = ?`;
      countParams.push(project_type);
    }
    if (experience_level) {
      countQuery += ` AND j.experience_level = ?`;
      countParams.push(experience_level);
    }
    if (search) {
      countQuery += ` AND (j.title LIKE ? OR j.description LIKE ? OR j.required_skills LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [[{ total }]] = await sqlPool.execute(countQuery, countParams);

    res.json({
      success: true,
      jobs: jobs.map((job) => ({
        ...job,
        required_skills: job.required_skills
          ? JSON.parse(job.required_skills)
          : [],
        milestones: job.milestones ? JSON.parse(job.milestones) : [],
        screening_questions: job.screening_questions
          ? JSON.parse(job.screening_questions)
          : [],
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Browse Jobs Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get single job details
export const getJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    const freelancer_id = req.user.id;

    const [jobs] = await sqlPool.execute(
      `
      SELECT 
        j.*,
        u.full_name as client_name,
        u.email as client_email,
        (SELECT COUNT(*) FROM proposals WHERE job_id = j.id) as proposal_count,
        (SELECT COUNT(*) FROM proposals WHERE job_id = j.id AND freelancer_id = ?) as has_applied,
        (SELECT COUNT(*) FROM saved_jobs WHERE job_id = j.id AND freelancer_id = ?) as is_saved
      FROM jobs j
      LEFT JOIN users u ON j.client_id = u.id
      WHERE j.id = ? AND j.status = 'OPEN'
      `,
      [freelancer_id, freelancer_id, jobId],
    );

    if (!jobs.length) {
      return res.status(404).json({
        success: false,
        message: "Job not found or no longer available",
      });
    }

    const job = {
      ...jobs[0],
      required_skills: jobs[0].required_skills
        ? JSON.parse(jobs[0].required_skills)
        : [],
      milestones: jobs[0].milestones ? JSON.parse(jobs[0].milestones) : [],
      screening_questions: jobs[0].screening_questions
        ? JSON.parse(jobs[0].screening_questions)
        : [],
      has_applied: jobs[0].has_applied > 0,
      is_saved: jobs[0].is_saved > 0,
    };

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Get Job Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Apply to a job / Submit proposal (PROFESSIONAL VERSION)
export const applyToJob = async (req, res) => {
  try {
    const freelancer_id = req.user.id;
    const { jobId } = req.params;
    const {
      cover_letter,
      proposed_budget,
      proposed_hourly_rate,
      proposed_duration_days,
      proposed_milestones,
      screening_answers,
      portfolio_links,
      availability,
      why_best_fit,
    } = req.body;

    // Validate required fields
    if (!cover_letter || !proposed_duration_days || !why_best_fit) {
      return res.status(400).json({
        success: false,
        message:
          "Cover letter, duration, and why you're the best fit are required",
      });
    }

    // Check if job exists and is open
    const [jobs] = await sqlPool.execute(
      "SELECT * FROM jobs WHERE id = ? AND status = 'OPEN' AND deadline > NOW()",
      [jobId],
    );

    if (!jobs.length) {
      return res.status(404).json({
        success: false,
        message: "Job not found or already closed",
      });
    }

    const job = jobs[0];

    // Validate budget/rate based on project type
    if (job.project_type === "Fixed Price" && !proposed_budget) {
      return res.status(400).json({
        success: false,
        message: "Proposed budget is required for fixed price projects",
      });
    }

    if (job.project_type === "Hourly" && !proposed_hourly_rate) {
      return res.status(400).json({
        success: false,
        message: "Proposed hourly rate is required for hourly projects",
      });
    }

    // Check if already applied
    const [existing] = await sqlPool.execute(
      "SELECT id FROM proposals WHERE job_id = ? AND freelancer_id = ?",
      [jobId, freelancer_id],
    );

    if (existing.length) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a proposal for this job",
      });
    }

    // Get freelancer profile for the proposal
    const [freelancer] = await sqlPool.execute(
      "SELECT full_name, email, skills, experience_level FROM users WHERE id = ?",
      [freelancer_id],
    );

    // Insert proposal
    const [result] = await sqlPool.execute(
      `INSERT INTO proposals (
        job_id,
        freelancer_id,
        cover_letter,
        proposed_budget,
        proposed_hourly_rate,
        proposed_duration_days,
        proposed_milestones,
        screening_answers,
        portfolio_links,
        availability,
        why_best_fit,
        status,
        freelancer_name,
        freelancer_email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        freelancer_id,
        cover_letter,
        proposed_budget || null,
        proposed_hourly_rate || null,
        proposed_duration_days,
        proposed_milestones ? JSON.stringify(proposed_milestones) : null,
        screening_answers ? JSON.stringify(screening_answers) : null,
        portfolio_links ? JSON.stringify(portfolio_links) : null,
        availability || "Full-time",
        why_best_fit,
        "PENDING",
        freelancer[0].full_name,
        freelancer[0].email,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Proposal submitted successfully",
      proposal_id: result.insertId,
    });
  } catch (error) {
    console.error("Apply to Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Alias for applyToJob (same function, different name for clarity)
export const submitProposal = applyToJob;

// Get freelancer's applications/proposals
export const getMyApplications = async (req, res) => {
  try {
    const freelancer_id = req.user.id;

    const [applications] = await sqlPool.execute(
      `SELECT 
        p.*,
        j.title as job_title,
        j.category,
        j.project_type,
        u.full_name as client_name
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       LEFT JOIN users u ON j.client_id = u.id
       WHERE p.freelancer_id = ?
       ORDER BY 
         CASE 
           WHEN p.status = 'COUNTERED' THEN 1
           WHEN p.status = 'PENDING' THEN 2
           WHEN p.status = 'ACCEPTED' THEN 3
           ELSE 4
         END,
         p.created_at DESC`,
      [freelancer_id],
    );

    res.json({
      success: true,
      applications: applications.map((app) => ({
        ...app,
        proposed_milestones: app.proposed_milestones
          ? JSON.parse(app.proposed_milestones)
          : null,
        screening_answers: app.screening_answers
          ? JSON.parse(app.screening_answers)
          : null,
        portfolio_links: app.portfolio_links
          ? JSON.parse(app.portfolio_links)
          : null,
        counter_offer_details: app.counter_offer_details
          ? JSON.parse(app.counter_offer_details)
          : null,
      })),
    });
  } catch (error) {
    console.error("Get Freelancer Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Alias for getMyApplications (for clarity)
export const getMyProposals = getMyApplications;

// Respond to counter offer
export const respondToCounterOffer = async (req, res) => {
  try {
    const freelancer_id = req.user.id;
    const { proposalId } = req.params;
    const { accept, counter_response } = req.body;

    // Get proposal
    const [proposals] = await sqlPool.execute(
      "SELECT * FROM proposals WHERE id = ? AND freelancer_id = ? AND status = 'COUNTERED'",
      [proposalId, freelancer_id],
    );

    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Counter offer not found or already responded",
      });
    }

    if (accept) {
      // Accept counter offer
      await sqlPool.execute(
        `UPDATE proposals SET 
          status = 'ACCEPTED',
          proposed_budget = counter_offer_budget,
          proposed_hourly_rate = counter_offer_hourly_rate,
          proposed_duration_days = counter_offer_duration,
          counter_accepted_at = NOW()
        WHERE id = ?`,
        [proposalId],
      );

      res.json({
        success: true,
        message: "Counter offer accepted successfully",
      });
    } else {
      // Reject counter offer with response
      await sqlPool.execute(
        `UPDATE proposals SET 
          status = 'COUNTER_REJECTED',
          counter_response = ?,
          counter_rejected_at = NOW()
        WHERE id = ?`,
        [counter_response || "Counter offer rejected", proposalId],
      );

      res.json({
        success: true,
        message: "Counter offer declined",
      });
    }
  } catch (error) {
    console.error("Respond to Counter Offer Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Save a job
export const saveJob = async (req, res) => {
  try {
    const freelancer_id = req.user.id;
    const { jobId } = req.params;

    const [jobs] = await sqlPool.execute("SELECT id FROM jobs WHERE id = ?", [
      jobId,
    ]);

    if (!jobs.length) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const [existing] = await sqlPool.execute(
      "SELECT id FROM saved_jobs WHERE job_id = ? AND freelancer_id = ?",
      [jobId, freelancer_id],
    );

    if (existing.length) {
      return res.status(400).json({
        success: false,
        message: "Job already saved",
      });
    }

    await sqlPool.execute(
      "INSERT INTO saved_jobs (job_id, freelancer_id) VALUES (?, ?)",
      [jobId, freelancer_id],
    );

    res.status(201).json({
      success: true,
      message: "Job saved successfully",
    });
  } catch (error) {
    console.error("Save Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Unsave a job
export const unsaveJob = async (req, res) => {
  try {
    const freelancer_id = req.user.id;
    const { jobId } = req.params;

    await sqlPool.execute(
      "DELETE FROM saved_jobs WHERE job_id = ? AND freelancer_id = ?",
      [jobId, freelancer_id],
    );

    res.json({
      success: true,
      message: "Job removed from saved",
    });
  } catch (error) {
    console.error("Unsave Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get saved jobs
export const getSavedJobs = async (req, res) => {
  try {
    const freelancer_id = req.user.id;

    const [savedJobs] = await sqlPool.execute(
      `
      SELECT 
        j.*,
        u.full_name as client_name,
        sj.created_at as saved_at,
        (SELECT COUNT(*) FROM proposals WHERE job_id = j.id) as proposal_count
      FROM saved_jobs sj
      LEFT JOIN jobs j ON sj.job_id = j.id
      LEFT JOIN users u ON j.client_id = u.id
      WHERE sj.freelancer_id = ?
      ORDER BY sj.created_at DESC
      `,
      [freelancer_id],
    );

    res.json({
      success: true,
      savedJobs: savedJobs.map((job) => ({
        ...job,
        required_skills: job.required_skills
          ? JSON.parse(job.required_skills)
          : [],
        milestones: job.milestones ? JSON.parse(job.milestones) : [],
      })),
    });
  } catch (error) {
    console.error("Get Saved Jobs Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get freelancer dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const freelancer_id = req.user.id;

    // Total proposals
    const [[{ total_proposals }]] = await sqlPool.execute(
      "SELECT COUNT(*) as total_proposals FROM proposals WHERE freelancer_id = ?",
      [freelancer_id],
    );

    // Pending proposals
    const [[{ pending_proposals }]] = await sqlPool.execute(
      "SELECT COUNT(*) as pending_proposals FROM proposals WHERE freelancer_id = ? AND status = 'PENDING'",
      [freelancer_id],
    );

    // Accepted proposals
    const [[{ accepted_proposals }]] = await sqlPool.execute(
      "SELECT COUNT(*) as accepted_proposals FROM proposals WHERE freelancer_id = ? AND status = 'ACCEPTED'",
      [freelancer_id],
    );

    // Rejected proposals
    const [[{ rejected_proposals }]] = await sqlPool.execute(
      "SELECT COUNT(*) as rejected_proposals FROM proposals WHERE freelancer_id = ? AND status IN ('REJECTED', 'COUNTER_REJECTED')",
      [freelancer_id],
    );

    // Counter offers (new)
    const [[{ counter_offers }]] = await sqlPool.execute(
      "SELECT COUNT(*) as counter_offers FROM proposals WHERE freelancer_id = ? AND status = 'COUNTERED'",
      [freelancer_id],
    );

    // Saved jobs
    const [[{ saved_jobs }]] = await sqlPool.execute(
      "SELECT COUNT(*) as saved_jobs FROM saved_jobs WHERE freelancer_id = ?",
      [freelancer_id],
    );

    // Recent proposals
    const [recent_proposals] = await sqlPool.execute(
      `SELECT 
        p.*,
        j.title as job_title,
        j.category,
        j.project_type,
        u.full_name as client_name
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       LEFT JOIN users u ON j.client_id = u.id
       WHERE p.freelancer_id = ?
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [freelancer_id],
    );

    res.json({
      success: true,
      stats: {
        total_proposals,
        pending_proposals,
        accepted_proposals,
        rejected_proposals,
        counter_offers, // Added
        saved_jobs,
      },
      recent_proposals,
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Accept counter offer
export const acceptCounterOffer = async (req, res) => {
  try {
    const freelancer_id = req.user.id;
    const { proposalId } = req.params;

    // Get proposal and verify ownership
    const [proposals] = await sqlPool.execute(
      "SELECT * FROM proposals WHERE id = ? AND freelancer_id = ?",
      [proposalId, freelancer_id],
    );

    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found or you don't have access",
      });
    }

    const proposal = proposals[0];

    if (proposal.status !== "COUNTERED") {
      return res.status(400).json({
        success: false,
        message: "This proposal doesn't have a pending counter offer",
      });
    }

    // Update proposal to accepted
    await sqlPool.execute(
      `UPDATE proposals 
       SET status = 'ACCEPTED',
           accepted_at = NOW(),
           counter_accepted_at = NOW(),
           counter_response = 'Counter offer accepted'
       WHERE id = ?`,
      [proposalId],
    );

    // Reject other proposals for this job
    await sqlPool.execute(
      `UPDATE proposals 
       SET status = 'REJECTED', 
           rejected_at = NOW(), 
           rejection_reason = 'Another proposal was accepted'
       WHERE job_id = ? AND id != ? AND status IN ('PENDING', 'COUNTERED')`,
      [proposal.job_id, proposalId],
    );

    res.json({
      success: true,
      message: "Counter offer accepted successfully",
    });
  } catch (error) {
    console.error("Accept Counter Offer Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reject counter offer
export const rejectCounterOffer = async (req, res) => {
  try {
    const freelancer_id = req.user.id;
    const { proposalId } = req.params;
    const { counter_response } = req.body;

    // Get proposal and verify ownership
    const [proposals] = await sqlPool.execute(
      "SELECT * FROM proposals WHERE id = ? AND freelancer_id = ?",
      [proposalId, freelancer_id],
    );

    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found or you don't have access",
      });
    }

    if (proposals[0].status !== "COUNTERED") {
      return res.status(400).json({
        success: false,
        message: "This proposal doesn't have a pending counter offer",
      });
    }

    // Update proposal to counter rejected
    await sqlPool.execute(
      `UPDATE proposals 
       SET status = 'COUNTER_REJECTED',
           counter_rejected_at = NOW(),
           counter_response = ?
       WHERE id = ?`,
      [counter_response || "Counter offer rejected by freelancer", proposalId],
    );

    res.json({
      success: true,
      message: "Counter offer rejected",
    });
  } catch (error) {
    console.error("Reject Counter Offer Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



