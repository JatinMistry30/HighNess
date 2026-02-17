import sqlPool from "../DataBase/DB.js";

export const fetchExistingWorkspaces = async (req, res) => {


  try {
    const userId = req.user.id;

    const [workspaces] = await sqlPool.execute(
      `
      SELECT
        w.id,
        w.client_id,
        w.freelancer_id,
        w.client_full_name,
        w.freelancer_full_name,
        w.contract_id,
        w.status,
        w.created_at,
        u.user_type
      FROM workspaces w
      -- join user table to get the current user's type
      JOIN users u ON u.id = ?
      WHERE w.client_id = ? OR w.freelancer_id = ?
      ORDER BY w.created_at DESC
      `,
      [userId, userId, userId]
    );

    res.json({
      success: true,
      workspaces,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch workspaces",
    });
  }
};
