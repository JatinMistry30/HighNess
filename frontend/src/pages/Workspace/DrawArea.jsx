import React, { useState, useCallback, useEffect, useRef } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { io } from "socket.io-client";
import "@excalidraw/excalidraw/index.css";
import { Save, Download, Users, Wifi, WifiOff } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const SAFE_APP_STATE_KEYS = [
  "viewBackgroundColor",
  "currentItemStrokeColor",
  "currentItemStrokeWidth",
  "currentItemRoughness",
  "gridSize",
];

const sanitizeAppState = (appState) => {
  if (!appState || typeof appState !== "object") return {};
  const safe = {};
  for (const key of SAFE_APP_STATE_KEYS) {
    if (appState[key] !== undefined) safe[key] = appState[key];
  }
  return safe;
};

const DrawArea = () => {
  const { id: workspaceId } = useParams();
  const { user } = useAuth();
  const userId   = user?.id;
  const userName = user?.full_name ?? user?.name ?? user?.username;
  const userType = user?.user_type;
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [activeUsers, setActiveUsers]     = useState([]);
  const [isSaving, setIsSaving]           = useState(false);
  const [lastSaved, setLastSaved]         = useState(null);
  const [isConnected, setIsConnected]     = useState(false);
  const [saveError, setSaveError]         = useState(null);

  const socketRef          = useRef(null);
  const autoSaveTimerRef   = useRef(null);
  const isRemoteUpdateRef  = useRef(false);
  const excalidrawAPIRef   = useRef(null);

  // Keep a ref in sync so the socket-setup effect (which only runs once
  // per workspace/user) can always reach the *current* API instance
  // without needing to be re-run every time excalidrawAPI changes.
  useEffect(() => {
    excalidrawAPIRef.current = excalidrawAPI;
  }, [excalidrawAPI]);

  useEffect(() => {
    const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const socket = io(BACKEND, {
      query: { workspaceId, userId, userName, userType },
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect",    () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("active-users", (users) => setActiveUsers(users));

    socket.on("canvas-update", (data) => {
      if (data.userId === userId) return;
      const api = excalidrawAPIRef.current;
      if (!api) return;

      isRemoteUpdateRef.current = true;
      api.updateScene({
        elements: data.elements,
        appState: sanitizeAppState(data.appState),
      });
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, userId, userName, userType]);

  useEffect(() => {
    if (!excalidrawAPI) return;

    const load = async () => {
      try {
        const res = await api.get(`/canvas/load/${workspaceId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (res.data.success && res.data.canvasData) {
          const parsed = JSON.parse(res.data.canvasData);
          excalidrawAPI.updateScene({
            elements: parsed.elements ?? [],
            appState: sanitizeAppState(parsed.appState),
          });
        }
      } catch (err) {
        console.error("Canvas load error:", err);
      }
    };

    load();
  }, [excalidrawAPI, workspaceId]);

  const saveCanvas = useCallback(async () => {
    const api_ = excalidrawAPIRef.current;
    if (!api_) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const elements = api_.getSceneElements();
      const appState  = sanitizeAppState(api_.getAppState());

      await api.post(
        "/canvas/save",
        {
          workspaceId,
          canvasData: JSON.stringify({ elements, appState }),
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setLastSaved(new Date());
    } catch (err) {
      console.error("Canvas save error:", err);
      setSaveError("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(saveCanvas, 5000);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [saveCanvas]);

  const handleChange = useCallback(
    (elements, appState) => {
      if (isRemoteUpdateRef.current) return;
      if (!socketRef.current?.connected) return;

      socketRef.current.emit("canvas-update", {
        workspaceId,
        userId,
        elements,
        appState: sanitizeAppState(appState),
      });
    },
    [workspaceId, userId]
  );

  const handleExport = useCallback(async () => {
    if (!excalidrawAPI) return;
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files:    excalidrawAPI.getFiles(),
        mimeType: "image/png",
      });
      const link  = document.createElement("a");
      link.href   = URL.createObjectURL(blob);
      link.download = `canvas-workspace-${workspaceId}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [excalidrawAPI, workspaceId]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              Collaborative Canvas
            </h1>
            <p className="text-xs text-gray-500">Workspace: {workspaceId}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isConnected ? "Live" : "Offline"}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-md">
              <Users size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {activeUsers.length}
              </span>
              <div className="flex -space-x-1 ml-1">
                {activeUsers.slice(0, 3).map((u) => (
                  <div
                    key={u.socketId}
                    title={`${u.userName} (${u.userType})`}
                    className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white ${
                      u.userType === "FREELANCER"
                        ? "bg-violet-500"
                        : "bg-emerald-500"
                    }`}
                  >
                    {u.userName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={saveCanvas}
              disabled={isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isSaving
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              <Save size={14} />
              <span className="hidden sm:inline">
                {isSaving ? "Saving…" : "Save"}
              </span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
        <div className="mt-1 h-4 flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saveError && (
            <span className="text-xs text-red-500">{saveError}</span>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={handleChange}
          initialData={{
            elements: [],
            appState: {
              viewBackgroundColor: "#ffffff",
              currentItemStrokeColor: "#1a1a1a",
              currentItemStrokeWidth: 1,
              currentItemRoughness: 0,
              gridSize: null,
              zoom: { value: 1 },
            },
            scrollToContent: true,
          }}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: { saveFileToDisk: false },
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: true,
            },
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
            <MainMenu.DefaultItems.ToggleTheme />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Hints.MenuHint />
            <WelcomeScreen.Hints.ToolbarHint />
            <WelcomeScreen.Hints.HelpHint />
          </WelcomeScreen>
        </Excalidraw>
      </main>
    </div>
  );
};

export default DrawArea;