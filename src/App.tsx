import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ExpenseFormPage } from './features/expenses/ExpenseFormPage'
import { ExpensesPage } from './features/expenses/ExpensesPage'
import { GoalsPage } from './features/goals/GoalsPage'
import { SettingsPage } from './features/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expenses/:id" element={<ExpenseFormPage />} />
        <Route path="add" element={<ExpenseFormPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="budget" element={<CategoriesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
