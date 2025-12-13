import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/pest-control/$pestId/')({
  component: RouteComponent,
})

async function getPestById(id: string) {
    const res = await fetch(`${API_URL}/pest-controls/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data.data;
}

async function deletePestControl(id: number) {
    const res = await fetch(`${API_URL}/pest-controls/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
}
  
function RouteComponent() {
    const { landId, pestId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    const { data: pest, isLoading, isError, error } = useQuery({
      queryKey: ["pest", pestId],
      queryFn: () => getPestById(pestId),
    });
  
    const deleteMutation = useMutation({
      mutationFn: deletePestControl,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["land-pests", landId] });
        navigate({ to: `/client/land/${landId}` });
      },
    });
  
    if (isLoading) return <p className="p-5">Loading...</p>;
    if (isError) return <p className="p-5 text-red-500">{(error as Error).message}</p>;
  
    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Task: {pest && pest.name}</h1>
          <div className='space-x-2'>
            <button onClick={() => navigate({ to: `/client/land/${landId}/pest-control/${pestId}/update` })} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100">Update</button>
            <button onClick={() => { if (pest && confirm(`Delete ${pest.name}?`)) deleteMutation.mutate(Number(pest.id)); }} disabled={deleteMutation.isPending} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50">{deleteMutation.isPending ? "..." : "Delete"}</button>
          </div>
        </div>

        {pest && (
          <div className="p-5">
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Task Details</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">Name:</strong> {pest.name}</p>
                    <p>
                        <strong className="font-semibold text-black">Status: </strong> 
                        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ml-2 
                            ${pest.status === 'done' ? 'bg-green-100 text-green-800' : pest.status === 'wip' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                            {pest.status.replace('_', ' ')}
                        </span>
                    </p>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  }