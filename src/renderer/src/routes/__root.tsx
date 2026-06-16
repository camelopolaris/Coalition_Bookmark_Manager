import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

//TODO: Install and add DevTools if desired

const RootLayout = () => {

    return(


        <>
        <Link to="/testRoute">TestRoute Link</Link>
        <Outlet/>
        <TanStackRouterDevtools />
        </>
    );
}

export const Route = createRootRoute({component: RootLayout});