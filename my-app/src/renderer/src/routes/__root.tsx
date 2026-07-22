import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import '../assets/CSS/global.css'
import { AuthState } from '@renderer/contexts/AuthContext'
import { BookmarksProvider } from '@renderer/contexts/BookmarksContext'
import { FoldersProvider } from '@renderer/contexts/FoldersContext'
import { SearchProvider } from '@renderer/contexts/SearchContext'
import AddBookmarkModal from '@renderer/components/AddBookmarkModal/AddBookmarkModal'
import CreateFolderModal from '@renderer/components/CreateFolderModal/CreateFolderModal'
import DeleteBookmarkModal from '@renderer/components/DeleteBookmarkModal/DeleteBookmarkModal'
import EditBookmarkModal from '@renderer/components/EditBookmarkModal/EditBookmarkModal'
import RenameFolderModal from '@renderer/components/RenameFolderModal/RenameFolderModal'
import DeleteFolderModal from '@renderer/components/DeleteFolderModal/DeleteFolderModal'
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
        <FoldersProvider>
          <Navbar />
          <Outlet />
          <AddBookmarkModal />
          <EditBookmarkModal />
          <DeleteBookmarkModal />
          <CreateFolderModal />
          <RenameFolderModal />
          <DeleteFolderModal />
          <TanStackRouterDevtools />
        </FoldersProvider>
      </BookmarksProvider>
    </SearchProvider>
  )
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootLayout,
})
