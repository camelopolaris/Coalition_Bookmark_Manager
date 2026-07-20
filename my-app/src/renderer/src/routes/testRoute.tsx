import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/testRoute')({
  component: TestRoute,
})

function TestRoute() {
  const { auth } = Route.useRouteContext()
  const previousTarget = auth.isAuth ? '/authenticated' : '/login'

  return (
    <>
      <p>TestRoute</p>
      <Link to={previousTarget}>Previous</Link>
    </>
  )
}