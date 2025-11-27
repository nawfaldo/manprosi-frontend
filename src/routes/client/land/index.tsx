import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/client/land/')({
  component: RouteComponent,
})

async function getUserLands(userId: number) {
    const res = await fetch(`${API_URL}/users/${userId}/lands`, {
        credentials: "include",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch lands");
    }

    return data.data;
}

async function deleteLand(id: number) {
    const res = await fetch(`${API_URL}/lands/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
  
    const data = await res.json();
  
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to delete land");
    }
  
    return data;
}
  
function RouteComponent() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    const {
        data: lands,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["lands", user?.id],
        queryFn: () => getUserLands(user!.id),
        enabled: !!user?.id,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLand,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["lands", user?.id] });
        },
        onError: (err: Error) => {
          alert(err.message);
        },
    });

    return (
        <div>
            <h2>My Lands</h2>

            {isLoading && <p>Loading lands...</p>}
            {isError && <p style={{ color: "red" }}>{(error as Error).message}</p>}

            {lands && lands.length === 0 && <p>You have no lands yet.</p>}

            {lands && (
                <ul>
                {lands.map((land: any) => (
                    <li key={land.id}>
                    <strong>{land.location_name}</strong> - {land.size} Hectares{" "}

                    <button onClick={() => navigate({ to: `/client/land/${land.id}` })}>
                        View
                    </button>{" "}
                    
                    <button onClick={() => navigate({ to: `/client/land/update/${land.id}` })}>
                        Edit
                    </button>{" "}

                    <button
                        onClick={() => {
                        if (confirm(`Delete ${land.location_name}?`)) {
                            deleteMutation.mutate(land.id);
                        }
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