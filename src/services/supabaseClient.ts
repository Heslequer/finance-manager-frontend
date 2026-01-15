import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dolmdtonqrgpzjrhmllv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbG1kdG9ucXJncHpqcmhtbGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NDc5MjIsImV4cCI6MjA3MjUyMzkyMn0.RCw01YHV8UeYX0b8UZZOhnFVLB6Ljl-zADN0c0cBvFc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
