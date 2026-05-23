"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Send,
  MessageSquare,
  Loader2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ProjectMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  mediaUrl: string | null;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    designation: string | null;
  };
}

interface ProjectChatProps {
  projectId: string;
  accent: 'indigo' | 'emerald';
}

const colorMap = {
  indigo: {
    logo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600',
    ring: 'focus-visible:ring-indigo-500',
    sendBtn: 'bg-indigo-600 hover:bg-indigo-700',
    bubble: 'bg-indigo-600 text-white rounded-tr-none',
  },
  emerald: {
    logo: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
    ring: 'focus-visible:ring-emerald-500',
    sendBtn: 'bg-emerald-600 hover:bg-emerald-700',
    bubble: 'bg-emerald-600 text-white rounded-tr-none',
  },
};

export default function ProjectChat({ projectId, accent }: ProjectChatProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = colorMap[accent] || colorMap.indigo;

  const { data: messages = [], isLoading } = useQuery<ProjectMessage[]>({
    queryKey: ['project-messages', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 5000, // Poll fallback
  });

  // Supabase Realtime Listener
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const topic = `project-messages-${projectId}`;
    const existing = supabase.getChannels().find(
      (c: RealtimeChannel) => c.topic === topic || c.topic === `realtime:${topic}`
    );
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ProjectMessage',
          filter: `projectId=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project-messages', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: { content: string; mediaUrl: string | null }) => {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: (newMessage) => {
      setInputText('');
      setAttachedUrl(null);
      queryClient.setQueryData<ProjectMessage[]>(
        ['project-messages', projectId],
        (old = []) => [...old, newMessage]
      );
      setTimeout(scrollToBottom, 50);
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      toast.warning('Please wait for the image upload to complete.');
      return;
    }
    const content = inputText.trim();
    if (!content && !attachedUrl) return;
    sendMessageMutation.mutate({ content, mediaUrl: attachedUrl });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'chat-attachments');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await res.json();
      setAttachedUrl(data.url);
      toast.success('Image attached successfully!');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error uploading image';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="premium-card border border-border bg-card rounded-2xl shadow-card overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="flex items-center gap-2">
          <span className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold',
            colors.logo
          )}>
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Project Discussion</h3>
            <p className="text-[10px] text-zinc-400">Collaborate with assigned teammates in real time</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
            <p className="text-xs text-zinc-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
            <MessageSquare className="w-8 h-8 text-zinc-200 dark:text-zinc-700" />
            <h4 className="font-semibold text-xs text-zinc-700 dark:text-zinc-300">No project messages yet</h4>
            <p className="text-[10px] text-zinc-400 max-w-xs">
              This channel is secure and only visible to assigned project members. Send a message to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === session?.user?.id;
            const initials = getInitials(message.sender.name);
            const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2.5 max-w-[85%] md:max-w-[70%]',
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {/* Avatar */}
                <Avatar className="w-7 h-7 shrink-0 border border-border">
                  <AvatarImage src={message.sender.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-zinc-100 text-zinc-700 text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Bubble Content */}
                <div className="space-y-0.5 min-w-0">
                  {/* Sender metadata */}
                  <div className={cn(
                    'flex items-center gap-1.5 text-[9px]',
                    isMe ? 'justify-end' : ''
                  )}>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {message.sender.name}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 scale-90">
                      {message.sender.designation || message.sender.role}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className={cn(
                    'rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm break-words',
                    isMe
                      ? colors.bubble
                      : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-border'
                  )}>
                    {message.mediaUrl && (
                      <div className="mb-1.5 max-w-xs rounded-lg overflow-hidden border border-border bg-black/5 dark:bg-black/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.mediaUrl}
                          alt="Project attachment"
                          className="max-h-60 w-auto object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {message.content && <div>{message.content}</div>}
                  </div>

                  {/* Time */}
                  <p className={cn(
                    'text-[8px] text-zinc-450 dark:text-zinc-500 mt-0.5',
                    isMe ? 'text-right' : ''
                  )}>
                    {timeStr}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview box */}
      {(attachedUrl || isUploading) && (
        <div className="px-5 py-2 border-t border-border bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center gap-3">
          {isUploading ? (
            <div className="w-14 h-14 rounded-lg border border-border flex items-center justify-center bg-card animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            </div>
          ) : (
            <div className="relative group w-14 h-14 rounded-lg overflow-hidden border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachedUrl!}
                alt="Attachment preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setAttachedUrl(null)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
          <div className="text-left">
            <p className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
              {isUploading ? 'Uploading image...' : 'Image ready to send'}
            </p>
            <p className="text-[9px] text-zinc-400">
              {isUploading ? 'Please wait' : 'Click send to share with the team'}
            </p>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-border bg-card flex gap-2 items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-8.5 h-8.5 rounded-lg text-zinc-400 shrink-0 hover:text-zinc-600 dark:hover:text-zinc-300"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendMessageMutation.isPending || isUploading}
        >
          <ImageIcon className="w-4.5 h-4.5" />
        </Button>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message to the project channel..."
          className={cn(
            'flex-1 text-xs h-8.5 bg-zinc-50/50 dark:bg-zinc-950/20 border-border',
            colors.ring
          )}
          disabled={sendMessageMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          className={cn(
            'w-8.5 h-8.5 rounded-lg shrink-0 text-white transition-colors',
            colors.sendBtn
          )}
          disabled={(!inputText.trim() && !attachedUrl) || sendMessageMutation.isPending || isUploading}
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
}
