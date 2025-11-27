import { API_URL } from "@/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

async function loginUser(credentials: { username: string; password: string }) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Login failed");
  }

  return data.data;
}

function RouteComponent() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    server?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(["auth"], user);

      const role = user.role.toLowerCase();
      if (role === "admin") navigate({ to: "/admin" });
      if (role === "client" || role === "farmer") navigate({ to: "/client" });
      if (role === "consultant") navigate({ to: "/consultant" });
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
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({ username, password });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {errors.server && <p style={{ color: "red" }}>{errors.server}</p>}
        <div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          {errors.username && <p>{errors.username}</p>}
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          {errors.password && <p>{errors.password}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
