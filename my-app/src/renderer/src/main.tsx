
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen'
import { AuthProvider, useAuth } from './contexts/AuthContext';

//Instantiate router history for navigation purposes
const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
//Instantiate the router using auto-generated route tree
const router = createRouter({ routeTree, history: memoryHistory, context: { auth: undefined! } })
//Register router interface (required by TanStack)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function RouterAuthComp(){
  const auth = useAuth();
  return  <RouterProvider router={router} context={{auth}}/>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterAuthComp />
    </AuthProvider>
  </StrictMode>
)
