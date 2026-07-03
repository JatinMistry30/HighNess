import sqlPool from "../DataBase/DB.js";

export const createContract = async (req, res) => {
  const connection = await sqlPool.getConnection();

  try {
    const freelancer_id = req.user.id;

    const {
      proposal_id,
      job_id,
      client_id,
      project_scope,
      total_amount,
      timeline_days,
      revision_limit,
      custom_terms,
      meeting_schedule,
      milestones,
    } = req.body;

    // Validation
    if (
      !proposal_id ||
      !job_id ||
      !client_id ||
      !project_scope ||
      !total_amount ||
      !timeline_days ||
      !Array.isArray(milestones) ||
      milestones.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields",
      });
    }

    // Validate milestone percentages
    const totalPercentage = milestones.reduce(
      (sum, m) => sum + Number(m.percentage),
      0,
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Milestone percentages must add up to 100%. Current total: ${totalPercentage}%`,
      });
    }

    await connection.beginTransaction();

    // Insert contract
    const [contractResult] = await connection.execute(
      `INSERT INTO contracts (
        proposal_id,
        job_id,
        freelancer_id,
        client_id,
        project_scope,
        total_amount,
        timeline_days,
        revision_limit,
        custom_terms,
        meeting_schedule,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_CLIENT')`,
      [
        proposal_id,
        job_id,
        freelancer_id,
        client_id,
        project_scope,
        total_amount,
        timeline_days,
        revision_limit || 3,
        custom_terms || null,
        meeting_schedule || null,
      ],
    );

    const contractId = contractResult.insertId;

    // Insert milestones
    let milestoneNumber = 1;

    for (const m of milestones) {
      const { title, description, percentage, amount, deliverables, due_date } =
        m;

      if (!title || !percentage || !amount) {
        throw new Error("Invalid milestone data");
      }

      await connection.execute(
        `INSERT INTO milestones (
          contract_id,
          milestone_number,
          title,
          description,
          percentage,
          amount,
          deliverables,
          due_date,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          contractId,
          milestoneNumber,
          title,
          description || null,
          percentage,
          amount,
          deliverables || null,
          due_date || null,
        ],
      );

      milestoneNumber++;
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Contract created successfully",
      contract_id: contractId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create contract error:", error);

    return res.status(500).json({
      success: false,
      message: "Contract creation failed. No data was saved.",
    });
  } finally {
    connection.release();
  }
};

// Submit Contract for client review
export const submitContract = async (req, res) => {
  const connection = await sqlPool.getConnection();
  try {
    const freelancer_id = req.user.id;
    const { contractId } = req.params;

    const [result] = await connection.execute(
      `
      UPDATE contracts
      SET status = 'PENDING_CLIENT',
          freelancer_signed = TRUE,
          updated_at = NOW()
      WHERE id = ? AND freelancer_id = ?
      `,
      [contractId, freelancer_id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found or unauthorized",
      });
    }

    return res.json({
      success: true,
      message: "Contract submitted to client for review",
    });
  } catch (error) {
    console.error("Submit contract error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit contract",
    });
  } finally {
    connection.release();
  }
};

export const getProposalContracts = async (req, res) => {
  const connection = await sqlPool.getConnection();
  try {
    const { proposalId } = req.params;

    if (!proposalId) {
      return res.status(400).json({
        success: false,
        message: "proposalId is required",
      });
    }

    // Check if contract exists
    const [contractCheck] = await connection.execute(
      `SELECT * FROM contracts WHERE proposal_id = ?`,
      [proposalId],   
    );

    if (contractCheck.length > 0) {
      console.log("Contract data:", contractCheck[0]);
    }

    // Full query
    const [contracts] = await connection.execute(
      `
        SELECT c.*,
            f.full_name AS freelancer_name,
            f.email AS freelancer_email,
            cl.full_name AS client_name,
            cl.email AS client_email,
            j.title AS job_title
        FROM contracts c
        JOIN users f ON c.freelancer_id = f.id
        JOIN users cl ON c.client_id = cl.id
        JOIN jobs j ON c.job_id = j.id
        WHERE c.proposal_id = ?
        `,
      [proposalId],  
    );

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];

    const [milestones] = await connection.execute(
      `
      SELECT *
      FROM milestones
      WHERE contract_id = ?
      ORDER BY milestone_number ASC
      `,
      [contract.id], 
    );

    contract.milestones = milestones;

    return res.json({
      success: true,
      data: contract,
    });

  } catch (error) {
    console.error("Get contract error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contract details",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};


// Get contract details
export const getContract = async (req, res) => {
  const connection = await sqlPool.getConnection();
  try {
    const { contractId } = req.params;
    const userId = req.user.id;

    console.log("=== GET CONTRACT DEBUG ===");
    console.log("Contract ID:", contractId);
    console.log("User ID:", userId);

    // First, check if the contract exists at all
    const [contractCheck] = await connection.execute(
      `SELECT * FROM contracts WHERE id = ?`,
      [contractId],
    );

    console.log("Contract exists?", contractCheck.length > 0);
    if (contractCheck.length > 0) {
      console.log("Contract data:", contractCheck[0]);
    }

    // Now try the full query
    const [contracts] = await connection.execute(
      `
        SELECT c.*,
            f.full_name AS freelancer_name,
            f.email AS freelancer_email,
            cl.full_name AS client_name,
            cl.email AS client_email,
            j.title AS job_title
        FROM contracts c
        JOIN users f ON c.freelancer_id = f.id
        JOIN users cl ON c.client_id = cl.id
        JOIN jobs j ON c.job_id = j.id
        WHERE c.id = ?   
        `,
      [contractId],
    );

    console.log("Query returned rows:", contracts.length);
    if (contracts.length > 0) {
      console.log("Contract with joins:", contracts[0]);
    }

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];

    // Authorization check
    if (contract.freelancer_id !== userId && contract.client_id !== userId) {
      console.log("Authorization failed:", {
        contract_freelancer: contract.freelancer_id,
        contract_client: contract.client_id,
        current_user: userId,
      });
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this contract",
      });
    }

    const [milestones] = await connection.execute(
      `
      SELECT *
      FROM milestones
      WHERE contract_id = ?
      ORDER BY milestone_number ASC
      `,
      [contractId],
    );

    console.log("Milestones found:", milestones.length);
    contract.milestones = milestones;

    return res.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error("Get contract error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contract details",
      error: error.message, // Add error details for debugging
    });
  } finally {
    connection.release();
  }
};
// GET MY CONTRACTS (CLIENT / FREELANCER)
export const getMyContracts = async (req, res) => {
  const connection = await sqlPool.getConnection();

  try {
    const userId = req.user.id;
    const userType = req.user.user_type;

    let query;
    let params;

    if (userType === "FREELANCER") {
      query = `
        SELECT c.*, j.title AS job_title, u.name AS client_name
        FROM contracts c
        JOIN jobs j ON c.job_id = j.id
        JOIN users u ON c.client_id = u.id
        WHERE c.freelancer_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT c.*, j.title AS job_title, u.name AS freelancer_name
        FROM contracts c
        JOIN jobs j ON c.job_id = j.id
        JOIN users u ON c.freelancer_id = u.id
        WHERE c.client_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    }

    const [contracts] = await connection.execute(query, params);

    return res.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error("Get my contracts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contracts",
    });
  } finally {
    connection.release();
  }
};

