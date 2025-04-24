
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export const Header = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="mr-4"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Marvellous</h1>
      </div>
    </header>
  );
};
