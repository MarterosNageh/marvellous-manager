
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Menu, HardDrive, Files, CalendarDays, BarChart, Settings } from "lucide-react";
import LogoMarvellous from "@/components/LogoMarvellous";
import { useAuth } from "@/context/AuthContext";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart },
  { title: "Projects", url: "/projects", icon: Files },
  { title: "Hard Drives", url: "/hard-drives", icon: HardDrive },
  { title: "Task Manager", url: "/task-manager", icon: Files },
  { title: "Shifts Schedule", url: "/shifts-schedule", icon: CalendarDays },
];

const adminItems = [
  { title: "Settings", url: "/settings", icon: Settings }
];

export function AppSidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={`bg-[#1A1F2C] text-white ${collapsed ? "w-16" : "w-56"} transition-all duration-250`}>
      <SidebarContent>
        <SidebarGroup>
          <div className={`flex items-center justify-center my-4 ${collapsed ? "px-0" : "px-2"}`}>
            <Link to="/dashboard">
              {/* Logo only if not collapsed */}
              {!collapsed && <LogoMarvellous className="h-10 mx-auto" />}
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          {/* Remove Navigation label */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-0" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {currentUser?.isAdmin && adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-0" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* Collapse/Expand icon at end */}
              <SidebarMenuItem key="collapse-trigger">
                <SidebarMenuButton asChild onClick={toggleSidebar} isActive={false}>
                  <button type="button" aria-label={collapsed ? "Expand" : "Collapse"}>
                    <Menu className="mr-0" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {collapsed ? null : (
          <span className="text-[10px] text-center opacity-60 block w-full">© Marvellous Manager 2025</span>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
