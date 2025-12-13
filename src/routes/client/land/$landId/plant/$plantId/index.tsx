import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/plant/$plantId/')({
  component: RouteComponent,
})

// --- API Helpers ---

// 1. Ambil detail satu plant
async function getPlantById(plantId: string) {
    const res = await fetch(`${API_URL}/plants/${plantId}`, {
      credentials: "include",
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch plant");
    return data.data;
}

// 2. Ambil detail seed untuk ditampilkan namanya
async function getSeedById(id: number) {
  const res = await fetch(`${API_URL}/seeds/${id}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error("Failed");
  return data.data;
}

// 3. Hapus Plant
async function deletePlant(id: number) {
    const res = await fetch(`${API_URL}/plants/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
    return data;
}
  
function RouteComponent() {
    const { landId, plantId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    // Query Detail Plant
    const { 
      data: plant, 
      isLoading: isLoadingPlant, 
      isError: isErrorPlant, 
      error: errorPlant 
    } = useQuery({
      queryKey: ["plant", plantId],
      queryFn: () => getPlantById(plantId),
    });

    // Query Detail Seed (Hanya dijalankan jika plant sudah ter-load dan punya seed_id)
    const { data: seed } = useQuery({
        queryKey: ["seed", plant?.seed_id],
        queryFn: () => getSeedById(plant!.seed_id),
        enabled: !!plant?.seed_id // Penting: Jangan fetch jika plant belum ada
    });
  
    // Mutation Delete
    const deleteMutation = useMutation({
      mutationFn: deletePlant,
      onSuccess: () => {
        // Refresh list plants di halaman land
        queryClient.invalidateQueries({ queryKey: ["land-plants", landId] });
        // Kembali ke halaman detail Land
        navigate({ to: `/client/land/${landId}` });
      },
      onError: (err: Error) => {
        alert(err.message);
      },
    });
  
    if (isLoadingPlant) return <p className="p-5">Loading plant details...</p>;
    if (isErrorPlant) return <p className="p-5 text-red-500">{(errorPlant as Error).message}</p>;
  
    return (
      <div>
        {/* === HEADER & ACTIONS === */}
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Plant: {plant && plant.name}</h1>
          <div className='space-x-2'>
            <button
                onClick={() => navigate({ to: `/client/land/${landId}/plant/${plantId}/update` })}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Update
            </button>
            <button
                onClick={() => {
                  if (plant && confirm(`Delete plant ${plant.name}?`)) {
                      deleteMutation.mutate(Number(plant.id));
                  }
                }}
                disabled={deleteMutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            >
                {deleteMutation.isPending ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {/* === PLANT DETAIL CONTENT === */}
        {plant && (
          <div className="p-5">
            {/* Bagian Info */}
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Plant Information</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">Name:</strong> {plant.name}</p>
                    <p><strong className="font-semibold text-black">Quantity:</strong> {plant.quantity}</p>
                    <p><strong className="font-semibold text-black">Seed Source:</strong> {seed ? seed.name : 'Loading...'}</p>
                </div>
            </div>

            {/* Bagian Tanggal */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Planting Details</h3>
                <div>
                    <div className="text-xl font-bold text-gray-900">
                        {plant.planted_at ? new Date(plant.planted_at).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : '-'}
                    </div>
                    <p className="text-xs font-bold text-gray-400 mt-2">
                        Exact time: {plant.planted_at ? new Date(plant.planted_at).toLocaleTimeString() : ''}
                    </p>
                </div>
            </div>
          </div>
        )}
      </div>
    );
  }