
import { Link, useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarFooter, 
  useSidebar 
} from "@/components/ui/sidebar";
import { Menu, HardDrive, Files, CalendarDays, BarChart, Settings, LogOut } from "lucide-react";
import LogoMarvellous from "@/components/LogoMarvellous";
import { useAuth } from "@/context/AuthContext";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart
  },
  {
    title: "Projects",
    url: "/projects",
    icon: Files
  },
  {
    title: "Hard Drives",
    url: "/hard-drives",
    icon: HardDrive
  },
  {
    title: "Task Manager",
    url: "/task-manager",
    icon: Files
  },
  {
    title: "Shifts Schedule",
    url: "/shifts-schedule",
    icon: CalendarDays
  }
];
const adminItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  }
];

export function AppSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar 
      className={`bg-[#1A1F2C] text-white fixed top-0 right-0 h-screen z-40 transition-all duration-250 ${collapsed ? "w-16" : "w-64"} flex flex-col`}
      side="right"
    >
      <SidebarContent className="bg-slate-900 rounded-none flex flex-col h-full">
        {/* Top section: Logo and Collapse button */}
        <SidebarGroup>
          <div className={`flex items-center justify-between my-4 px-2 relative`}>
            <Link to="/dashboard" className="flex-1 flex justify-center">
              {/* Large logo, even larger when expanded */}
              {!collapsed 
                ? <LogoMarvellous className="h-20 w-auto mx-auto" />
                : <LogoMarvellous className="h-12 w-auto mx-auto" minimal />
              }
            </Link>
            <button
              type="button"
              aria-label={collapsed ? "Expand" : "Collapse"}
              onClick={toggleSidebar}
              className="ml-2 rounded-md p-1 hover:bg-white/10 transition-all absolute top-2 right-2 z-10"
              style={{
                right: collapsed ? 2 : 2
              }}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </SidebarGroup>

        {/* Nav Menu */}
        <SidebarGroup className="flex-1 flex flex-col">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-0" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {currentUser?.isAdmin && adminItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-0" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer: Logout Button and copyright */}
        <SidebarFooter className="pb-4">
          <div className="flex flex-col items-center">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center text-white gap-2 px-4 py-2 rounded-md hover:bg-white/20 transition"
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Logout</span>}
            </button>
            {!collapsed && (
              <span className="text-[10px] text-center opacity-60 block w-full mt-2">
                © Marvellous Manager 2025
              </span>
            )}
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
