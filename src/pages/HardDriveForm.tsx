
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const HardDriveForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getHardDrive, addHardDrive, updateHardDrive, projects } = useData();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    projectId: "",
    capacity: "",
    freeSpace: "",
    data: "",
    cables: {
      thunderbolt3: false,
      typeC: false,
      power: false,
      usb3: false,
      other: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const hardDrive = getHardDrive(id);
      if (hardDrive) {
        setFormData({
          name: hardDrive.name,
          serialNumber: hardDrive.serialNumber,
          projectId: hardDrive.projectId,
          capacity: hardDrive.capacity,
          freeSpace: hardDrive.freeSpace,
          data: hardDrive.data,
          cables: hardDrive.cables,
        });
      }
    }
  }, [isEditMode, id, getHardDrive]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCableChange = (cable: keyof typeof formData.cables, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      cables: { ...prev.cables, [cable]: checked },
    }));
  };

  const handleCableOtherChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      cables: { ...prev.cables, other: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.serialNumber || !formData.projectId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isEditMode) {
        const hardDrive = getHardDrive(id);
        if (hardDrive) {
          updateHardDrive({
            ...hardDrive,
            ...formData,
          });
          toast({
            title: "Success",
            description: "Hard drive updated successfully",
          });
        }
      } else {
        const newId = addHardDrive(formData);
        toast({
          title: "Success",
          description: "Hard drive added successfully",
        });
        navigate(`/hard-drives/${newId}`);
        return; // Return early to prevent the second navigation
      }
      
      navigate("/hard-drives");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the hard drive",
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
            {isEditMode ? "Edit Hard Drive" : "Add Hard Drive"}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hard Drive Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, projectId: value }))
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 2TB"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="freeSpace">Free Space</Label>
                  <Input
                    id="freeSpace"
                    name="freeSpace"
                    value={formData.freeSpace}
                    onChange={handleChange}
                    placeholder="e.g. 500GB"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Textarea
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    placeholder="Describe the data stored on this hard drive"
                    rows={5}
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block">Available Cables</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="thunderbolt3"
                        checked={formData.cables.thunderbolt3}
                        onCheckedChange={(checked) =>
                          handleCableChange("thunderbolt3", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="thunderbolt3"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Thunderbolt 3
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="typeC"
                        checked={formData.cables.typeC}
                        onCheckedChange={(checked) =>
                          handleCableChange("typeC", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="typeC"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        USB Type C
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="power"
                        checked={formData.cables.power}
                        onCheckedChange={(checked) =>
                          handleCableChange("power", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="power"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Power
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="usb3"
                        checked={formData.cables.usb3}
                        onCheckedChange={(checked) =>
                          handleCableChange("usb3", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="usb3"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        USB 3
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cablesOther">Other Files</Label>
                  <Input
                    id="cablesOther"
                    value={formData.cables.other}
                    onChange={(e) => handleCableOtherChange(e.target.value)}
                    placeholder="Specify other cables if any"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Update Hard Drive" : "Add Hard Drive"}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default HardDriveForm;
