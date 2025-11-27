import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$id/sensor/create')({
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
  const { id: landId } = Route.useParams();
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
      queryClient.invalidateQueries({ queryKey: ["land", landId] });
      navigate({ to: `/client/land/${landId}/sensor` });
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
      <h2>Add New Sensor</h2>

      <form onSubmit={handleSubmit}>
        {errors.server && <p style={{ color: "red" }}>{errors.server}</p>}

        <div>
          <label>Sensor Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="idk"
          />
          {errors.name && <p style={{ color: "red" }}>{errors.name}</p>}
        </div>

        <div>
          <label>Sensor Type</label>
          <select value={sensorType} onChange={handleTypeChange}>
            <option value="">Select Type</option>
            <option value="Temperature">Temperature</option>
            <option value="Humidity">Humidity (Air)</option>
            <option value="SoilMoisture">Soil Moisture</option>
            <option value="PH">pH Level</option>
            <option value="LightIntensity">Light Intensity</option>
          </select>
          {errors.sensorType && <p style={{ color: "red" }}>{errors.sensorType}</p>}
        </div>

        <div style={{ marginTop: "10px" }}>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Sensor"}
          </button>
          
          <button 
            type="button" 
            style={{ marginLeft: "10px" }}
            onClick={() => navigate({ to: `/client/land/${landId}` })}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}