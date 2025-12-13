import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/consultant/seed/$seedId/')({
  component: RouteComponent,
})

async function getSeedById(id: string) {
    const res = await fetch(`${API_URL}/seeds/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data.data;
}

async function deleteSeed(id: number) {
    const res = await fetch(`${API_URL}/seeds/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
}
  
function RouteComponent() {
    const { seedId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    const { data: seed, isLoading, isError, error } = useQuery({
      queryKey: ["seed", seedId],
      queryFn: () => getSeedById(seedId),
    });
  
    const deleteMutation = useMutation({
      mutationFn: deleteSeed,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["seeds"] });
        navigate({ to: `/consultant` });
      },
    });
  
    if (isLoading) return <p className="p-5">Loading...</p>;
    if (isError) return <p className="p-5 text-red-500">{(error as Error).message}</p>;
  
    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Seed: {seed && seed.name}</h1>
          <div className='space-x-2'>
            <button
                onClick={() => navigate({ to: `/consultant/seed/${seedId}/update` })}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
                Update
            </button>
            <button
                onClick={() => {
                  if (seed && confirm(`Delete ${seed.name}?`)) deleteMutation.mutate(Number(seed.id));
                }}
                disabled={deleteMutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
            >
                {deleteMutation.isPending ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {seed && (
          <div className="p-5">
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Seed Information</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">ID:</strong> {seed.id}</p>
                    <p><strong className="font-semibold text-black">Name:</strong> {seed.name}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  }