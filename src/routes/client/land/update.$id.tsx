import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'

export const Route = createFileRoute('/client/land/update/$id')({
  component: RouteComponent,
})

async function getLandById(id: string) {
  const res = await fetch(`${API_URL}/lands/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch land");
  }

  return data.data;
}

async function updateLand({
  id,
  location_name,
  size,
}: {
  id: string;
  location_name: string;
  size: number;
}) {
  const res = await fetch(`${API_URL}/lands/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ location_name, size }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update land");
  }

  return data.data;
}

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const {
    data: land,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["land", id],
    queryFn: () => getLandById(id),
  });

  const updateMutation = useMutation({
    mutationFn: updateLand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lands", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["land", id] });
      
      navigate({ to: "/client/land" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const location_name = formData.get("location_name") as string;
    const size = Number(formData.get("size"));

    if (!location_name || size <= 0) {
      alert("Please fill valid data");
      return;
    }

    updateMutation.mutate({ id, location_name, size });
  };

  if (isLoading) return <p>Loading land data...</p>;
  if (isError) return <p style={{ color: "red" }}>{(error as Error).message}</p>;

  return (
    <div>
      <h2>Edit Land (ID: {id})</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Location Name: </label>
          <input
            name="location_name"
            defaultValue={land.location_name}
            required
            type="text"
            placeholder="e.g. Kebun Utara"
          />
        </div>

        <div>
          <label>Size (Hectares): </label>
          <input
            name="size"
            defaultValue={land.size}
            required
            type="number"
            step="0.01"
            placeholder="e.g. 2.5"
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Updating..." : "Save Changes"}
          </button>
          
          <button 
            type="button" 
            style={{ marginLeft: "10px" }}
            onClick={() => navigate({ to: "/client/land" })}
          >
            Cancel
          </button>
        </div>
      </form>

      {updateMutation.isError && (
        <p style={{ color: "red" }}>
          {(updateMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}