// Get single proposal details (NEEDED FOR CONTRACT CREATION)
export const getProposalById = async (req, res) => {
  const connection = await sqlPool.getConnection();

  try {
    const { proposalId } = req.params;
    const userId = req.user.id;

    // Validate parameters
    if (!proposalId || !userId) {
      return res.status(400).json({
        success: false,
        message: `Missing required parameters`,
      });
    }

    // Check if proposal exists and user has access
    const [proposals] = await connection.execute(
      `
  SELECT 
    p.*,
    j.id as job_id,
    j.title as job_title,
    j.description as job_description,
    j.category,
    j.project_type,
    j.fixed_budget,
    j.client_id,
    j.client_id as job_client_id,
    u1.full_name as freelancer_name,
    u1.email as freelancer_email,
    u2.full_name as client_name,
    u2.email as client_email
  FROM proposals p
  JOIN jobs j ON p.job_id = j.id
  JOIN users u1 ON p.freelancer_id = u1.id
  JOIN users u2 ON j.client_id = u2.id
  WHERE p.id = ?
  `,
      [proposalId],
    );
    if (!proposals.length) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

    const proposal = proposals[0];

    // Check if user has access to this proposal
    if (
      proposal.freelancer_id !== userId &&
      proposal.job_client_id !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this proposal",
      });
    }

    // Check if contract already exists for this proposal
    const [contractCheck] = await connection.execute(
      `SELECT COUNT(*) as contract_count FROM contracts WHERE proposal_id = ?`,
      [proposalId],
    );

    // Parse JSON fields if they exist
    const parsedProposal = {
      ...proposal,
      proposed_milestones: proposal.proposed_milestones
        ? JSON.parse(proposal.proposed_milestones)
        : [],
      screening_answers: proposal.screening_answers
        ? JSON.parse(proposal.screening_answers)
        : [],
      portfolio_links: proposal.portfolio_links
        ? JSON.parse(proposal.portfolio_links)
        : [],
      counter_offer_details: proposal.counter_offer_details
        ? JSON.parse(proposal.counter_offer_details)
        : null,
      has_contract: contractCheck[0].contract_count > 0,
    };

    return res.json({
      success: true,
      proposal: parsedProposal,
    });
  } catch (error) {
    console.error("Get Proposal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching proposal",
    });
  } finally {
    connection.release();
  }
};

// Get proposal contract status
export const getProposalContractStatus = async (req, res) => {
  const connection = await sqlPool.getConnection();
  try {
    const proposalId = req.params.proposalId;
    const userId = req.user.id;

    // Get proposal
    const [[proposal]] = await connection.execute(
      `SELECT p.id, p.status,p.job_id FROM proposals p WHERE p.id = ? AND p.freelancer_id = ?`,
      [proposalId, userId],
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }
    //  Get contract (if exists)
    const [[contract]] = await connection.execute(
      `
      SELECT id, status
      FROM contracts
      WHERE proposal_id = ?
      `,
      [proposalId],
    );

    const hasContract = !!contract;
    console.log(contract);

    return res.json({
      success: true,
      data: {
        proposal_status: proposal.status,
        has_contract: hasContract,
        contract_id: hasContract ? contract.id : null,
        contract_status: hasContract ? contract.status : null,
        can_create_contract: proposal.status === "PENDING" && !hasContract,
        can_proceed: hasContract && contract.status === "PENDING_CLIENT",
      },
    });
  } catch (error) {
    console.error("Proposal contract status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch proposal contract status",
    });
  } finally {
    connection.release();
  }
};
