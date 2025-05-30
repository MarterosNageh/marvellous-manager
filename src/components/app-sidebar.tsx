
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { HardDrive, Files, CalendarDays, BarChart, Settings, LogOut, BookOpen, FileText } from "lucide-react";
import LogoMarvellous from "@/components/LogoMarvellous";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: BarChart
}, {
  title: "Projects",
  url: "/projects",
  icon: Files
}, {
  title: "Hard Drives",
  url: "/hard-drives",
  icon: HardDrive
}, {
  title: "Task Manager",
  url: "/task-manager",
  icon: Files
}, {
  title: "Shifts Schedule",
  url: "/shifts-schedule",
  icon: CalendarDays
}, {
  title: "Notes",
  url: "/notes",
  icon: FileText
}, {
  title: "Knowledge Base",
  url: "/knowledge-base",
  icon: BookOpen
}];

const adminItems = [{
  title: "Settings",
  url: "/settings",
  icon: Settings
}];

export function AppSidebar() {
  const {
    currentUser,
    logout
  } = useAuth();
  const location = useLocation();
  const {
    state,
    toggleSidebar
  } = useSidebar();
  const fullMenu = [...items, ...(currentUser?.isAdmin ? adminItems : [])];
  
  return <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full bg-gray-900">
        <SidebarGroup className="flex-none">
          <div className={cn("flex items-center justify-between py-4 px-4", state === "collapsed" ? "justify-center" : "")}>
            <Link to="/dashboard" className={cn("transition-opacity", state === "collapsed" ? "w-8 h-8" : "w-32")}>
              <LogoMarvellous className="h-full w-full filter invert" />
            </Link>
            
          </div>
        </SidebarGroup>

        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {fullMenu.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)} className={cn("text-white hover:bg-gray-600 transition-colors hover:text-white", location.pathname.startsWith(item.url) ? "bg-gray-800 font-semibold" : "")} tooltip={state === "collapsed" ? item.title : undefined}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="flex-none">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-white hover:bg-red-600/20 hover:text-red-500 transition-colors" tooltip={state === "collapsed" ? "Logout" : undefined}>
                  <button onClick={logout} className="flex items-center gap-2 w-full">
                    <LogOut className="h-4 w-4" />
                    <span>
                      {state !== "collapsed" && currentUser?.username ? 
                        `Logout (${currentUser.username})` : 
                        "Logout"
                      }
                    </span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}
