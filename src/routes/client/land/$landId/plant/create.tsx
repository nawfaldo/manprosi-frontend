import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/plant/create')({
  component: RouteComponent,
})

// Fetch Seeds untuk dropdown
async function getSeeds() {
  const res = await fetch(`${API_URL}/seeds`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error("Failed");
  return data.data;
}

type CreatePlantPayload = {
  name: string;
  quantity: number;
  land_id: number;
  seed_id: number; // <--- Ditambahkan
  planted_at: string;
}

async function createPlantRequest(payload: CreatePlantPayload) {
  const res = await fetch(`${API_URL}/plants`, {
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

  // State
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [seedId, setSeedId] = useState(""); // <--- State Seed
  const [plantedAt, setPlantedAt] = useState("");
  const [error, setError] = useState("");

  // Query Seeds
  const { data: seeds } = useQuery({ queryKey: ["seeds"], queryFn: getSeeds });

  const mutation = useMutation({
    mutationFn: createPlantRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-plants", landId] });
      navigate({ to: `/client/land/${landId}` });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !plantedAt || !seedId) {
        setError("All fields required"); return;
    }

    const formattedDate = plantedAt.length === 16 ? `${plantedAt}:00` : plantedAt;

    mutation.mutate({
      name,
      quantity: Number(quantity),
      land_id: Number(landId),
      seed_id: Number(seedId), // <--- Kirim Seed ID
      planted_at: formattedDate,
    });
  };

  return (
    <div>
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Add New Plant</h1>
          <div className='space-x-2'>
            <button type="submit" form="create-plant-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Save</button>
            <button onClick={() => navigate({ to: `/client/land/${landId}` })} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Cancel</button>
          </div>
        </div>

      <div className="p-5">
        <form id="create-plant-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Plant Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded p-2" />
            </div>

            {/* Dropdown Seed */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Seed Source</label>
                <select 
                    value={seedId} 
                    onChange={(e) => setSeedId(e.target.value)} 
                    className="border border-gray-300 rounded p-2 bg-white"
                >
                    <option value="">Select a seed</option>
                    {seeds?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="border border-gray-300 rounded p-2" />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Planted At</label>
                <input type="datetime-local" value={plantedAt} onChange={(e) => setPlantedAt(e.target.value)} className="border border-gray-300 rounded p-2 bg-white" />
            </div>
        </form>
      </div>
    </div>
  );
}