import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Sensor from './pages/sensor.tsx'

const router = createBrowserRouter([{
  path: '/login',
  element: <App />,
}, {
  path: '/sensor',
  element: <Sensor />,
}])


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
