import puppeteer, { ConnectionClosedError } from "puppeteer";
import sqlPool from "../DataBase/DB.js";

// Generate & download contract PDF
export const downloadContractPDF = async (req, res) => {
  let connection;
  let browser;

  try {
    const { contractId } = req.params;

    // Get user ID - adjust based on your JWT structure
    const userId = req.user?.id || req.user?.userId || req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get database connection from your pool
    connection = await sqlPool.getConnection();

    // Fetch contract with all details
    const [contracts] = await connection.execute(
      `
      SELECT 
        c.*,
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

    if (contracts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const contract = contracts[0];

    // Authorization check
    if (contract.freelancer_id !== userId && contract.client_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this contract",
      });
    }

    // Fetch milestones
    const [milestones] = await connection.execute(
      `
      SELECT *
      FROM milestones
      WHERE contract_id = ?
      ORDER BY milestone_number ASC
      `,
      [contractId],
    );

    contract.milestones = milestones;

    // Launch browser - handle different environments
    const puppeteerOptions = {
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (process.platform === "win32") {
      puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();

    // Generate HTML
    const htmlContent = generateContractHTML(contract);

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
      timeout: 30000,
    });

    await browser.close();

    // Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Highness-Contract-${contract.id}.pdf"`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);

    if (browser) {
      await browser.close().catch(console.error);
    }

    if (error.message.includes("puppeteer")) {
      return res.status(500).json({
        success: false,
        message:
          "PDF generation service unavailable. Please install puppeteer.",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Professional HTML Template Generator
const generateContractHTML = (contract) => {
  const milestones = Array.isArray(contract.milestones)
    ? contract.milestones
    : [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Freelance Service Agreement - Contract #${contract.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }
    
    .container {
      max-width: 100%;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 28pt;
      font-weight: bold;
      letter-spacing: 2px;
      margin-bottom: 5px;
    }
    
    .document-title {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .contract-meta {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      padding: 15px;
      border: 2px solid #000;
      background: #f9f9f9;
    }
    
    .meta-item {
      font-size: 10pt;
    }
    
    .meta-label {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9pt;
    }
    
    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
      margin-bottom: 15px;
      letter-spacing: 0.5px;
    }
    
    .parties-container {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin: 20px 0;
    }
    
    .party-box {
      flex: 1;
      border: 2px solid #000;
      padding: 15px;
    }
    
    .party-title {
      font-weight: bold;
      font-size: 11pt;
      text-transform: uppercase;
      margin-bottom: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 5px;
    }
    
    .party-info {
      margin: 5px 0;
      font-size: 10pt;
    }
    
    .project-scope {
      border: 1px solid #000;
      padding: 15px;
      background: #f9f9f9;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    .project-title {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .milestones-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    .milestones-table th {
      background: #000;
      color: #fff;
      padding: 12px 10px;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9pt;
    }
    
    .milestones-table td {
      border: 1px solid #000;
      padding: 10px;
      vertical-align: top;
    }
    
    .milestones-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .milestone-title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .milestone-description {
      font-size: 9pt;
      color: #333;
    }
    
    .total-row {
      background: #000 !important;
      color: #fff;
      font-weight: bold;
      font-size: 11pt;
    }
    
    .terms-list {
      counter-reset: term-counter;
      list-style: none;
      margin: 15px 0;
    }
    
    .terms-list li {
      counter-increment: term-counter;
      margin: 12px 0;
      padding-left: 30px;
      position: relative;
      font-size: 10pt;
      text-align: justify;
    }
    
    .terms-list li::before {
      content: counter(term-counter) ".";
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    
    .policy-section {
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .policy-title {
      font-weight: bold;
      font-size: 11pt;
      margin: 15px 0 8px 0;
      text-transform: uppercase;
    }
    
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin-top: 50px;
      page-break-inside: avoid;
    }
    
    .signature-box {
      flex: 1;
      border: 2px solid #000;
      padding: 20px;
      min-height: 150px;
    }
    
    .signature-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 40px;
      font-size: 11pt;
    }
    
    .signature-line {
      border-top: 2px solid #000;
      margin: 10px 0;
      padding-top: 5px;
    }
    
    .signature-name {
      font-weight: bold;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #000;
      text-align: center;
      font-size: 8pt;
      color: #333;
    }
    
    .important-notice {
      border: 3px double #000;
      padding: 15px;
      margin: 20px 0;
      background: #f9f9f9;
      font-size: 10pt;
      text-align: center;
      font-weight: bold;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-name">Highness</div>
      <div class="document-title">Freelance Service Agreement</div>
    </div>

    <!-- Contract Metadata -->
    <div class="contract-meta">
      <div class="meta-item">
        <div class="meta-label">Contract ID</div>
        <div>#${contract.id}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date Issued</div>
        <div>${new Date(contract.created_at).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Status</div>
        <div>${contract.status.toUpperCase()}</div>
      </div>
    </div>

    <!-- Parties Section -->
    <div class="section">
      <div class="section-title">Parties to This Agreement</div>
      <div class="parties-container">
        <div class="party-box">
          <div class="party-title">Service Provider (Freelancer)</div>
          <div class="party-info"><strong>Name:</strong> ${contract.freelancer_name || "N/A"}</div>
          <div class="party-info"><strong>Email:</strong> ${contract.freelancer_email || "N/A"}</div>
          <div class="party-info"><strong>User ID:</strong> ${contract.freelancer_id}</div>
        </div>
        <div class="party-box">
          <div class="party-title">Client</div>
          <div class="party-info"><strong>Name:</strong> ${contract.client_name || "N/A"}</div>
          <div class="party-info"><strong>Email:</strong> ${contract.client_email || "N/A"}</div>
          <div class="party-info"><strong>User ID:</strong> ${contract.client_id}</div>
        </div>
      </div>
    </div>

    <!-- Project Details -->
    <div class="section">
      <div class="section-title">Project Details</div>
      <div class="project-scope">
        <div class="project-title">${contract.job_title}</div>
        <div>${contract.project_scope || "No detailed project scope provided. Parties agree to the work as discussed and outlined in the milestones below."}</div>
      </div>
    </div>

    <!-- Payment Schedule -->
    <div class="section">
      <div class="section-title">Payment Schedule & Milestones</div>
      <table class="milestones-table">
        <thead>
          <tr>
            <th style="width: 10%;">#</th>
            <th style="width: 45%;">Milestone Details</th>
            <th style="width: 20%;">Due Date</th>
            <th style="width: 25%;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${milestones
            .map(
              (m, i) => `
            <tr>
              <td><strong>${i + 1}</strong></td>
              <td>
                <div class="milestone-title">${m.title || `Milestone ${i + 1}`}</div>
                <div class="milestone-description">${m.description || "Details to be confirmed"}</div>
              </td>
              <td>${
                m.due_date
                  ? new Date(m.due_date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "TBD"
              }</td>
              <td>
                <strong>₹${parseFloat(m.amount || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</strong><br>
                <span style="font-size: 9pt;">(${parseFloat(m.percentage || 0).toFixed(1)}%)</span>
              </td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; padding-right: 20px;">TOTAL CONTRACT VALUE</td>
            <td><strong>₹${parseFloat(
              contract.total_amount || 0,
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Terms and Conditions -->
    <div class="section">
      <div class="section-title">Terms and Conditions</div>
      <ol class="terms-list">
        <li><strong>Project Timeline:</strong> The Service Provider agrees to complete the project within ${contract.timeline_days || "the agreed"} days from the contract start date, subject to timely feedback and approvals from the Client.</li>
        
        <li><strong>Revisions:</strong> The project includes up to ${contract.revision_limit || 3} rounds of revisions. Additional revisions beyond this limit may incur extra charges as mutually agreed upon.</li>
        
        ${contract.meeting_schedule ? `<li><strong>Communication Schedule:</strong> ${contract.meeting_schedule}</li>` : ""}
        
        <li><strong>Payment Terms:</strong> Payment shall be released upon approval of each milestone as outlined in the Payment Schedule above. The Client agrees to review and approve or provide feedback within 7 business days of milestone submission.</li>
        
        <li><strong>Intellectual Property:</strong> Upon full payment of all milestones, all intellectual property rights, including copyrights, shall transfer to the Client. Until final payment, the Service Provider retains all rights to the work product.</li>
        
        <li><strong>Confidentiality:</strong> Both parties agree to maintain confidentiality of all proprietary information shared during the course of this project.</li>
        
        <li><strong>Termination:</strong> Either party may terminate this agreement with 7 days written notice. Upon termination, the Client shall pay for all completed milestones and work in progress on a pro-rata basis.</li>
        
        ${contract.custom_terms ? `<li><strong>Additional Terms:</strong> ${contract.custom_terms}</li>` : ""}
      </ol>
    </div>

    <!-- Platform Policies -->
    <div class="section">
      <div class="section-title">Highness Platform Policies</div>
      
      <div class="important-notice">
        IMPORTANT: BY SIGNING THIS AGREEMENT, BOTH PARTIES ACKNOWLEDGE AND ACCEPT ALL Highness PLATFORM TERMS
      </div>

      <div class="policy-section">
        <div class="policy-title">1. Platform Role and Disclaimer</div>
        <ol class="terms-list">
          <li>Highness acts solely as an intermediary platform connecting freelancers with clients. Highness is NOT a party to this service agreement and assumes NO responsibility or liability for the services rendered or the relationship between the parties.</li>
          
          <li>Highness makes NO warranties or representations regarding the quality, accuracy, reliability, or legality of services provided by freelancers or the ability of clients to pay for such services.</li>
          
          <li>Highness is NOT responsible for any disputes, claims, losses, injuries, or damages of any kind arising from or relating to this agreement or the services provided thereunder.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">2. Limitation of Liability</div>
        <ol class="terms-list">
          <li>TO THE MAXIMUM EXTENT PERMITTED BY LAW, Highness shall NOT be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from this agreement, including but not limited to loss of profits, data, or business opportunities.</li>
          
          <li>Highness's total liability, if any, shall not exceed the platform fees paid in connection with this specific contract.</li>
          
          <li>Highness does NOT guarantee payment collection, work quality, timely delivery, or any specific outcome from this agreement.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">3. User Responsibilities</div>
        <ol class="terms-list">
          <li>Both parties acknowledge that they are entering into this agreement independently and have conducted their own due diligence regarding the capabilities and reliability of the other party.</li>
          
          <li>Users are solely responsible for compliance with all applicable laws, regulations, and tax obligations in their respective jurisdictions.</li>
          
          <li>Users agree to communicate professionally and resolve disputes directly between themselves. Highness may provide mediation services at its sole discretion but is not obligated to do so.</li>
          
          <li>Any breach of contract, non-performance, or dispute arising from this agreement is solely between the Client and Service Provider. Highness shall not be involved in enforcement or legal proceedings.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">4. Payment Processing</div>
        <ol class="terms-list">
          <li>While Highness may facilitate payment processing, it does NOT guarantee payment or act as an escrow service unless explicitly stated otherwise.</li>
          
          <li>Users are responsible for ensuring payment accuracy, currency conversions, and transaction fees. Highness is not liable for payment processing errors, delays, or third-party payment gateway issues.</li>
          
          <li>Platform fees, if applicable, are separate from and in addition to the contract amount and are non-refundable.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">5. Intellectual Property and Content</div>
        <ol class="terms-list">
          <li>Highness claims NO ownership over work products created under this agreement. All intellectual property matters are solely between the Client and Service Provider as outlined in this contract.</li>
          
          <li>Users warrant that they have the right to share any content, materials, or intellectual property provided through the platform and will not hold Highness liable for any infringement claims.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">6. Indemnification</div>
        <ol class="terms-list">
          <li>Both parties agree to indemnify and hold harmless Highness, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from this agreement or their use of the platform.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">7. Governing Law and Jurisdiction</div>
        <ol class="terms-list">
          <li>This agreement shall be governed by the laws of India. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of courts in [Your City/State].</li>
          
          <li>Highness may be subject to different terms of service and governing laws as specified in the platform's general Terms of Service.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">8. Modifications and Amendments</div>
        <ol class="terms-list">
          <li>Any modifications to this contract must be made in writing and signed by both parties. Highness is not responsible for enforcing or tracking contract modifications.</li>
          
          <li>Highness reserves the right to modify its platform policies at any time. Continued use of the platform constitutes acceptance of updated policies.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">9. Account Termination</div>
        <ol class="terms-list">
          <li>Highness reserves the right to suspend or terminate user accounts for violation of platform policies, illegal activity, or at its sole discretion without prior notice.</li>
          
          <li>Account termination does NOT void existing contractual obligations between users, which shall remain in full force and effect.</li>
        </ol>
      </div>

      <div class="policy-section">
        <div class="policy-title">10. Acknowledgment of Understanding</div>
        <ol class="terms-list">
          <li>By signing below, both parties acknowledge that they have read, understood, and agree to be bound by all terms in this agreement and Highness's platform policies.</li>
          
          <li>Both parties confirm they are entering into this agreement voluntarily and have the legal capacity to do so.</li>
          
          <li>This contract represents the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements, whether written or oral.</li>
        </ol>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-title">Service Provider Signature</div>
        <div style="height: 60px;"></div>
        <div class="signature-line">
          <div class="signature-name">${contract.freelancer_name || "N/A"}</div>
          <div style="font-size: 9pt; margin-top: 5px;">
            Date: _______________________
          </div>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Client Signature</div>
        <div style="height: 60px;"></div>
        <div class="signature-line">
          <div class="signature-name">${contract.client_name || "N/A"}</div>
          <div style="font-size: 9pt; margin-top: 5px;">
            Date: _______________________
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>This contract was generated through the Highness platform on ${new Date().toLocaleDateString(
        "en-IN",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      )}</div>
      <div style="margin-top: 5px;">Contract Reference: #${contract.id} | For platform support, visit www.Highness.com</div>
      <div style="margin-top: 10px; font-style: italic;">
        "Highness - Connecting Talent with Opportunity"
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Accept contract
export const acceptContract = async (req, res) => {
  const connection = await sqlPool.getConnection();

  try {
    const { contractId } = req.params;
    const clientId = req.user.id;

    console.log("=== ACCEPT CONTRACT DEBUG ===");
    console.log("contractId:", contractId, "type:", typeof contractId);
    console.log("clientId:", clientId);

    await connection.beginTransaction();

    const [contracts] = await connection.execute(
      `SELECT 
        c.id,
        c.client_id,
        c.freelancer_id,
        c.status,
        cl.full_name AS client_full_name,
        fr.full_name AS freelancer_full_name
      FROM contracts c
      JOIN users cl ON cl.id = c.client_id
      JOIN users fr ON fr.id = c.freelancer_id
      WHERE c.id = ? AND c.client_id = ?`,
      [contractId, clientId],
    );

    console.log("Contract query result:", contracts);

    const contract = contracts[0];

    if (!contract) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Contract not found or unauthorized",
      });
    }

    console.log("Contract found:", contract);
    console.log("Contract current status:", contract.status);

    const [updateResult] = await connection.execute(
      `UPDATE contracts
       SET status = 'ACTIVE',
           client_signed = TRUE,
           signed_at = NOW(),
           updated_at = NOW()
       WHERE id = ? AND client_id = ?`,
      [contractId, clientId],
    );

    console.log("Update result:", updateResult);
    console.log("Affected rows:", updateResult.affectedRows);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Failed to update contract",
      });
    }

    // Test with a raw simple insert first
    console.log("Attempting workspace insert with values:", {
      client_id: contract.client_id,
      freelancer_id: contract.freelancer_id,
      client_full_name: contract.client_full_name,
      freelancer_full_name: contract.freelancer_full_name,
      contract_id: contract.id,
    });

    const [workspaceResult] = await connection.execute(
      `INSERT INTO workspaces (
        client_id,
        freelancer_id,
        client_full_name,
        freelancer_full_name,
        contract_id
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        contract.client_id,
        contract.freelancer_id,
        contract.client_full_name,
        contract.freelancer_full_name,
        contract.id,
      ],
    );

    console.log("Workspace insert result:", workspaceResult);
    console.log("Workspace insertId:", workspaceResult.insertId);

    await connection.commit();
    console.log("Transaction committed successfully");

    res.json({
      success: true,
      message: "Contract accepted and workspace created",
      workspace_id: workspaceResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("=== ACCEPT CONTRACT ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error SQL:", error.sql);
    console.error("Full error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept contract",
      error: error.message,
      error_code: error.code,
    });
  } finally {
    connection.release();
  }
};

// Reject contract
export const rejectContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { rejection_reason } = req.body;
    const clientId = req.user.userId;

    await sqlPool.execute(
      `UPDATE contracts 
       SET status = 'REJECTED',
           rejection_reason = ?,
           updated_at = NOW()
       WHERE id = ? AND client_id = ? AND status = 'PENDING_CLIENT'`,
      [rejection_reason, contractId, clientId],
    );

    res.json({ success: true, message: "Contract rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject" });
  }
};
