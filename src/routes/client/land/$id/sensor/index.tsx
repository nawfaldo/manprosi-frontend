import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$id/sensor/')({
  component: RouteComponent,
})

async function getLandSensors(landId: string) {
  const res = await fetch(`${API_URL}/lands/${landId}/sensors`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch sensors");
  return data.data;
}

async function getLatestSensorValue(sensorId: number) {
  const res = await fetch(`${API_URL}/sensors/${sensorId}/latest`, {
    credentials: "include",
  });
  
  if (res.status === 404) return null;

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed");
  return data.data;
}

async function deleteSensor(id: number) {
  const res = await fetch(`${API_URL}/sensors/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
  return data;
}

function SensorItem({ sensor, navigate, onDelete }: { sensor: any, navigate: any, onDelete: (id: number) => void }) {
  const { data: latestHistory, isLoading } = useQuery({
    queryKey: ["sensor-latest", sensor.id],
    queryFn: () => getLatestSensorValue(sensor.id),
    retry: false,
  });

  return (
    <li>
      <p><strong>Name:</strong> {sensor.name}</p>
      <p><strong>Type:</strong> {sensor.sensor_type}</p>
      
      <p>
        <strong>Current Value: </strong> 
        {isLoading ? (
          "Loading..."
        ) : latestHistory ? (
          <span>{latestHistory.value} {sensor.unit}</span>
        ) : (
          <span style={{ color: "gray" }}>No data</span>
        )}
      </p>

      <div>
        <button 
            onClick={() => navigate({ 
                to: `/client/land/${sensor.land_id}/sensor/${sensor.id}/history` 
            })}
        >
            History
        </button>{" "}

        <button 
          onClick={() => navigate({ 
            to: `/client/land/${sensor.land_id}/sensor/update/${sensor.id}` 
          })}
        >
          Edit
        </button>{" "}
        
        <button
          onClick={() => {
            if (confirm(`Delete sensor ${sensor.name}?`)) {
              onDelete(sensor.id);
            }
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { 
    data: sensors, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ["land-sensors", id],
    queryFn: () => getLandSensors(id),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-sensors", id] });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  if (isLoading) return <p>Loading sensors...</p>;
  if (isError) return <p>{(error as Error).message}</p>;

  return (
    <div>
      <h2>Sensors for Land ID: {id}</h2>
      
      <button onClick={() => navigate({ to: `/client/land/${id}/sensor/create` })}>
        Add New Sensor
      </button>

      {sensors && sensors.length === 0 && <p>No sensors installed yet.</p>}

      {sensors && (
        <ul>
          {sensors.map((sensor: any) => (
            <SensorItem 
              key={sensor.id} 
              sensor={sensor} 
              navigate={navigate}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}