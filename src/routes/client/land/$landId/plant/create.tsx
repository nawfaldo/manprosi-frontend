import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/plant/create')({
  component: RouteComponent,
})

type CreatePlantPayload = {
  name: string;
  quantity: number;
  land_id: number;
  planted_at: string; // Mengirim string ISO datetime
}

async function createPlantRequest(payload: CreatePlantPayload) {
  const res = await fetch(`${API_URL}/plants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to create plant");
  }

  return data.data;
}

function RouteComponent() {
  const { landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State Form
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [plantedAt, setPlantedAt] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    quantity?: string;
    plantedAt?: string;
    server?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: createPlantRequest,
    onSuccess: () => {
      // Refresh list plants di halaman detail land
      queryClient.invalidateQueries({ queryKey: ["land-plants", landId] });
      // Kembali ke halaman detail land
      navigate({ to: `/client/land/${landId}` });
    },
    onError: (err: Error) => {
      setErrors({ server: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!name.trim()) newErrors.name = "Plant name is required";
    if (!quantity || Number(quantity) <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (!plantedAt) newErrors.plantedAt = "Planting date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format datetime agar sesuai dengan NaiveDateTime Rust (YYYY-MM-DDTHH:MM:SS)
    // Input datetime-local biasanya menghasilkan YYYY-MM-DDTHH:MM
    const formattedDate = plantedAt.length === 16 ? `${plantedAt}:00` : plantedAt;

    mutation.mutate({
      name,
      quantity: Number(quantity),
      land_id: Number(landId),
      planted_at: formattedDate,
    });
  };

  return (
    <div>
      {/* HEADER & ACTIONS */}
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Add New Plant</h1>
          <div className='space-x-2'>
            {/* Tombol Save (Header) */}
            <button
                type="submit"
                form="create-plant-form" 
                disabled={mutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {mutation.isPending ? "Adding..." : "Save"}
            </button>
            
            {/* Tombol Cancel */}
            <button
                onClick={() => navigate({ to: `/client/land/${landId}` })}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
            >
                Cancel
            </button>
          </div>
        </div>

      <div className="p-5">
        <form id="create-plant-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {errors.server && <p className="text-red-500 text-sm">{errors.server}</p>}

            {/* Plant Name */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Plant Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="idk"
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="idk"
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
                />
                {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity}</p>}
            </div>

            {/* Planted At */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Planted At</label>
                <input
                    type="datetime-local"
                    value={plantedAt}
                    onChange={(e) => setPlantedAt(e.target.value)}
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black bg-white"
                />
                {errors.plantedAt && <p className="text-red-500 text-xs">{errors.plantedAt}</p>}
            </div>
        </form>
      </div>
    </div>
  );
}