import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import '../assets/CSS/global.css'
import { AuthState } from '@renderer/contexts/AuthContext'
import { SearchProvider } from '@renderer/contexts/SearchContext'
import Navbar from '@renderer/components/Navbar/Navbar'

export interface RootRouterContext {
  auth: AuthState
}

const RootLayout = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const showNavbar = pathname !== '/login'

  if (!showNavbar) {
    return (
      <>
        <Outlet />
        <TanStackRouterDevtools />
      </>
    )
  }

  return (
    <SearchProvider>
      <Navbar />
      <Outlet />
      <TanStackRouterDevtools />
    </SearchProvider>
  )
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootLayout,
})
