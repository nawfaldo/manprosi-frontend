import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/valve/$valveId/')({
  component: RouteComponent,
})

async function getValveById(id: string) {
    const res = await fetch(`${API_URL}/valves/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data.data;
}

async function deleteValve(id: number) {
    const res = await fetch(`${API_URL}/valves/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
}
  
function RouteComponent() {
    const { landId, valveId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    const { data: valve, isLoading, isError, error } = useQuery({
      queryKey: ["valve", valveId],
      queryFn: () => getValveById(valveId),
    });
  
    const deleteMutation = useMutation({
      mutationFn: deleteValve,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["land-valves", landId] });
        navigate({ to: `/client/land/${landId}` });
      },
    });
  
    if (isLoading) return <p className="p-5">Loading...</p>;
    if (isError) return <p className="p-5 text-red-500">{(error as Error).message}</p>;
  
    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Valve: {valve && valve.name}</h1>
          <div className='space-x-2'>
            <button
                onClick={() => navigate({ to: `/client/land/${landId}/valve/${valveId}/update` })}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
                Update
            </button>
            <button
                onClick={() => {
                  if (valve && confirm(`Delete ${valve.name}?`)) deleteMutation.mutate(Number(valve.id));
                }}
                disabled={deleteMutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
            >
                {deleteMutation.isPending ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {valve && (
          <div className="p-5">
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Valve Information</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">Name:</strong> {valve.name}</p>
                    <p><strong className="font-semibold text-black">Land ID:</strong> {valve.land_id}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  }