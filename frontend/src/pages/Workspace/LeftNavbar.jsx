import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckSquare,
  Upload,
  MessageSquare,
  PenTool,
  DollarSign,
  Clock,
  Video,
  Eye,
  CheckCircle,
  Download,
  MessageCircle,
  PhoneCall,
  Menu,
  X,
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
      description: "Create and manage your tasks"
    },
    {
      name: "Upload Deliverables",
      path: "/SubmitWork",
      icon: Upload,
      description: "Submit your completed work"
    },
    {
      name: "Chat",
      path: "/chat",
      icon: MessageSquare,
      description: "Message with client",
      badge: "shared"
    },
    {
      name: "Draw Area",
      path: "/workspace/draw-area",
      icon: PenTool,
      description: "Collaborative drawing workspace",
      badge: "shared"
    },
    {
      name: "Milestone Approval",
      path: "/mileStoneApproval",
      icon: DollarSign,
      description: "Request milestone approvals"
    },
    {
      name: "Hourly Billing",
      path: "/hourlyBilling",
      icon: Clock,
      description: "Track billable hours"
    },
    {
      name: "Video Call",
      path: "/start-video",
      icon: Video,
      description: "Start video conference"
    }
  ],
  clientRoutes: [
    {
      name: "View Tasks",
      path: "/viewTasks",
      icon: Eye,
      description: "Monitor project tasks"
    },
    {
      name: "Approve Milestones",
      path: "/approveMilestones",
      icon: CheckCircle,
      description: "Review and approve milestones"
    },
    {
      name: "Chat",
      path: "/chat",
      icon: MessageSquare,
      description: "Message with freelancer",
      badge: "shared"
    },
    {
      name: "Draw Area",
      path: "/draw",
      icon: PenTool,
      description: "Collaborative drawing workspace",
      badge: "shared"
    },
    {
      name: "Download Files",
      path: "/getDeliverables",
      icon: Download,
      description: "Access project deliverables"
    },
    {
      name: "Comments",
      path: "/comments",
      icon: MessageCircle,
      description: "Comment on deliverables"
    },
    {
      name: "Join Call",
      path: "/join-video",
      icon: PhoneCall,
      description: "Join video conference"
    }
  ]
};

const NavItem = ({ route, isActive }) => {
  const Icon = route.icon;
  
  return (
    <Link
      to={route.path}
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-lg
        transition-all duration-200 ease-in-out
        ${isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
        }
      `}
    >
      <Icon 
        size={20} 
        className={`
          transition-transform duration-200
          ${isActive ? 'scale-110' : 'group-hover:scale-110'}
        `}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {route.name}
          </span>
          {route.badge && (
            <span className={`
              text-xs px-2 py-0.5 rounded-full font-semibold
              ${isActive 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 text-blue-600'
              }
            `}>
              {route.badge}
            </span>
          )}
        </div>
        <p className={`
          text-xs mt-0.5 truncate
          ${isActive ? 'text-blue-100' : 'text-gray-500'}
        `}>
          {route.description}
        </p>
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}
    </Link>
  );
};

const FreelancerNavbarWorkspace = ({ onClose }) => {
  const location = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">Freelancer</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500">Workspace Dashboard</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {routesAll.freelancerRoutes.map((route, index) => (
          <NavItem
            key={index}
            route={route}
            isActive={location.pathname === route.path}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Home size={18} />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

const ClientNavbarWorkspace = ({ onClose }) => {
  const location = useLocation();
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">Client</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500">Workspace Dashboard</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {routesAll.clientRoutes.map((route, index) => (
          <NavItem
            key={index}
            route={route}
            isActive={location.pathname === route.path}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Home size={18} />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

const LeftNavbar = ({ user_type = "FREELANCER" }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileNav = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileNav}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
      >
        <Menu size={24} className="text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeMobileNav}
        />
      )}

      {/* Sidebar - Changed to h-screen and w-72 (fixed height) */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 
          h-screen w-72
          bg-white border-r border-gray-200 shadow-xl
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {user_type === "FREELANCER" ? (
          <FreelancerNavbarWorkspace onClose={closeMobileNav} />
        ) : user_type === "CLIENT" ? (
          <ClientNavbarWorkspace onClose={closeMobileNav} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Invalid user type</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default LeftNavbar;
export { routesAll };