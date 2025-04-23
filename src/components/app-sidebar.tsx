
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Menu, HardDrive, Users, Files, CalendarDays, BarChart, Settings } from "lucide-react";
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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-center my-4">
            <Link to="/dashboard">
              <LogoMarvellous className="h-10 mx-auto" />
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {currentUser?.isAdmin && adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <span className="text-[10px] text-center opacity-60 block w-full">© Marvellous Manager 2025</span>
      </SidebarFooter>
    </Sidebar>
  );
}
