import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/sensor/$sensorId/')({
  component: RouteComponent,
})

// --- API Helpers ---

// 1. Ambil detail satu sensor berdasarkan ID
async function getSensorById(sensorId: string) {
    const res = await fetch(`${API_URL}/sensors/${sensorId}`, {
      credentials: "include",
    });
    
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch sensor");
    return data.data;
}

// 2. Ambil nilai terakhir (History)
async function getLatestSensorValue(sensorId: string) {
    const res = await fetch(`${API_URL}/sensors/${sensorId}/latest`, {
      credentials: "include",
    });
    
    if (res.status === 404) return null;
  
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed");
    return data.data;
}

// 3. Hapus Sensor
async function deleteSensor(id: number) {
    const res = await fetch(`${API_URL}/sensors/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
    return data;
}
  
function RouteComponent() {
    const { landId, sensorId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    // Query Detail Sensor
    const { 
      data: sensor, 
      isLoading: isLoadingSensor, 
      isError: isErrorSensor, 
      error: errorSensor 
    } = useQuery({
      queryKey: ["sensor", sensorId],
      queryFn: () => getSensorById(sensorId),
    });

    // Query Nilai Terakhir
    const { 
        data: latestVal, 
        isLoading: isLoadingVal 
    } = useQuery({
        queryKey: ["sensor-latest", sensorId],
        queryFn: () => getLatestSensorValue(sensorId),
        enabled: !!sensorId // Hanya jalan jika sensorId ada
    });
  
    // Mutation Delete
    const deleteMutation = useMutation({
      mutationFn: deleteSensor,
      onSuccess: () => {
        // Refresh list sensor di halaman land
        queryClient.invalidateQueries({ queryKey: ["land-sensors", landId] });
        // Kembali ke halaman detail Land
        navigate({ to: `/client/land/${landId}` });
      },
      onError: (err: Error) => {
        alert(err.message);
      },
    });
  
    if (isLoadingSensor) return <p className="p-5">Loading sensor details...</p>;
    if (isErrorSensor) return <p className="p-5 text-red-500">{(errorSensor as Error).message}</p>;
  
    return (
      <div>
        {/* === HEADER & ACTIONS === */}
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Sensor: {sensor && sensor.name}</h1>
          <div className='space-x-2'>
            <button
                onClick={() => navigate({ to: `/client/land/${landId}/sensor/update/${sensorId}` })}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Update
            </button>
            <button
                onClick={() => {
                  if (sensor && confirm(`Delete sensor ${sensor.name}?`)) {
                      deleteMutation.mutate(Number(sensor.id));
                  }
                }}
                disabled={deleteMutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            >
                {deleteMutation.isPending ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {/* === SENSOR DETAIL CONTENT === */}
        {sensor && (
          <div className="p-5">
            {/* Bagian Info */}
            <div className="mb-8"> {/* Memberi jarak ke bawah agar tidak perlu garis */}
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Sensor Information</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">Name:</strong> {sensor.name}</p>
                    <p><strong className="font-semibold text-black">Type:</strong> {sensor.sensor_type}</p>
                </div>
            </div>

            {/* Bagian Reading (Tanpa border-t) */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Latest Reading</h3>
                {isLoadingVal ? (
                    <p className="text-gray-500">Loading latest value...</p>
                ) : latestVal ? (
                    <div>
                        <div className="text-4xl font-bold text-gray-900">
                            {latestVal.value}
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-2">
                            Recorded at: {latestVal.recorded_at ? new Date(latestVal.recorded_at).toLocaleString() : 'Invalid Date'}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No data recorded yet.</p>
                )}
            </div>
          </div>
        )}
      </div>
    );
  }