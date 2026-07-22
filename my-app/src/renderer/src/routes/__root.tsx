import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import '../assets/CSS/global.css'
import { AuthState } from '@renderer/contexts/AuthContext'
import { BookmarksProvider } from '@renderer/contexts/BookmarksContext'
import { SearchProvider } from '@renderer/contexts/SearchContext'
import AddBookmarkModal from '@renderer/components/AddBookmarkModal/AddBookmarkModal'
import DeleteBookmarkModal from '@renderer/components/DeleteBookmarkModal/DeleteBookmarkModal'
import EditBookmarkModal from '@renderer/components/EditBookmarkModal/EditBookmarkModal'
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
      <BookmarksProvider>
        <Navbar />
        <Outlet />
        <AddBookmarkModal />
        <EditBookmarkModal />
        <DeleteBookmarkModal />
        <TanStackRouterDevtools />
      </BookmarksProvider>
    </SearchProvider>
  )
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootLayout,
})
