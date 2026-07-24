import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import '../assets/CSS/global.css'
import { AuthState } from '@renderer/contexts/AuthContext'
import { BookmarksProvider } from '@renderer/contexts/BookmarksContext'
import { FoldersProvider } from '@renderer/contexts/FoldersContext'
import { SessionsProvider } from '@renderer/contexts/SessionsContext'
import { SearchProvider } from '@renderer/contexts/SearchContext'
import AddBookmarkModal from '@renderer/components/AddBookmarkModal/AddBookmarkModal'
import CreateFolderModal from '@renderer/components/CreateFolderModal/CreateFolderModal'
import DeleteBookmarkModal from '@renderer/components/DeleteBookmarkModal/DeleteBookmarkModal'
import EditBookmarkModal from '@renderer/components/EditBookmarkModal/EditBookmarkModal'
import RenameFolderModal from '@renderer/components/RenameFolderModal/RenameFolderModal'
import DeleteFolderModal from '@renderer/components/DeleteFolderModal/DeleteFolderModal'
import CreateSessionModal from '@renderer/components/CreateSessionModal/CreateSessionModal'
import RenameSessionModal from '@renderer/components/RenameSessionModal/RenameSessionModal'
import DeleteSessionModal from '@renderer/components/DeleteSessionModal/DeleteSessionModal'
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
          <SessionsProvider>
            <Navbar />
            <Outlet />
            <AddBookmarkModal />
            <EditBookmarkModal />
            <DeleteBookmarkModal />
            <CreateFolderModal />
            <RenameFolderModal />
            <DeleteFolderModal />
            <CreateSessionModal />
            <RenameSessionModal />
            <DeleteSessionModal />
            <TanStackRouterDevtools />
          </SessionsProvider>
        </FoldersProvider>
      </BookmarksProvider>
    </SearchProvider>
  )
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootLayout,
})
