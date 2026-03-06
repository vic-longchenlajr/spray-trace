import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './components/dashboard/Dashboard'
import ProgramDetail from './components/program/ProgramDetail'
import IterationTimeline from './components/timeline/IterationTimeline'
import AddIteration from './components/iteration/AddIteration'
import IterationDetail from './components/iteration/IterationDetail'
import ComparisonView from './components/comparison/ComparisonView'
import Settings from './components/settings/Settings'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/program/:programId" element={<ProgramDetail />} />
        <Route path="/layout/:layoutId" element={<IterationTimeline />} />
        <Route path="/layout/:layoutId/add" element={<AddIteration />} />
        <Route path="/iteration/:iterationId" element={<IterationDetail />} />
        <Route path="/layout/:layoutId/compare" element={<ComparisonView />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}
