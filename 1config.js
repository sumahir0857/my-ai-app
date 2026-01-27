// ==================================
// KONFIGURASI SUPABASE
// Ganti dengan credentials Supabase kamu
// ==================================

const SUPABASE_URL = 'https://xhjwmhoxrszzrwsmqhxi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoandtaG94cnN6enJ3c21xaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDg1MjUsImV4cCI6MjA4MzAyNDUyNX0.JfMp7BY0PMhTc3xV2CoM6fTLsHSIrLyJyj9WMgeVFDM';

// Jangan edit di bawah ini
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
