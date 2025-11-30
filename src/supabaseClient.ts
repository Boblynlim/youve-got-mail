import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eqnkdijrcrsauclyuplo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbmtkaWpyY3JzYXVjbHl1cGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODQzMDQsImV4cCI6MjA3OTk2MDMwNH0.oqVuEZvNWH2--X9w9FmdQbG-1DIrCwsvlDJup14k6jc'

export const supabase = createClient(supabaseUrl, supabaseKey)
