import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
require('dotenv').config()
import '../assets/CSS/global.css';

//TODO: Install and add DevTools if desired

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

export const Route = createRootRoute({component: RootLayout});