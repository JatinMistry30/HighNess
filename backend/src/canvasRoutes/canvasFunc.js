import sqlPool from "../DataBase/DB.js";

export const saveCanvas = async (req, res) => {
  try {
    const { workspaceId, canvasData } = req.body;
    const userId = req.user.id;
    if (!workspaceId || !canvasData) {
      return res.status(400).json({
        success: false,
        message: "workspaceId and canvasData are required",
      });
    }

    // Verifying the user belongs to this workspace
    const [rows] = await sqlPool.execute(
      `SELECT id FROM workspaces WHERE id = ? AND (client_id = ? OR freelancer_id = ?)`,
      [workspaceId, userId, userId],
    );
    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this workspace",
      });
    }
    // Upsert canvas data (insert or update)
    await sqlPool.execute(
      `INSERT INTO workspace_canvas (workspace_id, canvas_data, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE canvas_data = VALUES(canvas_data), updated_at = NOW()`,
      [workspaceId, canvasData],
    );

    res.json({
      success: true,
      message: "Canvas saved successfully",
    });
  } catch (error) {
    console.error("Save canvas error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save canvas",
    });
  }
};

// load canvas
export const loadCanvas = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // verifying if user belongs to this workspace
    const [accessRows] = await sqlPool.execute(
      `SELECT id FROM workspaces WHERE id = ? AND (client_id = ? OR freelancer_id = ?)`,
      [workspaceId, userId, userId],
    );
    if (accessRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this workspace",
      });
    }

    const [rows] = await sqlPool.execute(
      `SELECT canvas_data, updated_at FROM workspace_canvas WHERE workspace_id = ?`,
      [workspaceId],
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        canvasData: null,
        message: "No canvas data found",
      });
    }

    res.json({
      success: true,
      canvasData: rows[0].canvas_data,
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error("Load canvas error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load canvas",
    });
  }
};
