
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ProjectForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, addProject, updateProject } = useData();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (isEditMode) {
      const project = getProject(id);
      if (project) {
        setFormData({
          name: project.name,
          description: project.description || "",
        });
      }
    }
  }, [isEditMode, id, getProject]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isEditMode) {
        const project = getProject(id);
        if (project) {
          updateProject({
            ...project,
            ...formData,
          });
          toast({
            title: "Success",
            description: "Project updated successfully",
          });
        }
      } else {
        const newId = addProject(formData);
        toast({
          title: "Success",
          description: "Project added successfully",
        });
        navigate(`/projects/${newId}`);
        return; // Return early to prevent the second navigation
      }
      
      navigate("/projects");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the project",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Edit Project" : "Add Project"}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Project description (optional)"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Update Project" : "Add Project"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ProjectForm;
