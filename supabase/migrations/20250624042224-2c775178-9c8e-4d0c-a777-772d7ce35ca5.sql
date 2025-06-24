
-- Create a table to store hard drive change history
CREATE TABLE public.hard_drive_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hard_drive_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the history table
ALTER TABLE public.hard_drive_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the history table
CREATE POLICY "Users can view all hard drive history" 
  ON public.hard_drive_history 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can insert hard drive history" 
  ON public.hard_drive_history 
  FOR INSERT 
  WITH CHECK (true);

-- Create a function to track hard drive changes
CREATE OR REPLACE FUNCTION public.track_hard_drive_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_version INTEGER := 1;
  field_record RECORD;
  old_val TEXT;
  new_val TEXT;
BEGIN
  -- Get the current version number for this hard drive
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO current_version 
  FROM public.hard_drive_history 
  WHERE hard_drive_id = COALESCE(NEW.id, OLD.id);

  -- Handle INSERT (create)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.hard_drive_history (
      hard_drive_id, field_name, old_value, new_value, 
      changed_by, version_number, change_type
    ) VALUES (
      NEW.id, 'created', NULL, 'Hard drive created',
      COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id),
      current_version, 'create'
    );
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Track changes for each field
    FOR field_record IN 
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hard_drives' 
      AND table_schema = 'public'
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
    LOOP
      EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', 
                     field_record.column_name, field_record.column_name)
      INTO old_val, new_val
      USING OLD, NEW;
      
      -- Only log if the value actually changed
      IF old_val IS DISTINCT FROM new_val THEN
        INSERT INTO public.hard_drive_history (
          hard_drive_id, field_name, old_value, new_value,
          changed_by, version_number, change_type
        ) VALUES (
          NEW.id, field_record.column_name, old_val, new_val,
          COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id),
          current_version, 'update'
        );
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.hard_drive_history (
      hard_drive_id, field_name, old_value, new_value,
      changed_by, version_number, change_type
    ) VALUES (
      OLD.id, 'deleted', 'Hard drive existed', 'Hard drive deleted',
      COALESCE(current_setting('app.current_user_id', true)::UUID, OLD.id),
      current_version, 'delete'
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for hard drive changes
CREATE TRIGGER hard_drive_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.hard_drives
  FOR EACH ROW EXECUTE FUNCTION public.track_hard_drive_changes();

-- Enable realtime for the history table
ALTER TABLE public.hard_drive_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hard_drive_history;
