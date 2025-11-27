import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$id/')({
  component: RouteComponent,
})

async function getLandById(id: string) {
  const res = await fetch(`${API_URL}/lands/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Land not found");
  }

  return data.data;
}

function RouteComponent() {
  const { id } = Route.useParams();

  const { data: land, isLoading, isError, error } = useQuery({
    queryKey: ["land", id],
    queryFn: () => getLandById(id),
  });

  if (isLoading) return <p>Loading land details...</p>;
  if (isError) return <p style={{ color: "red" }}>{(error as Error).message}</p>;

  return (
    <div>
      {land && (
        <div>
          <h2>Land Details</h2>
          <p><strong>ID:</strong> {land.id}</p>
          <p><strong>Location Name:</strong> {land.location_name}</p>
          <p><strong>Size:</strong> {land.size} Hectares</p>
        </div>
      )}
    </div>
  );
}