import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

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
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          <TanStackRouterDevtools position="bottom-left" />
        </>
      )}
    </>
  )
}
