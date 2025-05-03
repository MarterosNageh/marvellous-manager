
import { useParams, Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, XCircle, LogIn, Printer } from "lucide-react";
import { useState, useEffect } from "react";

const PublicHardDriveView = () => {
  const { id } = useParams<{ id: string }>();
  const { getHardDrive, getProject } = useData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated via localStorage
    const checkAuth = () => {
      const currentUser = localStorage.getItem('currentUser');
      setIsAuthenticated(!!currentUser);
    };
    
    // Check authentication on component mount
    checkAuth();
    
    // Set up an event listener for storage changes
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const hardDrive = getHardDrive(id || "");
  
  if (!hardDrive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Hard Drive Not Found</h2>
            <p className="mb-6">The hard drive you're looking for doesn't exist or has been removed.</p>
            <Link to="/login">
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Login to System
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const project = getProject(hardDrive.projectId);
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold">Marvellous Manager</h1>
            <p className="text-muted-foreground">Hard Drive Information</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{hardDrive.name}</h2>
              <p className="text-muted-foreground">Serial Number: {hardDrive.serialNumber}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Project:</dt>
                    <dd>{project?.name || "Unknown"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Capacity:</dt>
                    <dd>{hardDrive.capacity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Free Space:</dt>
                    <dd>{hardDrive.freeSpace}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Available Cables</h3>
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex items-center">
                    {hardDrive.cables.thunderbolt3 ? (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span>Thunderbolt 3</span>
                  </li>
                  <li className="flex items-center">
                    {hardDrive.cables.typeC ? (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span>USB Type C</span>
                  </li>
                  <li className="flex items-center">
                    {hardDrive.cables.power ? (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span>Power</span>
                  </li>
                  <li className="flex items-center">
                    {hardDrive.cables.usb3 ? (
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span>USB 3</span>
                  </li>
                </ul>
                {hardDrive.cables.other && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Other Files:</h4>
                    <p>{hardDrive.cables.other}</p>
                  </div>
                )}
              </div>
            </div>
            
            {hardDrive.data && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Data</h3>
                <p className="whitespace-pre-wrap">{hardDrive.data}</p>
              </div>
            )}
            
            <div className="mt-8 text-center">
              {isAuthenticated ? (
                <Link to={`/hard-drives/${hardDrive.id}/print`}>
                  <Button>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Forms
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login to System
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicHardDriveView;
