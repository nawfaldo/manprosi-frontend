import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/sensor/create')({
  component: RouteComponent,
})

type CreateSensorPayload = {
  name: string;
  sensor_type: string;
  land_id: number;
}

async function createSensorRequest(payload: CreateSensorPayload) {
  const res = await fetch(`${API_URL}/sensors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to create sensor");
  }

  return data.data;
}

function RouteComponent() {
  const { landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [sensorType, setSensorType] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    sensorType?: string;
    server?: string;
  }>({});

  const mutation = useMutation({
    mutationFn: createSensorRequest,
    onSuccess: () => {
      // Refresh data sensor di halaman detail land
      queryClient.invalidateQueries({ queryKey: ["land-sensors", landId] });
      // Kembali ke halaman detail land
      navigate({ to: `/client/land/${landId}` });
    },
    onError: (err: Error) => {
      setErrors({ server: err.message });
    },
  });

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSensorType(e.target.value);
  }; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!name.trim()) newErrors.name = "Sensor name is required";
    if (!sensorType) newErrors.sensorType = "Sensor type is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      name,
      sensor_type: sensorType,
      land_id: Number(landId),
    });
  };

  return (
    <div>
      {/* HEADER & ACTIONS */}
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Add New Sensor</h1>
          <div className='space-x-2'>
            {/* Tombol Save (Header) */}
            <button
                type="submit"
                form="create-sensor-form" 
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
        <form id="create-sensor-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {errors.server && <p className="text-red-500 text-sm">{errors.server}</p>}

            {/* Sensor Name */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Sensor Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="idk"
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            {/* Sensor Type */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Sensor Type</label>
                <select
                    value={sensorType} 
                    onChange={handleTypeChange}
                    className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black bg-white"
                >
                    <option value="">Select Type</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Humidity">Humidity (Air)</option>
                    <option value="SoilMoisture">Soil Moisture</option>
                    <option value="PH">pH Level</option>
                    <option value="LightIntensity">Light Intensity</option>
                </select>
                {errors.sensorType && <p className="text-red-500 text-xs">{errors.sensorType}</p>}
            </div>
        </form>
      </div>
    </div>
  );
}