
import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';

export const useUserSearch = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    avatar: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { currentUser } = useApp();

  const clearSearch = useCallback(() => {
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, []);

  const searchUsers = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar')
          .ilike('name', `%${searchTerm}%`)
          .neq('id', currentUser?.id)
          .limit(10);

        if (error) {
          throw error;
        }

        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search failed",
          description: "Could not load search results",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [currentUser?.id]
  );

  // Clear results when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
    }
  }, [query]);

  return {
    query,
    setQuery,
    searchResults,
    isLoading,
    searchUsers,
    clearSearch,
    showResults,
    setShowResults
  };
};
