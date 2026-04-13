import type {QueryClient} from "@tanstack/react-query";
import {createRootRouteWithContext, Outlet} from "@tanstack/react-router";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";

interface RouterContext {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    return (
        <>
            <Outlet/>
            {/* TODO: make this based off an env variable */}
            {(
                <>
                    <ReactQueryDevtools initialIsOpen={false}/>
                    <TanStackRouterDevtools position="bottom-left"/>
                </>
            )}
        </>
    )
}
