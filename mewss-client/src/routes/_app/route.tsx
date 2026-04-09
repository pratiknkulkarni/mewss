import {createFileRoute} from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
    component: RouteComponent,
})

function RouteComponent() {
    return (<div>
        <p>this is a landing page of sorts</p>
    </div>)
}
