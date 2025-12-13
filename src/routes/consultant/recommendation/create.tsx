import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/consultant/recommendation/create')({
  component: RouteComponent,
})

// Fetch Seeds untuk dropdown
async function getSeeds() {
  const res = await fetch(`${API_URL}/seeds`, { credentials: "include" });
  return (await res.json()).data;
}

async function createRecRequest(payload: any) {
  const res = await fetch(`${API_URL}/recommendations`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data;
}

function RouteComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("Watering"); // Default
  const [seedId, setSeedId] = useState("");
  const [error, setError] = useState("");

  const { data: seeds } = useQuery({ queryKey: ["seeds"], queryFn: getSeeds });

  const mutation = useMutation({
    mutationFn: createRecRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      navigate({ to: `/consultant` });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !desc || !type || !seedId) { setError("All fields required"); return; }
    
    mutation.mutate({
      name,
      description: desc,
      rec_type: type,
      seed_id: Number(seedId),
    });
  };

  return (
    <div>
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Add Recommendation</h1>
          <div className='space-x-2'>
            <button type="submit" form="create-rec-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100">{mutation.isPending ? "..." : "Save"}</button>
            <button onClick={() => navigate({ to: `/consultant` })} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Cancel</button>
          </div>
      </div>
      <div className="p-5">
        <form id="create-rec-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded p-2" required />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="border border-gray-300 rounded p-2 h-24" required />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                    <option value="Watering">Watering</option>
                    <option value="Fertilization">Fertilization</option>
                    <option value="PestControl">Pest Control</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Target Seed</label>
                <select value={seedId} onChange={(e) => setSeedId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white" required>
                    <option value="">Select Seed</option>
                    {seeds?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </form>
      </div>
    </div>
  );
}