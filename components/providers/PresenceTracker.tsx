"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceContextType {
  onlineUserIds: string[];
}

const PresenceContext = createContext<PresenceContextType>({ onlineUserIds: [] });

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.id) {
      setOnlineUserIds([]);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    
    const existing = supabase.getChannels().find(
      (c: RealtimeChannel) => c.topic === 'online-users' || c.topic === 'realtime:online-users'
    );
    if (existing) {
      supabase.removeChannel(existing);
    }
    
    // Join the presence channel with metadata
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: session.user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = Object.keys(state);
        setOnlineUserIds(activeIds);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: session.user.id,
            name: session.user.name,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // Realtime Notifications Postgres Changes Channel
    const notifChannel = supabase.channel(`user-notifications-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notification',
          filter: `userId=eq.${session.user.id}`,
        },
        (payload: { new: { id: string; userId: string; title: string; body: string; type: string; isRead: boolean; link: string | null; createdAt: string } }) => {
          const newNotif = payload.new;
          if (newNotif) {
            // Invalidate cache
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

            // Toast Alert
            const targetLink = newNotif.link;
            toast.info(newNotif.title, {
              description: newNotif.body,
              action: targetLink ? {
                label: 'View',
                onClick: () => {
                  router.push(targetLink);
                }
              } : undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(notifChannel);
    };
  }, [session?.user?.id, session?.user?.name, queryClient, router]);

  return (
    <PresenceContext.Provider value={{ onlineUserIds }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}

