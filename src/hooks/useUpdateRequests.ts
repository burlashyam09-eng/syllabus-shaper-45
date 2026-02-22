import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UpdateRequest {
  id: string;
  subject_id: string;
  requester_id: string;
  owner_id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Fetch requests sent TO this faculty (as subject owner)
export function useReceivedRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['update-requests', 'received', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('update_requests')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UpdateRequest[];
    },
    enabled: !!user,
  });
}

// Fetch requests sent BY this faculty
export function useSentRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['update-requests', 'sent', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('update_requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UpdateRequest[];
    },
    enabled: !!user,
  });
}

export function useCreateUpdateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subjectId, ownerId, message }: { subjectId: string; ownerId: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('update_requests')
        .insert({
          subject_id: subjectId,
          requester_id: user.id,
          owner_id: ownerId,
          message,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['update-requests'] });
      toast.success('Update request sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send request: ' + error.message);
    },
  });
}

export function useRespondToRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('update_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['update-requests'] });
      toast.success(`Request ${variables.status} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to respond: ' + error.message);
    },
  });
}
