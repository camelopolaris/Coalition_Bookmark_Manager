/*
TODO: Create fetch wrapper for sending fetch requests that require an Authorization header, 
create context provider and hook for obtaining auth state, 
functions for handling login / logout, JWT
*/

import { use, useState, createContext, PropsWithChildren } from 'react';

export interface AuthState {
    isAuth: boolean,
    handleLoginAttempt: (username: string, password: string) => Promise<void>
    handleSignup: (username: string, password: string) => Promise<void>,
    handleLogout: () => Promise<void>,
    fetchWithAuth: (endpoint: RequestInfo, options: RequestInit) => Promise<Response | undefined>,
}
//MARK: Context definition
/*
const AuthContext = createContext<{
    handleLoginAttempt: (username: string, password: string) => Promise<void>,
    handleSignup: (username: string, password: string, wants_notif: boolean) => Promise<void>,
    handleLogout: () => Promise<void>,
    fetchWithAuth: (endpoint: RequestInfo, options: RequestInit) => Promise<Response | undefined>,

}>({
    handleLoginAttempt: () => Promise.resolve(undefined),
    handleSignup: () => Promise.resolve(undefined),
    handleLogout: () => Promise.resolve(undefined),
    fetchWithAuth: () => Promise.resolve(undefined),
});
*/
const AuthContext = createContext<AuthState | undefined>(undefined);

//MARK: useAuth hook
export function useAuth() {
    const authObject = use(AuthContext);

    if (!authObject) {
        throw new Error("useAuth requires this component to have a wrapped AuthProvider in order to have access to AuthContext whether if this component is nested or not");
    }

    return authObject;
}

//MARK: Provider / context wrapper

export function AuthProvider({ children }: PropsWithChildren) {
    //MARK: Auth states
    const [token, setToken] = useState(null);
    const [isAuth, setIsAuth] = useState(false);
    //MARK: Functions with AuthProvider scope
    async function handleLoginAttempt(username: string, password: string) {

        const options = {
            method: "POST", 
            body: JSON.stringify({username: username, password: password}),
            headers: {Content: "application/json",}
        }
        try {
            const response = await fetch(`${process.env.EXPRESS_PUBLIC_API_BASE_URL}/login`, options)

            const responseJSON = await response.json();

            console.log('Login response: ', responseJSON)
        } catch (error) {
            console.error(`Failed to login.`)
        }
    }

    async function handleSignup(username: string, password: string) {

    }
    async function handleLogout() {

    }

    async function fetchWithAuth(endpoint: RequestInfo, options: RequestInit): Promise<Response | undefined> {
        const optionsWithAuthorization = { ...options, headers: { ...options?.headers, "Authorization": `Bearer ${token}` } };

        try {
            const response = await fetch(`${import.meta.env.EXPRESS_PUBLIC_API_BASE_URL}${endpoint}`, optionsWithAuthorization);

            if (response.ok) {

                //Just the response is returned so that custom handling for each responseJSON or other format can be implemented. Requires .then to be utilized since all asyncs will return a Promise requiring resolution
                return response;
            }
            else if (response.status === 401) {

                //Logs out if expired
               //TODO:

            }
            else {
                throw new Error(`Request at endpoint ${endpoint} failed. Status code: ${response.status}`)
            }
        } catch (error) {
            console.error(error);
        }

       return;
    }
    return (<>

        <AuthContext.Provider value={
            {
                isAuth,
                handleLoginAttempt,
                handleSignup,
                handleLogout,
                fetchWithAuth
            }
        }>
            {children}
        </AuthContext.Provider>
    </>);
}