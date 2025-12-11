import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'
import { useState, useEffect } from 'react'

export const Route = createFileRoute(
  '/client/land/$landId/plant/$plantId/update',
)({
  component: RouteComponent,
})

// --- API Helpers ---

async function getPlantById(id: string) {
  const res = await fetch(`${API_URL}/plants/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch plant");
  }

  return data.data;
}

async function updatePlantRequest(payload: {
  id: string;
  name: string;
  quantity: number;
  planted_at: string;
}) {
  const res = await fetch(`${API_URL}/plants/${payload.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: payload.name,
      quantity: payload.quantity,
      planted_at: payload.planted_at,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update plant");
  }

  return data.data;
}

function RouteComponent() {
  const { plantId, landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State Form
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [plantedAt, setPlantedAt] = useState("");
  
  // Fetch Data
  const { data: plant, isLoading, isError, error } = useQuery({
    queryKey: ["plant", plantId],
    queryFn: () => getPlantById(plantId),
  });

  // Populate Form saat data tersedia
  useEffect(() => {
    if (plant) {
      setName(plant.name);
      setQuantity(plant.quantity);
      // Format tanggal agar sesuai dengan input type="datetime-local" (YYYY-MM-DDTHH:mm)
      if (plant.planted_at) {
          // Ambil 16 karakter pertama (misal: "2023-12-01T12:00")
          setPlantedAt(plant.planted_at.slice(0, 16));
      }
    }
  }, [plant]);

  // Mutation Update
  const mutation = useMutation({
    mutationFn: updatePlantRequest,
    onSuccess: (data) => {
      // Invalidate query untuk plant spesifik dan list plant di land tersebut
      queryClient.invalidateQueries({ queryKey: ["land-plants", data.land_id] });
      queryClient.invalidateQueries({ queryKey: ["plant", plantId] });
      
      // Navigate kembali ke detail land (sesuai flow cancel)
      navigate({ to: `/client/land/${data.land_id}` });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !plantedAt) return;

    // Pastikan format date lengkap (tambah detik jika perlu, tergantung backend)
    const formattedDate = plantedAt.length === 16 ? `${plantedAt}:00` : plantedAt;

    mutation.mutate({
      id: plantId,
      name,
      quantity: Number(quantity),
      planted_at: formattedDate,
    });
  };

  if (isLoading) return <p className="p-5">Loading plant...</p>;
  if (isError) return <p className="p-5 text-red-500">{(error as Error).message}</p>;

  return (
    <div>
       {/* HEADER & ACTIONS */}
       <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Edit Plant: {plant && plant.name}</h1>
          <div className='space-x-2'>
            <button
                type="submit"
                form="edit-plant-form" 
                disabled={mutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {mutation.isPending ? "Updating..." : "Update"}
            </button>
            
            <button
                onClick={() => navigate({ to: `/client/land/${landId}` })}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
            >
                Cancel
            </button>
          </div>
        </div>
      
      <div className="p-5">
        <form id="edit-plant-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          
          {/* Name Field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Plant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
            />
          </div>

          {/* Quantity Field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
            />
          </div>

          {/* Planted At Field */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Planted At</label>
            <input
              type="datetime-local"
              value={plantedAt}
              onChange={(e) => setPlantedAt(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black bg-white"
            />
          </div>

           {mutation.isError && (
                <p className="text-red-500 text-sm">
                    {(mutation.error as Error).message}
                </p>
            )}

        </form>
      </div>
    </div>
  );
}