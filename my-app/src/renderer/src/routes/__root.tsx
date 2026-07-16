import { createRootRoute, createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
require('dotenv').config()
import '../assets/CSS/global.css';
import { AuthState } from '@renderer/contexts/AuthContext';

//TODO: Install and add DevTools if desired

export interface RootRouterContext  {
    auth: AuthState
}

const RootLayout = () => {
    return(


        <>
        <Link to="/testRoute">TestRoute Link</Link>
        <Outlet/>
        <p>{process.env.EXPRESS_PUBLIC_API_BASE_URL}</p>
        <TanStackRouterDevtools />
        </>
    );
}

export const Route = createRootRouteWithContext<RootRouterContext>()({component: RootLayout});