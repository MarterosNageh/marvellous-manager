
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VersionDetailsDialog } from "./VersionDetailsDialog";

interface HardDriveHistory {
  id: string;
  hard_drive_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_username?: string;
  version_number: number;
  change_type: 'create' | 'update' | 'delete';
  created_at: string;
}

interface HardDriveHistoryTableProps {
  hardDriveId: string;
}

export const HardDriveHistoryTable: React.FC<HardDriveHistoryTableProps> = ({ hardDriveId }) => {
  const [history, setHistory] = useState<HardDriveHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionChanges, setVersionChanges] = useState<HardDriveHistory[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${displayHours}:${displayMinutes} ${ampm}`;
  };

  const formatChangeType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'create': 'Created',
      'update': 'Updated',
      'delete': 'Deleted'
    };
    return typeMap[type] || type;
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const changeTypes = [
    { value: 'all', label: 'All Changes' },
    { value: 'create', label: 'Created' },
    { value: 'update', label: 'Updated' },
    { value: 'delete', label: 'Deleted' }
  ];

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      // First get the history records
      const { data: historyData, error: historyError } = await supabase
        .from('hard_drive_history')
        .select('*')
        .eq('hard_drive_id', hardDriveId)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Get all unique user IDs from the history
      const userIds = [...new Set((historyData || []).map(item => item.changed_by).filter(Boolean))];
      
      // Fetch usernames for all users at once
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username')
        .in('id', userIds);

      if (usersError) {
        console.warn('Could not load user data:', usersError);
      }

      // Create a map of user IDs to usernames for quick lookup
      const userMap = new Map();
      (usersData || []).forEach(user => {
        userMap.set(user.id, user.username || 'Unknown User');
      });

      // Combine the data
      const typedData: HardDriveHistory[] = (historyData || []).map(item => ({
        ...item,
        changed_by_username: userMap.get(item.changed_by) || 'Unknown User',
        change_type: item.change_type as 'create' | 'update' | 'delete'
      }));

      setHistory(typedData);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load change history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`hard_drive_history_${hardDriveId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hard_drive_history',
          filter: `hard_drive_id=eq.${hardDriveId}`
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hardDriveId]);

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleRowClick = (versionNumber: number) => {
    const changes = history.filter(item => item.version_number === versionNumber);
    setVersionChanges(changes);
    setSelectedVersion(versionNumber);
    setShowVersionDialog(true);
  };

  const filteredData = history.filter(item => {
    const matchesSearch = 
      item.field_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.old_value && item.old_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.new_value && item.new_value.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.changed_by_username && item.changed_by_username.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || item.change_type === selectedType;
    return matchesSearch && matchesType;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Group by version to show one row per version
  const groupedByVersion = sortedData.reduce((acc, item) => {
    const existing = acc.find(group => group.version_number === item.version_number);
    if (existing) {
      existing.changes.push(item);
    } else {
      acc.push({
        version_number: item.version_number,
        change_type: item.change_type,
        changed_by_username: item.changed_by_username,
        created_at: item.created_at,
        changes: [item],
        changeCount: 1
      });
    }
    return acc;
  }, [] as Array<{
    version_number: number;
    change_type: 'create' | 'update' | 'delete';
    changed_by_username: string;
    created_at: string;
    changes: HardDriveHistory[];
    changeCount: number;
  }>);

  // Update change count
  groupedByVersion.forEach(group => {
    group.changeCount = group.changes.length;
  });

  if (loading) {
    return <div className="text-center py-4">Loading change history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search changes or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {changeTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Version</TableHead>
            <TableHead className="w-[120px]">Change Type</TableHead>
            <TableHead className="w-[150px]">Changed By</TableHead>
            <TableHead className="w-[100px]">Changes</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={toggleSort}
                className="h-8 flex items-center gap-1 -ml-4"
              >
                Date & Time
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedByVersion.map((group) => (
            <TableRow 
              key={group.version_number} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(group.version_number)}
            >
              <TableCell>
                <Badge variant="outline">v{group.version_number}</Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    group.change_type === 'create' ? 'default' :
                    group.change_type === 'update' ? 'secondary' : 'destructive'
                  }
                >
                  {formatChangeType(group.change_type)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{group.changed_by_username || 'Unknown User'}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {group.changeCount} change{group.changeCount !== 1 ? 's' : ''}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(group.created_at)}</TableCell>
            </TableRow>
          ))}
          {groupedByVersion.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                {searchQuery || selectedType !== 'all' 
                  ? "No matching changes found" 
                  : "No change history available"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {showVersionDialog && selectedVersion && (
        <VersionDetailsDialog
          open={showVersionDialog}
          onClose={() => setShowVersionDialog(false)}
          versionNumber={selectedVersion}
          changes={versionChanges}
          changedBy={versionChanges[0]?.changed_by_username || 'Unknown User'}
          changeDate={versionChanges[0]?.created_at || ''}
        />
      )}
    </div>
  );
};
