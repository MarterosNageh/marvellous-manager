# Task Chat Feature

This document describes the new chat functionality added to the task manager.

## Features

### ✅ Implemented (Current Version)
- **Real-time chat** for each task
- **Mention system** with @username syntax
- **User suggestions** when typing @
- **Message formatting** with highlighted mentions
- **Comment count** displayed on task cards
- **Responsive design** with mobile-friendly interface
- **Local storage** for persistence (temporary solution)

### 🔄 Planned (Database Integration)
- **Database storage** for comments and mentions
- **Push notifications** for mentions
- **Real-time updates** across multiple users
- **Mention tracking** and read status
- **Comment editing** and deletion
- **File attachments** support

## How to Use

### Basic Chat
1. Open any task by clicking on it
2. Navigate to the "Chat" tab
3. Type your message and press Enter to send
4. Messages are displayed in chronological order

### Mentions
1. Type `@` followed by a username
2. A dropdown will appear with matching users
3. Click on a user to insert the mention
4. Mentioned users will be highlighted in the message

### Keyboard Shortcuts
- `Enter` - Send message
- `Shift + Enter` - New line
- `@` - Start mention

## Technical Implementation

### Current Architecture
- **Frontend**: React with TypeScript
- **Storage**: localStorage (temporary)
- **UI**: Shadcn/ui components
- **State Management**: React hooks

### Database Schema (Planned)
```sql
-- Task comments table
CREATE TABLE task_comments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  user_id UUID REFERENCES auth_users(id),
  message TEXT NOT NULL,
  mentions JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Mention tracking table
CREATE TABLE task_comment_mentions (
  id UUID PRIMARY KEY,
  comment_id UUID REFERENCES task_comments(id),
  mentioned_user_id UUID REFERENCES auth_users(id),
  task_id UUID REFERENCES tasks(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);
```

### Database Functions (Planned)
- `get_task_comments(task_id)` - Fetch comments with user info
- `create_task_comment(task_id, user_id, message)` - Create comment with mention extraction
- `get_task_comment_count(task_id)` - Get comment count
- `get_user_fcm_tokens(user_ids)` - Get FCM tokens for notifications

## Setup Instructions

### 1. Database Setup (When Ready)
```bash
# Start Supabase locally
npx supabase start

# Apply migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --local > types.ts
```

### 2. Push Notifications (When Ready)
1. Set up Firebase project
2. Configure FCM tokens
3. Update notification service
4. Test mention notifications

### 3. Real-time Updates (When Ready)
1. Enable Supabase real-time
2. Set up subscriptions
3. Handle real-time events

## File Structure

```
src/
├── components/tasks/
│   ├── TaskChat.tsx          # Main chat component
│   ├── TaskCard.tsx          # Updated with comment count
│   └── TaskDetailDialog.tsx  # Updated with chat tab
├── services/
│   └── taskChatService.ts    # Chat service (planned)
├── types/
│   └── taskTypes.ts          # Updated with comment types
└── supabase/migrations/
    ├── 20250101000000_create_task_comments.sql
    └── 20250101000001_create_task_chat_functions.sql
```

## Current Limitations

1. **Local Storage**: Comments are stored locally and not shared between users
2. **No Real-time**: Changes are not synchronized across multiple users
3. **No Push Notifications**: Mentions don't trigger notifications yet
4. **No Persistence**: Comments are lost when browser data is cleared

## Next Steps

1. **Set up local Supabase** with Docker
2. **Apply database migrations**
3. **Update types** with generated Supabase types
4. **Implement real-time subscriptions**
5. **Add push notification integration**
6. **Test with multiple users**

## Testing

### Manual Testing
1. Create a task
2. Open task details
3. Navigate to chat tab
4. Send messages with mentions
5. Verify mention highlighting
6. Check comment count updates

### Automated Testing (Planned)
- Unit tests for chat components
- Integration tests for database functions
- E2E tests for chat workflow

## Troubleshooting

### Common Issues
1. **Comments not saving**: Check localStorage permissions
2. **Mentions not working**: Verify user list is loaded
3. **UI not updating**: Check React state management

### Debug Mode
Enable console logging for mentions:
```javascript
// Check browser console for mention logs
console.log('Mentions detected:', mentionedUserIds);
```

## Contributing

When adding new features:
1. Update this README
2. Add TypeScript types
3. Include error handling
4. Add loading states
5. Test with multiple users 