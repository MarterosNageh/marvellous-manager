
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { HardDrive, Users, Files, CalendarDays, BarChart, Settings, LogOut } from "lucide-react";
import LogoMarvellous from "@/components/LogoMarvellous";
import { useAuth } from "@/context/AuthContext";

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
}];

const adminItems = [{
  title: "Settings",
  url: "/settings",
  icon: Settings
}];

export function AppSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const fullMenu = [...items, ...(currentUser?.isAdmin ? adminItems : [])];
  
  return (
    <Sidebar collapsible="none">
      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          <div className="flex items-center justify-center my-8">
            <Link to="/dashboard">
              <LogoMarvellous className="h-16 w-auto" />
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fullMenu.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname.startsWith(item.url)} 
                    className={`
                      text-white 
                      hover:bg-transparent 
                      hover:text-gray-300 
                      ${location.pathname.startsWith(item.url) ? 'bg-transparent font-semibold' : ''}
                    `}
                  >
                    <Link to={item.url} className="flex items-center">
                      <item.icon className="mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem key="logout">
                <SidebarMenuButton 
                  asChild 
                  isActive={false} 
                  className="text-white hover:text-red-500 hover:bg-transparent"
                >
                  <button type="button" onClick={logout} className="flex items-center w-full">
                    <LogOut className="mr-2" />
                    <span>Logout</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
