import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/automation/create')({
  component: RouteComponent,
})

// --- Helper Functions ---
async function getLandSensors(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/sensors`, { credentials: "include" }); return (await res.json()).data; }
async function getLandPumps(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/pumps`, { credentials: "include" }); return (await res.json()).data; }
async function getLandValves(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/valves`, { credentials: "include" }); return (await res.json()).data; }

async function createAutomationRequest(payload: any) {
  const res = await fetch(`${API_URL}/automations`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.data;
}

function RouteComponent() {
  const { landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [name, setName] = useState("");
  const [sensorId, setSensorId] = useState("");
  const [sensorValue, setSensorValue] = useState("");
  const [pumpId, setPumpId] = useState("");
  const [valveId, setValveId] = useState("");
  const [error, setError] = useState("");

  // Queries untuk Dropdown
  const { data: sensors } = useQuery({ queryKey: ["land-sensors", landId], queryFn: () => getLandSensors(landId) });
  const { data: pumps } = useQuery({ queryKey: ["land-pumps", landId], queryFn: () => getLandPumps(landId) });
  const { data: valves } = useQuery({ queryKey: ["land-valves", landId], queryFn: () => getLandValves(landId) });

  const mutation = useMutation({
    mutationFn: createAutomationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-automations", landId] });
      navigate({ to: `/client/land/${landId}` });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sensorId || !sensorValue) { setError("Name, Sensor, and Value required"); return; }
    
    mutation.mutate({
      name,
      land_id: Number(landId),
      sensor_id: Number(sensorId),
      sensor_value: Number(sensorValue),
      pump_id: pumpId ? Number(pumpId) : null,
      valve_id: valveId ? Number(valveId) : null,
    });
  };

  return (
    <div>
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Add Automation</h1>
          <div className='space-x-2'>
            <button type="submit" form="create-auto-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">{mutation.isPending ? "..." : "Save"}</button>
            <button onClick={() => navigate({ to: `/client/land/${landId}` })} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Cancel</button>
          </div>
      </div>
      <div className="p-5">
        <form id="create-auto-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded p-2" placeholder="idk" />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Sensor</label>
                <select value={sensorId} onChange={(e) => setSensorId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                    <option value="">None</option>
                    {sensors?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.sensor_type})</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Sensor Value</label>
                <input type="number" step="0.1" value={sensorValue} onChange={(e) => setSensorValue(e.target.value)} className="border border-gray-300 rounded p-2" placeholder="idk" />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Pump</label>
                <select value={pumpId} onChange={(e) => setPumpId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                    <option value="">None</option>
                    {pumps?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Valve</label>
                <select value={valveId} onChange={(e) => setValveId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                    <option value="">None</option>
                    {valves?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>
        </form>
      </div>
    </div>
  );
}