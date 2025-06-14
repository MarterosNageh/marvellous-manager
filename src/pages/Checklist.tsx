
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ListCheck } from "lucide-react";

// Checklist item definition
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high";
}

// SOP reference data
const sopChecklist: ChecklistItem[] = [
  {
    id: "1",
    title: "Review Raw Footage",
    description: "Check all raw footage for quality, audio sync, and completeness.",
    category: "Pre-Edit",
    priority: "high"
  },
  {
    id: "2",
    title: "Organize Project Files",
    description: "Create proper folder structure and naming conventions.",
    category: "Pre-Edit",
    priority: "high"
  },
  {
    id: "3",
    title: "Backup Original Files",
    description: "Create backup copies of all source material.",
    category: "Pre-Edit",
    priority: "high"
  },
  {
    id: "4",
    title: "Create Rough Cut",
    description: "Assemble initial edit with basic story structure.",
    category: "Editing",
    priority: "medium"
  },
  {
    id: "5",
    title: "Fine Cut Editing",
    description: "Refine timing, pacing, and transitions.",
    category: "Editing",
    priority: "medium"
  },
  {
    id: "6",
    title: "Color Correction",
    description: "Apply color correction and grading.",
    category: "Post-Production",
    priority: "medium"
  },
  {
    id: "7",
    title: "Audio Mixing",
    description: "Balance audio levels, add music and sound effects.",
    category: "Post-Production",
    priority: "medium"
  },
  {
    id: "8",
    title: "Title and Graphics",
    description: "Add titles, lower thirds, and graphic elements.",
    category: "Post-Production",
    priority: "low"
  },
  {
    id: "9",
    title: "Quality Review",
    description: "Comprehensive review for technical and creative issues.",
    category: "Finalization",
    priority: "high"
  },
  {
    id: "10",
    title: "Export Final Version",
    description: "Export in required formats and specifications.",
    category: "Finalization",
    priority: "high"
  },
  {
    id: "11",
    title: "Archive Project",
    description: "Archive project files and create project documentation.",
    category: "Finalization",
    priority: "low"
  }
];

// Visual priority badge
function getPriorityBadge(priority: ChecklistItem["priority"]) {
  switch (priority) {
    case "high":
      return <Badge variant="destructive" className="uppercase text-xs">High</Badge>;
    case "medium":
      return <Badge className="uppercase text-xs">Medium</Badge>;
    case "low":
      return <Badge variant="secondary" className="uppercase text-xs">Low</Badge>;
    default:
      return null;
  }
}

const Checklist = () => {
  // Get unique categories in display order
  const categoryOrder = ["Pre-Edit", "Editing", "Post-Production", "Finalization"];
  const categories = categoryOrder.filter(cat =>
    sopChecklist.some(item => item.category === cat)
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-7 w-7 text-blue-700" />
          <h1 className="text-3xl font-bold text-gray-900">
            SOP: Media Post-Production Checklist
          </h1>
        </div>
        <p className="text-gray-700 mb-8 leading-relaxed">
          Welcome to the Media Post-Production Standard Operating Procedure. This knowledge base is a curated step-by-step reference to industry best practices for file-based, collaborative post-production. Browse the stages below to review essential tasks and guidance for each step.
        </p>
        <div className="space-y-10">
          {categories.map(category => (
            <section key={category} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ListCheck className="h-5 w-5 text-blue-500" />
                <h2 className="text-2xl font-semibold text-blue-900 tracking-tight">{category}</h2>
              </div>
              <div className="flex flex-col gap-4">
                {sopChecklist.filter(item => item.category === category).map(item => (
                  <Card key={item.id} className="border bg-gray-50">
                    <CardHeader className="flex flex-row gap-2 items-center pb-2">
                      <CardTitle className="flex-1 text-lg">{item.title}</CardTitle>
                      {getPriorityBadge(item.priority)}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-800">
                        {item.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 text-xs text-gray-500 text-center">
          This page is for reference use by editors, producers, and post staff. For process improvements contact your workflow lead.
        </div>
      </div>
    </MainLayout>
  );
};

export default Checklist;
