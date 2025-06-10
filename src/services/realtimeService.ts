import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

class RealtimeService {
  private static instance: RealtimeService;
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public subscribe(callback: () => void) {
    if (!this.channel) {
      this.channel = supabase.channel('schedule-updates')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'shifts' },
          () => {
            this.notifySubscribers();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'shift_templates' },
          () => {
            this.notifySubscribers();
          }
        );

      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        }
      });
    }

    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
      
      // If there are no more subscribers, cleanup the channel
      if (this.subscribers.size === 0 && this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }
}

export const realtimeService = RealtimeService.getInstance(); 