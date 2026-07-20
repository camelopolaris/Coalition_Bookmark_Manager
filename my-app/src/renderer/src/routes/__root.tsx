import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import '../assets/CSS/global.css'
import { AuthState } from '@renderer/contexts/AuthContext'

export interface RootRouterContext {
  auth: AuthState
}

const RootLayout = () => {
  const router = useRouter()
  const auth = (router.options.context as { auth?: AuthState } | undefined)?.auth

  const handleLogout = async () => {
    await auth?.handleLogout?.()
    await router.navigate({ to: '/login', search: { redirect: '/' } })
  }

  return (
    <>
      {auth?.isAuth ? (
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      ) : null}
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootLayout,
})