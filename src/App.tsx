import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Landing = lazy(() => import('@/pages/Landing'));
const LinkBio = lazy(() => import('@/pages/LinkBio'));

export default function App() {
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
