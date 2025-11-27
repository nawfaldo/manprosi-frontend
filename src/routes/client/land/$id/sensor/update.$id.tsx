import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$id/sensor/update/$id')({
  component: RouteComponent,
})

async function getSensorById(id: string) {
  const res = await fetch(`${API_URL}/sensors/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch sensor");
  }

  return data.data;
}

async function updateSensorRequest(payload: {
  id: string;
  name: string;
  sensor_type: string;
}) {
  const res = await fetch(`${API_URL}/sensors/${payload.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: payload.name,
      sensor_type: payload.sensor_type,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to update sensor");
  }

  return data.data;
}

function RouteComponent() {
  const { id: sensorId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [sensorType, setSensorType] = useState("");
  
  const { data: sensor, isLoading, isError, error } = useQuery({
    queryKey: ["sensor", sensorId],
    queryFn: () => getSensorById(sensorId),
  });

  useEffect(() => {
    if (sensor) {
      setName(sensor.name);
      setSensorType(sensor.sensor_type);
    }
  }, [sensor]);

  const mutation = useMutation({
    mutationFn: updateSensorRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["land-sensors", data.land_id] });
      queryClient.invalidateQueries({ queryKey: ["sensor", sensorId] });
      
      navigate({ to: `/client/land/${data.land_id}/sensor` });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sensorType) return;

    mutation.mutate({
      id: sensorId,
      name,
      sensor_type: sensorType,
    });
  };

  if (isLoading) return <p>Loading sensor...</p>;
  if (isError) return <p>{(error as Error).message}</p>;

  return (
    <div>
      <h2>Update Sensor</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label>Type</label>
          <select 
            value={sensorType} 
            onChange={(e) => setSensorType(e.target.value)}
          >
            <option value="Temperature">Temperature</option>
            <option value="Humidity">Humidity</option>
            <option value="SoilMoisture">Soil Moisture</option>
            <option value="PH">pH</option>
            <option value="LightIntensity">Light Intensity</option>
          </select>
        </div>

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Updating..." : "Save Changes"}
        </button>

        <button 
          type="button" 
          onClick={() => navigate({ to: `/client/land/${sensor.land_id}/sensor` })}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}