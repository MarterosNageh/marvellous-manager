
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
      const response = await fetch(`${CLICKUP_API_BASE}/team`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.statusText}`);
      }
      
      const data = await response.json();
      const teams = data.teams || [];
      
      if (teams.length === 0) {
        return [];
      }
      
      // Get spaces for the first team
      const teamId = teams[0].id;
      const spacesResponse = await fetch(`${CLICKUP_API_BASE}/team/${teamId}/space`, {
        headers: this.headers,
      });
      
      if (!spacesResponse.ok) {
        throw new Error(`Failed to fetch spaces: ${spacesResponse.statusText}`);
      }
      
      const spacesData = await spacesResponse.json();
      return spacesData.spaces || [];
    } catch (error) {
      console.error('Error fetching spaces:', error);
      throw error;
    }
  }

  async getLists(spaceId: string): Promise<ClickUpList[]> {
    try {
      const response = await fetch(`${CLICKUP_API_BASE}/space/${spaceId}/list`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.lists || [];
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw error;
    }
  }

  async getTasks(listId: string): Promise<ClickUpTask[]> {
    try {
      const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
      const response = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating task:', error);
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
      const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${CLICKUP_API_BASE}/task/${taskId}`, {
        method: 'DELETE',
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
}

export const clickupService = new ClickUpService();
