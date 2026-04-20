import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      {/* TODO: make this based off an env variable */}
      {(
        <>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          {/* <TanStackRouterDevtools position="bottom-left" /> */}
        </>
      )}
    </>
  )
}
