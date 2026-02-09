import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Resource } from './useSubjects';

export function useModuleWithResources(moduleId: string | undefined) {
  return useQuery({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      if (!moduleId) return null;
      
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('*, units!inner(*, subjects!inner(*))')
        .eq('id', moduleId)
        .single();
      
      if (moduleError) throw moduleError;
      
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('module_id', moduleId)
        .order('created_at', { ascending: false });
      
      if (resourcesError) throw resourcesError;
      
      return {
        ...module,
        resources: resources as Resource[],
      };
    },
    enabled: !!moduleId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      moduleId,
      type,
      title,
      url,
      content,
      language,
    }: {
      moduleId: string;
      type: 'youtube' | 'notes' | 'formula' | 'important-questions' | 'pyq';
      title: string;
      url?: string;
      content?: string;
      language?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const insertData: Record<string, unknown> = {
        module_id: moduleId,
        type,
        title,
        url: url || null,
        content: content || null,
        created_by: user.id,
      };
      if (language) insertData.language = language;
      
      const { data, error } = await supabase
        .from('resources')
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['module', variables.moduleId] });
      toast.success('Resource added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add resource: ' + error.message);
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      title,
      url,
      content,
    }: {
      id: string;
      title?: string;
      url?: string;
      content?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (url !== undefined) updates.url = url;
      if (content !== undefined) updates.content = content;
      
      const { error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module'] });
      toast.success('Resource updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update resource: ' + error.message);
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module'] });
      toast.success('Resource deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete resource: ' + error.message);
    },
  });
}

// File upload for PDFs
export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) => {
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(path, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(data.path);
      
      return publicUrl;
    },
    onError: (error) => {
      toast.error('Failed to upload file: ' + error.message);
    },
  });
}

// Student progress
export function useStudentProgress(moduleId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['progress', user?.id, moduleId],
    queryFn: async () => {
      if (!user || !moduleId) return null;
      
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!moduleId,
  });
}

export function useToggleModuleComplete() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ moduleId, completed }: { moduleId: string; completed: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,module_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['subject'] });
    },
  });
}
