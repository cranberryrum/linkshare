import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yazzewqjypqxgneupsfb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhenpld3FqeXBxeGduZXVwc2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMDM4NDgsImV4cCI6MjA2Mjg3OTg0OH0.Tt1Xu_IXy8UyNGewzqR0y3qmTqkepD3T_sbQf_EsRwM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)