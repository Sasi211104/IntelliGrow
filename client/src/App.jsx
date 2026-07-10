import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser, RedirectToSignIn } from '@clerk/clerk-react'
import { Toaster } from 'sonner'
import LandingPage from './pages/LandingPage'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import InterviewPrep from './pages/InterviewPrep'
import CodingWorkspace from './pages/CodingWorkspace'
import ResumeGenerator from './pages/ResumeGenerator'
import JobMarket from './pages/JobMarket'
import CompleteProfile from './pages/CompleteProfile'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="pt-16">
      {children}
    </div>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased overflow-x-hidden w-full">
      <Toaster position="top-center" richColors />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />


          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/interview" element={
            <ProtectedRoute>
              <InterviewPrep />
            </ProtectedRoute>
          } />

          <Route path="/coding/:problemId?" element={
            <ProtectedRoute>
              <CodingWorkspace />
            </ProtectedRoute>
          } />

          <Route path="/resume" element={
            <ProtectedRoute>
              <ResumeGenerator />
            </ProtectedRoute>
          } />

          <Route path="/market" element={
            <ProtectedRoute>
              <JobMarket />
            </ProtectedRoute>
          } />

          <Route path="/complete-profile" element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
