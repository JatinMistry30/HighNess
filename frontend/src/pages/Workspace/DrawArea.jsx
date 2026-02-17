import React, { useState, useCallback, useEffect, useRef } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import io from 'socket.io-client';
import "@excalidraw/excalidraw/index.css";
import { 
  Menu, 
  X, 
  Save, 
  Download, 
  Upload,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckSquare,
  Upload as UploadIcon,
  MessageSquare,
  PenTool,
  DollarSign,
  Clock,
  Video,
  Eye,
  CheckCircle,
  Download as DownloadIcon,
  MessageCircle,
  PhoneCall,
  Home,
  Settings,
  LogOut
} from "lucide-react";

const routesAll = {
  freelancerRoutes: [
    {
      name: "Create Tasks",
      path: "/createTask",
      icon: CheckSquare,
    },
    {
      name: "Upload Deliverables",
      path: "/SubmitWork",
      icon: UploadIcon,
    },
    {
      name: "Chat",
      path: "/chat",
      icon: MessageSquare,
    },
    {
      name: "Draw Area",
      path: "/workspace/draw-area",
      icon: PenTool,
    },
    {
      name: "Milestone Approval",
      path: "/mileStoneApproval",
      icon: DollarSign,
    },
    {
      name: "Hourly Billing",
      path: "/hourlyBilling",
      icon: Clock,
    },
    {
      name: "Video Call",
      path: "/start-video",
      icon: Video,
    }
  ],
  clientRoutes: [
    {
      name: "View Tasks",
      path: "/viewTasks",
      icon: Eye,
    },
    {
      name: "Approve Milestones",
      path: "/approveMilestones",
      icon: CheckCircle,
    },
    {
      name: "Chat",
      path: "/chat",
      icon: MessageSquare,
    },
    {
      name: "Draw Area",
      path: "/workspace/draw-area",
      icon: PenTool,
    },
    {
      name: "Download Files",
      path: "/getDeliverables",
      icon: DownloadIcon,
    },
    {
      name: "Comments",
      path: "/comments",
      icon: MessageCircle,
    },
    {
      name: "Join Call",
      path: "/join-video",
      icon: PhoneCall,
    }
  ]
};

const NavItem = ({ route, isActive, isCollapsed }) => {
  const Icon = route.icon;
  
  return (
    <Link
      to={route.path}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-md
        transition-all duration-200
        ${isActive 
          ? 'bg-gray-900 text-white' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
      title={isCollapsed ? route.name : ''}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">
          {route.name}
        </span>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r" />
      )}
    </Link>
  );
};

const CollapsibleNavbar = ({ userType, isOpen, onClose }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const routes = userType === "FREELANCER" 
    ? routesAll.freelancerRoutes 
    : routesAll.clientRoutes;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 z-50 h-screen
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex-1">
                <h2 className="text-base font-semibold text-gray-900">
                  {userType === "FREELANCER" ? "Freelancer" : "Client"}
                </h2>
                <p className="text-xs text-gray-500">Workspace</p>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hidden lg:block"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {routes.map((route, index) => (
              <NavItem
                key={index}
                route={route}
                isActive={location.pathname === route.path}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3 space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              title={isCollapsed ? "Dashboard" : ''}
            >
              <Home size={18} />
              {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              title={isCollapsed ? "Settings" : ''}
            >
              <Settings size={18} />
              {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
            </Link>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors"
              title={isCollapsed ? "Logout" : ''}
            >
              <LogOut size={18} />
              {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const DrawArea = ({ workspaceId, userId, userName, userType }) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [theme, setTheme] = useState("light");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const socketRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  // Initialize Socket.IO
  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      query: { workspaceId, userId, userName, userType }
    });

    socketRef.current.emit('join-workspace', { workspaceId, userId, userName, userType });

    socketRef.current.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socketRef.current.on('canvas-update', (data) => {
      if (data.userId !== userId && excalidrawAPI) {
        isRemoteUpdateRef.current = true;
        excalidrawAPI.updateScene({
          elements: data.elements,
          appState: data.appState
        });
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [workspaceId, userId, userName, userType, excalidrawAPI]);

  // Auto-save
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      autoSaveCanvas();
    }, 5000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [excalidrawAPI]);

  // Load canvas
  useEffect(() => {
    if (excalidrawAPI) {
      loadCanvas();
    }
  }, [excalidrawAPI]);

  const handleChange = useCallback((elements, appState, files) => {
    if (!isRemoteUpdateRef.current && socketRef.current) {
      socketRef.current.emit('canvas-update', {
        workspaceId,
        userId,
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
        }
      });
    }
  }, [workspaceId, userId]);

  const autoSaveCanvas = async () => {
    if (!excalidrawAPI) return;

    setIsSaving(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();

      await fetch('http://localhost:5000/api/canvas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          canvasData: JSON.stringify({ elements, appState })
        })
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadCanvas = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/canvas/load/${workspaceId}`);
      const data = await response.json();

      if (data.canvasData && excalidrawAPI) {
        const parsedData = JSON.parse(data.canvasData);
        excalidrawAPI.updateScene({
          elements: parsedData.elements || [],
          appState: parsedData.appState || {},
        });
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  const handleSaveAsImage = useCallback(async () => {
    if (!excalidrawAPI) return;
    
    try {
      const blob = await excalidrawAPI.getSceneElementsAsBlob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `workspace-${workspaceId}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Export failed:", error);
    }
  }, [excalidrawAPI, workspaceId]);

  const uiOptions = {
    canvasActions: {
      changeViewBackgroundColor: true,
      clearCanvas: true,
      export: { saveFileToDisk: true },
      loadScene: false,
      saveToActiveFile: false,
      toggleTheme: true,
    },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Collapsible Sidebar */}
      <CollapsibleNavbar 
        userType={userType}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-700"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Collaborative Canvas
                </h1>
                <p className="text-xs text-gray-500">
                  Workspace: {workspaceId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Active Users */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
                <Users size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {activeUsers.length}
                </span>
              </div>

              {/* Save Button */}
              <button
                onClick={autoSaveCanvas}
                disabled={isSaving}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                  transition-colors
                  ${isSaving
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                  }
                `}
              >
                <Save size={16} />
                <span className="hidden sm:inline">
                  {isSaving ? 'Saving...' : 'Save'}
                </span>
              </button>

              {/* Export Button */}
              <button
                onClick={handleSaveAsImage}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Auto-save indicator */}
          {lastSaved && (
            <div className="mt-2 text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full">
            <Excalidraw
              ref={(api) => setExcalidrawAPI(api)}
              theme={theme}
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
                scrollToContent: true
              }}
              UIOptions={uiOptions}
              renderTopRightUI={() => null}
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default DrawArea;