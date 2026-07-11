import {  createFileRoute, Link } from '@tanstack/react-router';
import { create } from 'domain';

export const Route = createFileRoute('/testRoute')({component: TestRoute});


 function TestRoute(){

    return(<>
        <p>TestRoute</p>
        <Link to="..">Previous</Link>
    </>);

}