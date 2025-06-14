
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

const mediaPostProductionChecklist: ChecklistItem[] = [
  {
    id: "1",
    title: "Review Raw Footage",
    description: "Check all raw footage for quality, audio sync, and completeness",
    category: "Pre-Edit",
    completed: false,
    priority: "high"
  },
  {
    id: "2",
    title: "Organize Project Files",
    description: "Create proper folder structure and naming conventions",
    category: "Pre-Edit",
    completed: false,
    priority: "high"
  },
  {
    id: "3",
    title: "Backup Original Files",
    description: "Create backup copies of all source material",
    category: "Pre-Edit",
    completed: false,
    priority: "high"
  },
  {
    id: "4",
    title: "Create Rough Cut",
    description: "Assemble initial edit with basic story structure",
    category: "Editing",
    completed: false,
    priority: "medium"
  },
  {
    id: "5",
    title: "Fine Cut Editing",
    description: "Refine timing, pacing, and transitions",
    category: "Editing",
    completed: false,
    priority: "medium"
  },
  {
    id: "6",
    title: "Color Correction",
    description: "Apply color correction and grading",
    category: "Post-Production",
    completed: false,
    priority: "medium"
  },
  {
    id: "7",
    title: "Audio Mixing",
    description: "Balance audio levels, add music and sound effects",
    category: "Post-Production",
    completed: false,
    priority: "medium"
  },
  {
    id: "8",
    title: "Title and Graphics",
    description: "Add titles, lower thirds, and graphic elements",
    category: "Post-Production",
    completed: false,
    priority: "low"
  },
  {
    id: "9",
    title: "Quality Review",
    description: "Comprehensive review for technical and creative issues",
    category: "Finalization",
    completed: false,
    priority: "high"
  },
  {
    id: "10",
    title: "Export Final Version",
    description: "Export in required formats and specifications",
    category: "Finalization",
    completed: false,
    priority: "high"
  },
  {
    id: "11",
    title: "Archive Project",
    description: "Archive project files and create project documentation",
    category: "Finalization",
    completed: false,
    priority: "low"
  }
];

const Checklist = () => {
  const [items, setItems] = useState(mediaPostProductionChecklist);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const resetChecklist = () => {
    setItems(items.map(item => ({ ...item, completed: false })));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const categories = Array.from(new Set(items.map(item => item.category)));
  const completedCount = items.filter(item => item.completed).length;
  const progressPercentage = Math.round((completedCount / items.length) * 100);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Standard Operating Procedure</h1>
            <p className="text-gray-600 mt-2">Media Post Production Checklist</p>
          </div>
          <Button onClick={resetChecklist} variant="outline">
            Reset Checklist
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Progress Overview
            </CardTitle>
            <CardDescription>
              {completedCount} of {items.length} tasks completed ({progressPercentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {categories.map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-xl">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items
                    .filter(item => item.category === category)
                    .map(item => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                          item.completed 
                            ? "bg-green-50 border-green-200" 
                            : "bg-white border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.completed}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={item.id}
                              className={`font-medium cursor-pointer ${
                                item.completed ? "line-through text-gray-500" : "text-gray-900"
                              }`}
                            >
                              {item.title}
                            </label>
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                          </div>
                          <p className={`text-sm ${
                            item.completed ? "line-through text-gray-400" : "text-gray-600"
                          }`}>
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {item.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Checklist;
