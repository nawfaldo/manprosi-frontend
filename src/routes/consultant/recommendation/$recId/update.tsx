import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/consultant/recommendation/$recId/update')({
  component: RouteComponent,
})

async function getRecById(id: string) {
  const res = await fetch(`${API_URL}/recommendations/${id}`, { credentials: "include" });
  return (await res.json()).data;
}

async function getSeeds() {
  const res = await fetch(`${API_URL}/seeds`, { credentials: "include" });
  return (await res.json()).data;
}

async function updateRecRequest(payload: any) {
  const res = await fetch(`${API_URL}/recommendations/${payload.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data;
}

function RouteComponent() {
  const { recId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("");
  const [seedId, setSeedId] = useState("");

  const { data: rec } = useQuery({ queryKey: ["rec", recId], queryFn: () => getRecById(recId) });
  const { data: seeds } = useQuery({ queryKey: ["seeds"], queryFn: getSeeds });

  useEffect(() => {
    if (rec) {
        setName(rec.name);
        setDesc(rec.description);
        setType(rec.type);
        setSeedId(rec.seed_id);
    }
  }, [rec]);

  const mutation = useMutation({
    mutationFn: updateRecRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["rec", recId] });
      navigate({ to: `/consultant` });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
        id: recId,
        name,
        description: desc,
        rec_type: type,
        seed_id: Number(seedId),
    });
  };

  return (
    <div>
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Edit Recommendation</h1>
          <div className='space-x-2'>
            <button type="submit" form="edit-rec-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100">{mutation.isPending ? "..." : "Update"}</button>
            <button onClick={() => navigate({ to: `/consultant` })} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Cancel</button>
          </div>
      </div>
      <div className="p-5">
        <form id="edit-rec-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
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