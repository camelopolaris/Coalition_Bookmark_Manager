import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth?.isAuth) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Protected area</h1>
      <Outlet />
    </div>
  )
}