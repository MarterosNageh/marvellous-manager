
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
import { Menu, HardDrive, Files, CalendarDays, BarChart, Settings } from "lucide-react";
import LogoMarvellous from "@/components/LogoMarvellous";
import { useAuth } from "@/context/AuthContext";

// Define a strong gradient and focused accent color for the sidebar
const SIDEBAR_BG = "bg-gradient-to-br from-[#1A1F2C] via-[#7E69AB] to-[#9b87f5]";
const SIDEBAR_ITEM_ACTIVE = "bg-[#F97316] text-white shadow-md"; // vivid orange for selected
const SIDEBAR_ITEM_HOVER = "hover:bg-[#8B5CF6] hover:text-white transition-colors"; // vivid purple for hover
const SIDEBAR_TEXT = "text-gray-100";
const SIDEBAR_ICON = "text-white group-hover:text-[#FFA99F] transition-colors"; // subtle orange on hover

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
  const { currentUser } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={`
        ${SIDEBAR_BG}
        text-white
        border-r-2 border-[#F97316]/70 shadow-xl
        ${collapsed ? "w-16" : "w-60"}
        transition-all duration-300
        z-30
      `}
    >
      <SidebarContent className="!bg-transparent rounded-none px-0">
        <SidebarGroup>
          <div
            className={`flex items-center justify-center my-5 ${collapsed ? "px-0" : "px-4"}`}
          >
            <Link to="/dashboard">
              {!collapsed ? (
                <LogoMarvellous className="h-12 w-auto drop-shadow-lg" />
              ) : (
                <LogoMarvellous className="h-9 w-auto" minimal />
              )}
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        group flex items-center gap-2 px-4 py-3 rounded-lg
                        font-semibold tracking-wide
                        ${SIDEBAR_TEXT}
                        ${isActive ? SIDEBAR_ITEM_ACTIVE : ""}
                        ${SIDEBAR_ITEM_HOVER}
                        transition shadow-sm
                        focus:outline-none focus:ring-2 focus:ring-[#F97316]/60
                      `}
                    >
                      <Link to={item.url}>
                        <item.icon className={`${SIDEBAR_ICON} ${collapsed ? "mx-auto" : ""} text-lg`} />
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {currentUser?.isAdmin &&
                adminItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`
                          group flex items-center gap-2 px-4 py-3 rounded-lg
                          font-semibold tracking-wide
                          ${SIDEBAR_TEXT}
                          ${isActive ? SIDEBAR_ITEM_ACTIVE : ""}
                          ${SIDEBAR_ITEM_HOVER}
                          transition shadow-sm
                          focus:outline-none focus:ring-2 focus:ring-[#F97316]/60
                        `}
                      >
                        <Link to={item.url}>
                          <item.icon className={`${SIDEBAR_ICON} ${collapsed ? "mx-auto" : ""} text-lg`} />
                          {!collapsed && <span className="ml-3">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              {/* Collapse/Expand icon at end */}
              <SidebarMenuItem key="collapse-trigger">
                <SidebarMenuButton
                  asChild
                  onClick={toggleSidebar}
                  isActive={false}
                  className={`
                    mt-4 mb-2 group flex items-center justify-center
                    ${SIDEBAR_ITEM_HOVER}
                    rounded-lg p-2
                  `}
                >
                  <button type="button" aria-label={collapsed ? "Expand" : "Collapse"}>
                    <Menu className={`${SIDEBAR_ICON} text-lg`} />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && (
          <span className="text-xs text-center opacity-80 block w-full pt-2 pb-4 font-semibold tracking-tight text-white">
            © Marvellous Manager 2025
          </span>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
