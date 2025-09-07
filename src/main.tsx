import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Home from './pages/Home'
import Builder from './pages/Builder'
import AgentDetail from './pages/AgentDetail'
import AgentNew from './pages/AgentNew'
import AgentEdit from './pages/AgentEdit'
import { DataProvider } from './providers/DataProvider'
import HowItWorks from './pages/HowItWorks'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/builder', element: <Builder /> },
      { path: '/how-it-works', element: <HowItWorks /> },
      { path: '/agent/new', element: <AgentNew /> },
      { path: '/agent/:id', element: <AgentDetail /> },
      { path: '/agent/:id/edit', element: <AgentEdit /> },
    ],
  },
])

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<DataProvider>
				<RouterProvider router={router} />
			</DataProvider>
		</QueryClientProvider>
	</StrictMode>,
)
