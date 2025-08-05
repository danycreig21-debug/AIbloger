const fetchBlogs = async () => {
    if (!supabase) {
      console.warn('Supabase not configured');
      setIsLoading(false);
      return;
    }
    
    if (!supabase) {
      console.warn('Supabase not configured');
      return;
    }
    
     try {
       const { data, error } = await supabase

  const handleSummarize = async (blogId: string) => {
    if (!supabase) {
      console.warn('Supabase not configured');
      return;
    }
    
    setIsGeneratingSummary(blogId);