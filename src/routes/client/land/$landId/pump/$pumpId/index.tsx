import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/pump/$pumpId/')({
  component: RouteComponent,
})

async function getPumpById(id: string) {
    const res = await fetch(`${API_URL}/pumps/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data.data;
}

async function deletePump(id: number) {
    const res = await fetch(`${API_URL}/pumps/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
}
  
function RouteComponent() {
    const { landId, pumpId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    const { data: pump, isLoading, isError, error } = useQuery({
      queryKey: ["pump", pumpId],
      queryFn: () => getPumpById(pumpId),
    });
  
    const deleteMutation = useMutation({
      mutationFn: deletePump,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["land-pumps", landId] });
        navigate({ to: `/client/land/${landId}` });
      },
    });
  
    if (isLoading) return <p className="p-5">Loading...</p>;
    if (isError) return <p className="p-5 text-red-500">{(error as Error).message}</p>;
  
    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Pump: {pump && pump.name}</h1>
          <div className='space-x-2'>
            <button
                onClick={() => navigate({ to: `/client/land/${landId}/pump/${pumpId}/update` })}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
                Update
            </button>
            <button
                onClick={() => {
                  if (pump && confirm(`Delete ${pump.name}?`)) deleteMutation.mutate(Number(pump.id));
                }}
                disabled={deleteMutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
            >
                {deleteMutation.isPending ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {pump && (
          <div className="p-5">
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Pump Information</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">Name:</strong> {pump.name}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  }