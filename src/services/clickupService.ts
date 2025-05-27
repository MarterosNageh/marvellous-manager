
const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';
const CLICKUP_API_KEY = 'BJUU2PGOJTY7TPG5D4V0TW3TS49FXRVXRA33JZ9SPSUQUWQXEM9QG41G7YWFA1NN';

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: {
    status: string;
    color: string;
  };
  priority?: {
    priority: string;
    color: string;
  };
  assignees: Array<{
    id: string;
    username: string;
    email: string;
  }>;
  due_date?: string;
  date_created: string;
  date_updated: string;
  url: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  orderindex: number;
  content: string;
  status: {
    status: string;
    color: string;
  };
  priority: {
    priority: string;
    color: string;
  };
  assignee: any;
  task_count: number;
  due_date: string;
  start_date: string;
  folder: {
    id: string;
    name: string;
  };
  space: {
    id: string;
    name: string;
  };
}

export interface ClickUpSpace {
  id: string;
  name: string;
  color: string;
  private: boolean;
  statuses: Array<{
    status: string;
    type: string;
    orderindex: number;
    color: string;
  }>;
}

class ClickUpService {
  private headers = {
    'Authorization': CLICKUP_API_KEY,
    'Content-Type': 'application/json',
  };

  async getSpaces(): Promise<ClickUpSpace[]> {
    try {
      console.log('Fetching ClickUp teams...');
      const response = await fetch(`${CLICKUP_API_BASE}/team`, {
        headers: this.headers,
      });
      
      console.log('Team response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Team fetch error:', errorText);
        throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Teams data:', data);
      
      const teams = data.teams || [];
      
      if (teams.length === 0) {
        console.warn('No teams found');
        return [];
      }
      
      // Get spaces for the first team
      const teamId = teams[0].id;
      console.log('Fetching spaces for team:', teamId);
      
      const spacesResponse = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/space`, {
        headers: this.headers,
      });
      
      console.log('Spaces response status:', spacesResponse.status);
      
      if (!spacesResponse.ok) {
        const errorText = await spacesResponse.text();
        console.error('Spaces fetch error:', errorText);
        throw new Error(`Failed to fetch spaces: ${spacesResponse.status} ${spacesResponse.statusText} - ${errorText}`);
      }
      
      const spacesData = await spacesResponse.json();
      console.log('Spaces data:', spacesData);
      
      return spacesData.spaces || [];
    } catch (error) {
      console.error('Error in getSpaces:', error);
      throw error;
    }
  }

  async getLists(spaceId: string): Promise<ClickUpList[]> {
    try {
      console.log('Fetching lists for space:', spaceId);
      const response = await fetch(`${CLICKUP_API_BASE}/space/${spaceId}/list`, {
        headers: this.headers,
      });
      
      console.log('Lists response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lists fetch error:', errorText);
        throw new Error(`Failed to fetch lists: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Lists data:', data);
      
      return data.lists || [];
    } catch (error) {
      console.error('Error in getLists:', error);
      throw error;
    }
  }

  async getTasks(listId: string): Promise<ClickUpTask[]> {
    try {
      console.log('Fetching tasks for list:', listId);
      const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
        headers: this.headers,
      });
      
      console.log('Tasks response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Tasks fetch error:', errorText);
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Tasks data:', data);
      
      return data.tasks || [];
    } catch (error) {
      console.error('Error in getTasks:', error);
      throw error;
    }
  }

  async createTask(listId: string, taskData: {
    name: string;
    description?: string;
    priority?: number;
    due_date?: number;
  }): Promise<ClickUpTask> {
    try {
      console.log('Creating task:', taskData);
      const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(taskData),
      });
      
      console.log('Create task response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create task error:', errorText);
        throw new Error(`Failed to create task: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Created task:', result);
      
      return result;
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: {
    name?: string;
    description?: string;
    status?: string;
    priority?: number;
  }): Promise<ClickUpTask> {
    try {
      console.log('Updating task:', taskId, updates);
      const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(updates),
      });
      
      console.log('Update task response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update task error:', errorText);
        throw new Error(`Failed to update task: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Updated task:', result);
      
      return result;
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log('Deleting task:', taskId);
      const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
        method: 'DELETE',
        headers: this.headers,
      });
      
      console.log('Delete task response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete task error:', errorText);
        throw new Error(`Failed to delete task: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Task deleted successfully');
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  }
}

export const clickupService = new ClickUpService();
