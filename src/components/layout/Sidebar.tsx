
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Menu, HardDrive, ListTodo, User, LogOut } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const sidebarItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <Menu className="h-5 w-5" />,
    },
    {
      title: "Machine Hards",
      href: "/hard-drives",
      icon: <HardDrive className="h-5 w-5" />,
    },
    {
      title: "Projects",
      href: "/projects",
      icon: <ListTodo className="h-5 w-5" />,
    },
  ];

  // Admin only
  if (currentUser?.isAdmin) {
    sidebarItems.push({
      title: "User Management",
      href: "/users",
      icon: <User className="h-5 w-5" />,
    });
  }

  // Task Manager section (coming soon)
  sidebarItems.push({
    title: "Task Manager",
    href: "/task-manager",
    icon: <ListTodo className="h-5 w-5" />,
  });

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-gray-100 border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <Link to="/dashboard" className="font-bold text-xl">
            Marvellous Manager
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {sidebarItems.map((item) => (
            <TooltipProvider key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md transition-colors",
                      location.pathname === item.href
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-700 hover:bg-gray-200 hover:text-gray-900",
                      collapsed && "justify-center"
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span className="ml-3">{item.title}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">{item.title}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "flex items-center text-gray-700 hover:bg-black hover:text-white transition-colors",
            collapsed && "justify-center w-full px-0"
          )}
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );
};
