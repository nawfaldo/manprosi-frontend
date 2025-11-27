import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/constants";

export const Route = createFileRoute("/admin/update-user/$id")({
  component: RouteComponent,
});

async function getUserById(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch user");
  }

  return data.data;
}

async function updateUser({
  id,
  username,
  user_role_id,
}: {
  id: string;
  username: string;
  user_role_id: number;
}) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, user_role_id }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update user");
  }

  return data.data;
}

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate({ to: "/admin" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const user_role_id = Number(formData.get("user_role_id"));
    updateMutation.mutate({ id, username, user_role_id });
  };

  if (isLoading) return <p>Loading user...</p>;
  if (isError)
    return <p style={{ color: "red" }}>{(error as Error).message}</p>;

  return (
    <div>
      <h2>Edit User ID: {id}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: </label>
          <input
            name="username"
            defaultValue={user.username}
            required
            type="text"
          />
        </div>

        <div>
          <label>Role: </label>
          <select name="user_role_id" defaultValue={user.user_role_id}>
            <option value={1}>Admin</option>
            <option value={2}>Farmer</option>
            <option value={3}>Consultant</option>
          </select>
        </div>

        <button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Updating..." : "Update User"}
        </button>
      </form>

      {updateMutation.isError && (
        <p style={{ color: "red" }}>
          {(updateMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
