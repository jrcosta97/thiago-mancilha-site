import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const Landing = lazy(() => import('@/pages/Landing'));
const LinkBio = lazy(() => import('@/pages/LinkBio'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

export default function App() {
  // ⚠️ React 18 Strict Mode: inicializa o cliente Supabase SÓ APÓS o primeiro paint,
  // garantindo que `window` e `window.location` estão 100% disponíveis (nunca crash tela branca)
  useEffect(() => {
    try {
      if (isSupabaseConfigured() && typeof window !== 'undefined') {
        getSupabase();
      }
    } catch (err) {
      console.warn('[App] Erro ao inicializar cliente Supabase (ignorado, não quebra a tela):', err);
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen w-full bg-background flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-lime-400/30 border-t-lime-400 animate-spin" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/linkbio" element={<LinkBio />} />
          <Route path="/bio" element={<Navigate to="/linkbio" replace />} />
          <Route path="/links" element={<Navigate to="/linkbio" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
