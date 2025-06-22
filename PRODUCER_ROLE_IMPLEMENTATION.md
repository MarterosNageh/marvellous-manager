# Producer Role Implementation

## Overview
A new "Producer" role has been added to the Marvellous Manager system with specific permissions designed for content creators who need to view hard drives and create tasks without the ability to assign them to others.

## Producer Role Permissions

### ✅ Allowed Actions
- **View Hard Drives**: Read-only access to all hard drive information
- **Create Tasks**: Can create new tasks but cannot assign them to other users
- **View Dashboard**: Access to basic dashboard information
- **View Schedules**: Can view team schedules with Producers in separate section
- **Schedule Visibility**: Producers appear in their own dedicated section in schedule views

### ❌ Restricted Actions
- **Edit/Delete Hard Drives**: Cannot modify or delete hard drive records
- **Task Assignment**: Cannot assign tasks to other users
- **User Management**: Cannot add, edit, or remove users
- **Settings Access**: Cannot access system settings
- **Task Completion**: Cannot mark tasks as completed
- **Print Functions**: Cannot print hard drive forms
- **Task Assignment Target**: Producers cannot be assigned to tasks by other users

## Implementation Details

### Database Changes
- Added 'producer' to the `user_role` enum in the `auth_users` table
- Migration file: `supabase/migrations/20250101000003_add_producer_role.sql`
- Manual SQL script: `add_producer_role_manual.sql`

### Frontend Changes

#### Type Definitions Updated
- `src/types/schedule.ts`: Added 'producer' to UserRole type
- `src/types/index.ts`: Updated User interface
- `src/types/taskTypes.ts`: Updated User and TaskUser interfaces
- `src/types/user.ts`: Updated User interface

#### Authentication Context
- `src/context/AuthContext.tsx`: Added producer-specific permissions
  - `isProducer`: Boolean flag for producer role
  - `canCreateTask`: Allows producers to create tasks
  - `canViewHardDrives`: All users can view hard drives
  - `canEditHardDrives`: Only admin/senior can edit hard drives

#### User Management
- `src/pages/UserManagement.tsx`: Added Producer role option in user creation
- `src/pages/Settings.tsx`: Added Producer role in user editing
- Updated role badges and permission descriptions

#### Task Management
- `src/components/tasks/CreateTaskDialog.tsx`: 
  - Disabled assignee selection for Producers
  - Filtered out Producers from assignee list
- `src/components/tasks/TaskDetailDialog.tsx`: Filtered out Producers from assignee list
- `src/context/TaskContext.tsx`: Automatically clears assignee_ids for Producers
- Added informative messages when Producers create tasks

#### Hard Drive Management
- `src/pages/HardDrives.tsx`: Hidden "New Hard Drive" button for Producers
- `src/pages/HardDriveDetail.tsx`: Hidden edit/delete/print actions for Producers
- `src/components/HardDriveGroupedList.tsx`: Read-only view for Producers

#### Schedule Management
- `src/components/schedule/WeeklyView.tsx`: Added separate "Producers" section in schedule view
- `src/components/schedule/MonthlyView.tsx`: Added separate "Producers" section in schedule view
- `src/components/schedule/DailyView.tsx`: Added separate "Producers" section in schedule view
- `src/components/schedule/MobileScheduleView.tsx`: Added separate "Producers" section in schedule view
- Producers now appear in their own dedicated section in all schedule views

## Role Hierarchy

1. **Admin**: Full system access
2. **Senior**: Task completion + user management
3. **Operator**: Basic viewing and request submission
4. **Producer**: Read-only hard drives + task creation (no assignments) + separate schedule section

## Database Migration Instructions

### Option 1: Using Supabase CLI (Recommended)
```bash
# Start local Supabase instance
npx supabase start

# Apply migrations
npx supabase db push
```

### Option 2: Manual SQL Execution
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Run the contents of `add_producer_role_manual.sql`

## Testing the Implementation

### Creating a Producer User
1. Login as an Admin user
2. Go to User Management
3. Create a new user with role "Producer"
4. Verify the user appears with the purple Producer badge

### Testing Producer Permissions
1. Login as a Producer user
2. Navigate to Hard Drives - should see read-only view
3. Try to create a task - should not see assignee selection
4. Verify task creation works but without assignments
5. Confirm edit/delete buttons are hidden

### Testing Schedule Exclusion
1. Login as an Admin user
2. Go to Schedule view
3. Verify that Producer users appear in a separate "Producers" section below "Operators"
4. Confirm that the order is: Operators → Producers → Technical Leaders

### Testing Task Assignment
1. Login as an Admin or Senior user
2. Create a new task or edit an existing task
3. Try to assign the task to a Producer user
4. Verify that Producer users do not appear in the assignee list

### Testing Task Creation
1. As a Producer, create a new task
2. Verify the task is created successfully
3. Check that no assignees are added
4. Confirm the success message indicates Producer restrictions

## Security Considerations

- Producers cannot escalate their privileges
- All hard drive modifications are blocked at the UI level
- Task assignments are automatically cleared in the backend
- Role-based access control is enforced throughout the application
- Producers appear in schedule views but in their own separate section
- Producers cannot be assigned to tasks by other users

## Future Enhancements

Potential improvements for the Producer role:
- Add ability to view task comments
- Allow Producers to update task descriptions
- Add specific Producer dashboard with relevant metrics
- Implement audit logging for Producer actions
- Add Producer-specific task categories or labels

## Troubleshooting

### Common Issues
1. **Role not appearing in dropdown**: Ensure database migration is applied
2. **Producer can still assign tasks**: Check that `isProducer` logic is working
3. **Hard drive edit buttons visible**: Verify `isProducer` prop is passed correctly
4. **Producer doesn't appear in schedule**: Check that Producers are included in the users array
5. **Producer appears in assignee list**: Verify `assignableUsers` filtering is working

### Debug Steps
1. Check browser console for role-related logs
2. Verify current user role in AuthContext
3. Confirm database enum includes 'producer'
4. Test with different user roles to isolate issues
5. Check that `user.role !== 'producer'` filtering is applied consistently for task assignments
6. Verify that Producers are properly separated in schedule views 

### Schedule View Structure:
```
📅 Schedule View
├── 👥 Operators  
│   ├── Operator User 1
│   ├── Operator User 2
│   └── ...
├── 🎬 Producers
│   ├── Producer User 1
│   ├── Producer User 2
│   └── ...
└── 👑 Technical Leaders
    ├── Admin User
    ├── Senior User
    └── ...
``` 