import { API_URL } from "@/constants";
import { queryOptions } from "@tanstack/react-query";
import { Outlet, redirect, createRootRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/useAuthStore";

export const Route = createRootRoute({
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context;
    const path = location.pathname;

    const roleBasePaths: Record<string, string> = {
      admin: "/admin",
      consultant: "/consultant",
      client: "/client",
    };

    try {
      const res = await queryClient.ensureQueryData(
        queryOptions({
          queryKey: ["auth"],
          queryFn: async () => {
            const res = await fetch(`${API_URL}/me`, {
              credentials: "include",
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
              throw new Error(data.error || "Not authenticated");
            }

            return data.data;
          },
        }),
      );

      useAuthStore.getState().setUser(res);

      const role = res.role?.toLowerCase();
      const rolePath = roleBasePaths[role];

      if (path.startsWith("/login")) {
        return redirect({ to: rolePath ?? "/" });
      }

      if (rolePath && !path.startsWith(rolePath)) {
        return redirect({ to: rolePath });
      }

      return null;
    } catch {
      useAuthStore.getState().clearUser();

      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        throw redirect({ to: "/login" });
      }

      return null;
    }
  },

  component: RootLayout,
});

function RootLayout() {
  return <Outlet />;
}
