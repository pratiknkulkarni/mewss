import { useQuery } from "@tanstack/react-query";

interface GlobalArticleListParams {

}

export function useGlobalArticles(params?: GlobalArticleListParams) {
  return useQuery({
    queryFn: async () => {
      console.log("here")
      const url = "/api/articles";
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      })

      console.log(response)

      return response.json();
    },
    staleTime: 60000,
    refetchInterval: 60000
  })
}
