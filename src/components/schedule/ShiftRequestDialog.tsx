import { Calendar, Clock, User, Users } from 'lucide-react';

const requestTypeOptions = [
  { value: 'day-off', label: 'Day Off Request', icon: Calendar },
  { value: 'unpaid-leave', label: 'Unpaid Leave', icon: Clock },
  { value: 'extra-days', label: 'Extra Days', icon: User, adminOnly: true },
  { value: 'public-holiday', label: 'Public Holiday', icon: Users, adminOnly: true },
];

export const ShiftRequestDialog: React.FC<ShiftRequestDialogProps> = ({
  // ... existing code ...

  // Inside the return statement, update the Select options rendering:
  <SelectContent>
    {requestTypeOptions
      .filter(option => !option.adminOnly || isAdmin)
      .map(option => (
        <SelectItem key={option.value} value={option.value}>
          <div className="flex items-center gap-2">
            <option.icon className="h-4 w-4" />
            {option.label}
          </div>
        </SelectItem>
      ))}
  </SelectContent>
  // ... existing code ...
}); 