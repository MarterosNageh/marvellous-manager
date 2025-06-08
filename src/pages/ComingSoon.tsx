import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const ComingSoon = () => {
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-8 p-4 bg-primary/10 rounded-full">
              <CalendarDays className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Staff Schedule</h1>
            <p className="text-xl text-muted-foreground mb-8">
              We're working on something amazing! Our staff scheduling system is coming soon.
            </p>
            <div className="grid gap-4 text-left text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Efficient shift management</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Smart scheduling algorithms</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Time-off request handling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Real-time schedule updates</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ComingSoon; 