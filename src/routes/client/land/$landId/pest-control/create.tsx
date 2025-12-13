import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/pest-control/create')({
  component: RouteComponent,
})

async function createPestControlRequest(payload: { name: string, status: string, land_id: number }) {
  const res = await fetch(`${API_URL}/pest-controls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error);
  return data.data;
}

function RouteComponent() {
  const { landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [status, setStatus] = useState("no_action"); // Default status
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: createPestControlRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-pests", landId] });
      navigate({ to: `/client/land/${landId}` });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name required"); return; }
    mutation.mutate({ name, status, land_id: Number(landId) });
  };

  return (
    <div>
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Add Pest Control Task</h1>
          <div className='space-x-2'>
            <button type="submit" form="create-pest-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Save</button>
            <button onClick={() => navigate({ to: `/client/land/${landId}` })} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Cancel</button>
          </div>
      </div>

      <div className="p-5">
        <form id="create-pest-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Task Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded p-2" placeholder="e.g. Spray Neem Oil" />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                    <option value="no_action">No Action</option>
                    <option value="wip">Work In Progress</option>
                    <option value="done">Done</option>
                </select>
            </div>
        </form>
      </div>
    </div>
  );
}