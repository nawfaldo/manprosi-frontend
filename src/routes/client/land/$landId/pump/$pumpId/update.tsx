import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/client/land/$landId/pump/$pumpId/update')({
  component: RouteComponent,
})

async function getPumpById(id: string) {
  const res = await fetch(`${API_URL}/pumps/${id}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data.data;
}

async function updatePumpRequest(payload: { id: string; name: string }) {
  const res = await fetch(`${API_URL}/pumps/${payload.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name: payload.name }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data.data;
}

function RouteComponent() {
  const { pumpId, landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  const { data: pump, isLoading, isError, error } = useQuery({
    queryKey: ["pump", pumpId],
    queryFn: () => getPumpById(pumpId),
  });

  useEffect(() => { if (pump) setName(pump.name); }, [pump]);

  const mutation = useMutation({
    mutationFn: updatePumpRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-pumps", landId] });
      queryClient.invalidateQueries({ queryKey: ["pump", pumpId] });
      navigate({ to: `/client/land/${landId}` });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    mutation.mutate({ id: pumpId, name });
  };

  if (isLoading) return <p className="p-5">Loading...</p>;
  if (isError) return <p className="p-5 text-red-500">{(error as Error).message}</p>;

  return (
    <div>
       <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Edit Pump: {pump && pump.name}</h1>
          <div className='space-x-2'>
            <button
                type="submit" form="edit-pump-form" disabled={mutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
                {mutation.isPending ? "..." : "Update"}
            </button>
            <button
                onClick={() => navigate({ to: `/client/land/${landId}` })}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50"
            >
                Cancel
            </button>
          </div>
        </div>
      <div className="p-5">
        <form id="edit-pump-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Pump Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
            />
          </div>
          {mutation.isError && <p className="text-red-500 text-sm">{(mutation.error as Error).message}</p>}
        </form>
      </div>
    </div>
  );
}