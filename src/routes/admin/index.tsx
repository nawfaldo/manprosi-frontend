import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/stores/useAuthStore";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

async function logoutUser() {
  const res = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
  return res.json();
}

async function getUsers() {
  const res = await fetch(`${API_URL}/users`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch users");
  }

  return data.data;
}

async function deleteUser(id: number) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to delete user");
  }

  return data;
}

function getRoleName(roleId: number): string {
  switch (roleId) {
    case 1:
      return "Admin";
    case 2:
      return "Farmer";
    case 3:
      return "Consultant";
    default:
      return "Unknown";
  }
}

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: async () => {
      await useAuthStore.getState().clearUser();
      await queryClient.removeQueries({ queryKey: ["auth"] });
      navigate({ to: "/login" });
    },
  });

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  return (
    <div>
      <p>
        hi {user?.role} {user?.username}
      </p>

      <button
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
      >
        {logoutMutation.isPending ? "Logging out..." : "Logout"}
      </button>

      {logoutMutation.isError && (
        <p style={{ color: "red" }}>
          {(logoutMutation.error as Error).message}
        </p>
      )}

      <h2>User List</h2>
      {isLoading && <p>Loading users...</p>}
      {isError && <p style={{ color: "red" }}>{(error as Error).message}</p>}

      {users && (
        <ul>
          {users.map((u: any) => (
            <li key={u.id}>
              {u.username} ({getRoleName(u.user_role_id)}){" "}
              <button
                onClick={() => navigate({ to: `/admin/update-user/${u.id}` })}
              >
                Edit
              </button>{" "}
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${u.username}?`))
                    deleteMutation.mutate(u.id);
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
