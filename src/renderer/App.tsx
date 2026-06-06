import { CurrencyProvider } from './context/CurrencyContext'
import Dashboard from './pages/Dashboard'

function App(): JSX.Element {
  return (
    <CurrencyProvider>
      <Dashboard />
    </CurrencyProvider>
  )
}

export default App
