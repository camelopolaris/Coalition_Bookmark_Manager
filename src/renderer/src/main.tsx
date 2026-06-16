import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { RouterProvider , createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen'

import App from './App'

//Instantiate router history for navigation purposes
const memoryHistory = createMemoryHistory({initialEntries: ["/"]});
//Instantiate the router using auto-generated route tree
const router = createRouter({ routeTree, history: memoryHistory});

//Register router interface (required by TanStack)

declare module '@tanstack/react-router'{
  interface Register {
    router: typeof router
  }
}



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>
)
