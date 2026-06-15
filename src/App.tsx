import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Data from './pages/Data'
import Analysis from './pages/Analysis'
import AnalysisBuilder from './pages/AnalysisBuilder'
import Charts from './pages/Charts'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Settings from './pages/Settings'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/data" element={<Data />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/analysis/builder" element={<AnalysisBuilder />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}
