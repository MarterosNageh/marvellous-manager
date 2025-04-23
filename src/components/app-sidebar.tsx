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

/**
 * AppSidebar: a non-collapsible sidebar with interactive menu items and a dynamic logo.
 */
export function AppSidebar() {
  const {
    currentUser,
    logout
  } = useAuth();
  const location = useLocation();

  // Full list of visible menu items for the user
  const fullMenu = [...items, ...(currentUser?.isAdmin ? adminItems : [])];
  return <Sidebar collapsible="none">
      <SidebarContent className="bg-slate-900">
        <SidebarGroup>
          <div className="flex items-center justify-center my-8">
            <Link to="/dashboard">
              <LogoMarvellous className="h-16 w-auto" />
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fullMenu.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              {/* Logout menu item */}
              <SidebarMenuItem key="logout">
                <SidebarMenuButton asChild isActive={false} className="hover:text-destructive">
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
      {/* No SidebarFooter for logout anymore */}
    </Sidebar>;
}