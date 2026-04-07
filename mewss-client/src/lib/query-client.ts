import { QueryClient } from "@tanstack/react-query";

//TODO: add in a separate staleTime for each query based off the refresh_interval in the backend feed
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: false,
      refetchIntervalInBackground: false,
    },
    mutations: {
      retry: false,
    }
  }
});
