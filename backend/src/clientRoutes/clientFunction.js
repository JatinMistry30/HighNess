import sqlPool from "../DataBase/DB.js";

export const createJob = async (req, res) => {
  try {
    const client_id = req.user.id;

    const {
      title,
      overview,
      description,
      category,
      experience_level,
      project_type,
      fixed_budget,
      hourly_min,
      hourly_max,
      duration_days,
      duration_estimate,
      required_skills,
      milestones,
      screening_questions,
      proposals_allowed,
      preferred_location,
      start_date_pref,
      success_criteria,
      deadline,
    } = req.body;

    // Required base fields
    if (!title || !description || !category || !project_type || !deadline) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Project type validation
    if (project_type === "Fixed Price" && !fixed_budget) {
      return res.status(400).json({
        success: false,
        message: "Fixed budget is required for fixed price projects",
      });
    }

    if (
      project_type === "Hourly" &&
      (!hourly_min || !hourly_max || Number(hourly_min) > Number(hourly_max))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid hourly range is required for hourly projects",
      });
    }

    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be a future date",
      });
    }

    const [result] = await sqlPool.execute(
      `INSERT INTO jobs (
        client_id,
        title,
        overview,
        description,
        category,
        experience_level,
        project_type,
        fixed_budget,
        hourly_min,
        hourly_max,
        duration_days,
        duration_estimate,
        required_skills,
        milestones,
        screening_questions,
        proposals_allowed,
        preferred_location,
        start_date_pref,
        success_criteria,
        status,
        deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        title,
        overview || null,
        description,
        category,
        experience_level || null,
        project_type,
        fixed_budget || null,
        hourly_min || null,
        hourly_max || null,
        duration_days || null,
        duration_estimate || null,
        JSON.stringify(required_skills || []),
        JSON.stringify(milestones || []),
        JSON.stringify(screening_questions || []),
        proposals_allowed || 20,
        preferred_location || "Global",
        start_date_pref || null,
        success_criteria || null,
        "OPEN",
        deadline,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job_id: result.insertId,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { jobId } = req.params;

    const [jobs] = await sqlPool.execute(
      "SELECT id FROM jobs WHERE id = ? AND client_id = ? AND status = 'OPEN'",
      [jobId, client_id],
    );

    if (!jobs.length) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own OPEN jobs",
      });
    }

    const {
      title,
      overview,
      description,
      category,
      experience_level,
      project_type,
      fixed_budget,
      hourly_min,
      hourly_max,
      duration_days,
      duration_estimate,
      required_skills,
      milestones,
      screening_questions,
      proposals_allowed,
      preferred_location,
      start_date_pref,
      success_criteria,
      deadline,
    } = req.body;

    await sqlPool.execute(
      `UPDATE jobs SET
        title = COALESCE(?, title),
        overview = COALESCE(?, overview),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        experience_level = COALESCE(?, experience_level),
        project_type = COALESCE(?, project_type),
        fixed_budget = COALESCE(?, fixed_budget),
        hourly_min = COALESCE(?, hourly_min),
        hourly_max = COALESCE(?, hourly_max),
        duration_days = COALESCE(?, duration_days),
        duration_estimate = COALESCE(?, duration_estimate),
        required_skills = COALESCE(?, required_skills),
        milestones = COALESCE(?, milestones),
        screening_questions = COALESCE(?, screening_questions),
        proposals_allowed = COALESCE(?, proposals_allowed),
        preferred_location = COALESCE(?, preferred_location),
        start_date_pref = COALESCE(?, start_date_pref),
        success_criteria = COALESCE(?, success_criteria),
        deadline = COALESCE(?, deadline)
      WHERE id = ?`,
      [
        title,
        overview,
        description,
        category,
        experience_level,
        project_type,
        fixed_budget,
        hourly_min,
        hourly_max,
        duration_days,
        duration_estimate,
        required_skills ? JSON.stringify(required_skills) : null,
        milestones ? JSON.stringify(milestones) : null,
        screening_questions ? JSON.stringify(screening_questions) : null,
        proposals_allowed,
        preferred_location,
        start_date_pref,
        success_criteria,
        deadline,
        jobId,
      ],
    );

    res.json({
      success: true,
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { jobId } = req.params;

    const [jobs] = await sqlPool.execute(
      "SELECT id FROM jobs WHERE id = ? AND client_id = ?",
      [jobId, client_id],
    );

    if (!jobs.length) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this job",
      });
    }

    await sqlPool.execute("UPDATE jobs SET status = 'CLOSED' WHERE id = ?", [
      jobId,
    ]);

    res.json({
      success: true,
      message: "Job closed successfully",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getClientStats = async (req, res) => {
  try {
    const client_id = req.user.id;

    // Total jobs
    const [[{ totalJobs }]] = await sqlPool.execute(
      `SELECT COUNT(*) AS totalJobs FROM jobs WHERE client_id = ?`,
      [client_id],
    );

    // Active jobs
    const [[{ activeJobs }]] = await sqlPool.execute(
      `SELECT COUNT(*) AS activeJobs
       FROM jobs
       WHERE client_id = ? AND status = 'OPEN'`,
      [client_id],
    );

    // Total proposals received
    const [[{ totalProposals }]] = await sqlPool.execute(
      `SELECT COUNT(*) AS totalProposals
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       WHERE j.client_id = ?`,
      [client_id],
    );

    // Pending proposals
    const [[{ pendingProposals }]] = await sqlPool.execute(
      `SELECT COUNT(*) AS pendingProposals
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       WHERE j.client_id = ? AND p.status = 'PENDING'`,
      [client_id],
    );

    res.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        totalProposals,
        pendingProposals,
      },
    });
  } catch (error) {
    console.error("Get Client Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all jobs for a specific client
export const getClientJobs = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        id,
        title,
        overview,
        description,
        category,
        experience_level,
        project_type,
        fixed_budget,
        hourly_min,
        hourly_max,
        duration_days,
        duration_estimate,
        required_skills,
        milestones,
        screening_questions,
        proposals_allowed,
        preferred_location,
        start_date_pref,
        success_criteria,
        status,
        deadline,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM proposals WHERE job_id = jobs.id) as proposal_count
      FROM jobs 
      WHERE client_id = ?
    `;

    const params = [client_id];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [jobs] = await sqlPool.execute(query, params);

    const parsedJobs = jobs.map((job) => ({
      ...job,
      required_skills: job.required_skills
        ? JSON.parse(job.required_skills)
        : [],
      milestones: job.milestones ? JSON.parse(job.milestones) : [],
      screening_questions: job.screening_questions
        ? JSON.parse(job.screening_questions)
        : [],
    }));

    res.json({
      success: true,
      jobs: parsedJobs,
      total: parsedJobs.length,
    });
  } catch (error) {
    console.error("Get Client Jobs Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get a single job by ID
export const getClientJobById = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { jobId } = req.params;

    const [jobs] = await sqlPool.execute(
      `SELECT 
        id,
        title,
        overview,
        description,
        category,
        experience_level,
        project_type,
        fixed_budget,
        hourly_min,
        hourly_max,
        duration_days,
        duration_estimate,
        required_skills,
        milestones,
        screening_questions,
        proposals_allowed,
        preferred_location,
        start_date_pref,
        success_criteria,
        status,
        deadline,
        created_at,
        updated_at
      FROM jobs 
      WHERE id = ? AND client_id = ?`,
      [jobId, client_id],
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found or you don't have access to it",
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
    };

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Get Job By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all proposals for a specific job
export const getJobProposals = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { jobId } = req.params;
    const { status } = req.query;

    // Verify job ownership
    const [jobs] = await sqlPool.execute(
      "SELECT id, title FROM jobs WHERE id = ? AND client_id = ?",
      [jobId, client_id],
    );

    if (!jobs.length) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this job",
      });
    }

    // Updated query - removed non-existent columns u.skills and u.experience_level
    let query = `
      SELECT 
        p.*,
        u.full_name as freelancer_name,
        u.email as freelancer_email
      FROM proposals p
      LEFT JOIN users u ON p.freelancer_id = u.id
      WHERE p.job_id = ?
    `;

    const params = [jobId];

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC`;

    const [proposals] = await sqlPool.execute(query, params);

    res.json({
      success: true,
      job: jobs[0],
      proposals: proposals.map((proposal) => ({
        ...proposal,
        proposed_milestones: proposal.proposed_milestones
          ? JSON.parse(proposal.proposed_milestones)
          : null,
        screening_answers: proposal.screening_answers
          ? JSON.parse(proposal.screening_answers)
          : null,
        portfolio_links: proposal.portfolio_links
          ? JSON.parse(proposal.portfolio_links)
          : null,
        counter_offer_details: proposal.counter_offer_details
          ? JSON.parse(proposal.counter_offer_details)
          : null,
      })),
    });
  } catch (error) {
    console.error("Get Job Proposals Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Accept a proposal
export const acceptProposal = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { proposalId } = req.params;

    // Get proposal and verify job ownership
    const [proposals] = await sqlPool.execute(
      `SELECT p.*, j.client_id, j.title as job_title
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       WHERE p.id = ?`,
      [proposalId],
    );

    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    if (proposals[0].client_id !== client_id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to accept this proposal",
      });
    }

    // Update proposal status
    await sqlPool.execute(
      "UPDATE proposals SET status = 'ACCEPTED', accepted_at = NOW() WHERE id = ?",
      [proposalId],
    );

    // Optional: Reject all other proposals for this job
    await sqlPool.execute(
      `UPDATE proposals 
       SET status = 'REJECTED', rejected_at = NOW(), rejection_reason = 'Another proposal was accepted'
       WHERE job_id = ? AND id != ? AND status = 'PENDING'`,
      [proposals[0].job_id, proposalId],
    );

    res.json({
      success: true,
      message: "Proposal accepted successfully",
    });
  } catch (error) {
    console.error("Accept Proposal Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Reject a proposal
export const rejectProposal = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { proposalId } = req.params;
    const { rejection_reason } = req.body;

    // Get proposal and verify job ownership
    const [proposals] = await sqlPool.execute(
      `SELECT p.*, j.client_id
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       WHERE p.id = ?`,
      [proposalId],
    );

    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    if (proposals[0].client_id !== client_id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to reject this proposal",
      });
    }

    await sqlPool.execute(
      `UPDATE proposals 
       SET status = 'REJECTED', rejection_reason = ?, rejected_at = NOW()
       WHERE id = ?`,
      [rejection_reason || "Not selected", proposalId],
    );

    res.json({
      success: true,
      message: "Proposal rejected",
    });
  } catch (error) {
    console.error("Reject Proposal Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Send counter offer
export const counterProposal = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { proposalId } = req.params;
    const {
      counter_offer_budget,
      counter_offer_hourly_rate,
      counter_offer_duration,
      counter_offer_message,
      counter_offer_milestones,
    } = req.body;

    // Get proposal and verify job ownership
    const [proposals] = await sqlPool.execute(
      `SELECT p.*, j.client_id, j.project_type
       FROM proposals p
       JOIN jobs j ON p.job_id = j.id
       WHERE p.id = ?`,
      [proposalId],
    );

    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    if (proposals[0].client_id !== client_id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to counter this proposal",
      });
    }

    const counterDetails = {
      budget: counter_offer_budget,
      hourly_rate: counter_offer_hourly_rate,
      duration: counter_offer_duration,
      message: counter_offer_message,
      milestones: counter_offer_milestones,
      offered_at: new Date(),
    };

    await sqlPool.execute(
      `UPDATE proposals 
       SET status = 'COUNTERED',
           counter_offer_budget = ?,
           counter_offer_hourly_rate = ?,
           counter_offer_duration = ?,
           counter_offer_message = ?,
           counter_offer_details = ?,
           countered_at = NOW()
       WHERE id = ?`,
      [
        counter_offer_budget || null,
        counter_offer_hourly_rate || null,
        counter_offer_duration || null,
        counter_offer_message,
        JSON.stringify(counterDetails),
        proposalId,
      ],
    );

    res.json({
      success: true,
      message: "Counter offer sent successfully",
    });
  } catch (error) {
    console.error("Counter Proposal Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
