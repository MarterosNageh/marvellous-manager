import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const HardDriveForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const navigate = useNavigate();
  const { getHardDrive, addHardDrive, updateHardDrive, projects } = useData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    projectId: projectId || "",
    capacity: "",
    freeSpace: "",
    data: "",
    cables: {
      thunderbolt3: false,
      typeC: false,
      power: false,
      usb3: false,
      other: ""
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (id) {
      const hardDrive = getHardDrive(id);
      if (hardDrive) {
        setFormData({
          name: hardDrive.name,
          serialNumber: hardDrive.serialNumber,
          projectId: hardDrive.projectId,
          capacity: hardDrive.capacity,
          freeSpace: hardDrive.freeSpace,
          data: hardDrive.data,
          cables: hardDrive.cables
        });
      }
    }
  }, [id, getHardDrive]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (key: keyof typeof formData.cables, checked: boolean) => {
    if (typeof checked === "boolean") {
      setFormData(prev => ({
        ...prev,
        cables: {
          ...prev.cables,
          [key]: checked
        }
      }));
    }
  };
  
  const handleProjectChange = (value: string) => {
    setFormData(prev => ({ ...prev, projectId: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (id) {
        const hardDrive = getHardDrive(id);
        if (!hardDrive) throw new Error("Hard drive not found");
        
        await updateHardDrive({
          ...hardDrive,
          ...formData
        });
        
        toast({
          title: "Success",
          description: "Hard drive updated successfully",
        });
        
        navigate(`/hard-drives/${id}`);
      } else {
        const newId = await addHardDrive(formData);
        
        toast({
          title: "Success",
          description: "Hard drive created successfully",
        });
        
        setTimeout(() => {
          navigate(`/hard-drives/${newId}`);
        }, 100);
      }
    } catch (error) {
      console.error("Error saving hard drive:", error);
      toast({
        title: "Error",
        description: "Failed to save hard drive",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/hard-drives")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{id ? "Edit Hard Drive" : "New Hard Drive"}</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{id ? "Edit Hard Drive Details" : "Add New Hard Drive"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Hard Drive Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number *</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={formData.projectId} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="E.g., 4TB"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="freeSpace">Free Space</Label>
                  <Input
                    id="freeSpace"
                    name="freeSpace"
                    value={formData.freeSpace}
                    onChange={handleChange}
                    placeholder="E.g., 2.5TB"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data">Data Description</Label>
                <Textarea
                  id="data"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What's stored on this drive?"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Available Cables</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="thunderbolt3" 
                      checked={formData.cables.thunderbolt3} 
                      onCheckedChange={(checked) => handleCheckboxChange("thunderbolt3", !!checked)}
                    />
                    <Label htmlFor="thunderbolt3" className="cursor-pointer">Thunderbolt 3</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="typeC" 
                      checked={formData.cables.typeC} 
                      onCheckedChange={(checked) => handleCheckboxChange("typeC", !!checked)}
                    />
                    <Label htmlFor="typeC" className="cursor-pointer">USB Type C</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="power" 
                      checked={formData.cables.power} 
                      onCheckedChange={(checked) => handleCheckboxChange("power", !!checked)}
                    />
                    <Label htmlFor="power" className="cursor-pointer">Power Cable</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="usb3" 
                      checked={formData.cables.usb3} 
                      onCheckedChange={(checked) => handleCheckboxChange("usb3", !!checked)}
                    />
                    <Label htmlFor="usb3" className="cursor-pointer">USB 3.0</Label>
                  </div>
                </div>
                
                <div className="mt-2">
                  <Label htmlFor="otherCables">Other Cables</Label>
                  <Input
                    id="otherCables"
                    value={formData.cables.other}
                    onChange={(e) => handleCheckboxChange("other", e.target.value as any)}
                    placeholder="List any other cables"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate("/hard-drives")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (id ? "Update Hard Drive" : "Create Hard Drive")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HardDriveForm;
