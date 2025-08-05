@@ .. @@
 import { createClient } from '@supabase/supabase-js';

-const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
-const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
+const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
+const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
+
+// Check if Supabase credentials are configured
+if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
+  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
+}

-export const supabase = createClient(supabaseUrl, supabaseAnonKey);
+export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;