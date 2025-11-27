import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { API_URL } from "@/constants";

export const Route = createFileRoute("/admin/create-user")({
  component: RouteComponent,
});

async function createUserRequest(payload: {
  username: string;
  password: string;
  user_role_id: number;
}) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to create user");
  }

  return data.data;
}

function RouteComponent() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRoleId, setUserRoleId] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    role?: string;
    server?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: createUserRequest,
    onSuccess: () => {
      navigate({ to: "/admin" });
    },
    onError: (err: Error) => {
      setErrors({ server: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    if (!userRoleId) newErrors.role = "User role is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      username,
      password,
      user_role_id: Number(userRoleId),
    });
  };

  return (
    <div>
      <h2>Create User</h2>
      <form onSubmit={handleSubmit}>
        {errors.server && <p style={{ color: "red" }}>{errors.server}</p>}
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
          {errors.username && <p>{errors.username}</p>}
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          {errors.password && <p>{errors.password}</p>}
        </div>
        <div>
          <label>Role</label>
          <select
            value={userRoleId}
            onChange={(e) => setUserRoleId(e.target.value)}
          >
            <option value="">Select a role</option>
            <option value="1">Admin</option>
            <option value="2">Farmer</option>
            <option value="3">Consultant</option>
          </select>
          {errors.role && <p>{errors.role}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
