import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CustomCategory {
  id: string;
  subject_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export function useCustomCategories(subjectId: string | undefined) {
  return useQuery({
    queryKey: ['custom-categories', subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      const { data, error } = await supabase
        .from('custom_categories')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at');
      if (error) throw error;
      return data as CustomCategory[];
    },
    enabled: !!subjectId,
  });
}

export function useCreateCustomCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subjectId, name }: { subjectId: string; name: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('custom_categories')
        .insert({ subject_id: subjectId, name, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-categories', variables.subjectId] });
      toast.success('Feature added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add feature: ' + error.message);
    },
  });
}

export function useUpdateCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('custom_categories')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-categories'] });
      toast.success('Feature updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update feature: ' + error.message);
    },
  });
}

export function useDeleteCustomCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-categories'] });
      queryClient.invalidateQueries({ queryKey: ['module'] });
      toast.success('Feature deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete feature: ' + error.message);
    },
  });
}
