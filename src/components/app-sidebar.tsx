
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Search,
  BarChart,
  FileText,
  ShoppingCart,
  Settings,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Search",
    url: "/search",
    icon: Search
  },
  {
    title: "Insights",
    url: "/insights",
    icon: BarChart
  },
  {
    title: "Docs",
    url: "/docs",
    icon: FileText
  },
  {
    title: "Products",
    url: "/products",
    icon: ShoppingCart
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare
  }
];

export function AppSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  return (
    <Sidebar className="bg-slate-900 dark:bg-slate-950">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-center my-6">
            <Link to="/dashboard">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
            </Link>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url)}
                    className="text-gray-400 hover:text-white hover:bg-slate-800"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto mb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  <Link to="/account" className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <span>Account</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="text-gray-400 hover:text-white hover:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-3 w-full"
                  >
                    <LogOut className="w-5 h-5" />
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
