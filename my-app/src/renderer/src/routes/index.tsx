import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo } from 'react'

export const Route = createFileRoute('/')({
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
  component: HomePage,
})

function HomePage() {
  const { auth } = Route.useRouteContext()

  const bookmarkSummary = useMemo(
    () => [
      { label: 'Saved bookmarks', value: '0' },
      { label: 'Folders', value: '0' },
      { label: 'Recent adds', value: '0' },
    ],
    [],
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Welcome back
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Bookmark manager home
          </h1>
          <p className="mt-2 text-slate-600">
            {auth.isAuth
              ? 'Your bookmark workspace is ready for organization.'
              : 'Sign in to unlock your bookmark workspace.'}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {bookmarkSummary.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Bookmark workspace</h2>
          <p className="mt-2 text-slate-600">
            This is the protected home page for bookmark management. Bookmark actions will be wired in next.
          </p>
        </section>
      </div>
    </div>
  )
}
