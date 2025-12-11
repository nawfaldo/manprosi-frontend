import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/automation/$automationId/update')({
  component: RouteComponent,
})

// Queries reused
async function getAutomationById(id: string) { const res = await fetch(`${API_URL}/automations/${id}`, { credentials: "include" }); return (await res.json()).data; }
async function getLandSensors(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/sensors`, { credentials: "include" }); return (await res.json()).data; }
async function getLandPumps(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/pumps`, { credentials: "include" }); return (await res.json()).data; }
async function getLandValves(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/valves`, { credentials: "include" }); return (await res.json()).data; }

async function updateAutoRequest(payload: any) {
  const res = await fetch(`${API_URL}/automations/${payload.id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).data;
}

function RouteComponent() {
  const { automationId, landId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [sensorId, setSensorId] = useState("");
  const [sensorValue, setSensorValue] = useState("");
  const [pumpId, setPumpId] = useState("");
  const [valveId, setValveId] = useState("");

  const { data: auto } = useQuery({ queryKey: ["automation", automationId], queryFn: () => getAutomationById(automationId) });
  const { data: sensors } = useQuery({ queryKey: ["land-sensors", landId], queryFn: () => getLandSensors(landId) });
  const { data: pumps } = useQuery({ queryKey: ["land-pumps", landId], queryFn: () => getLandPumps(landId) });
  const { data: valves } = useQuery({ queryKey: ["land-valves", landId], queryFn: () => getLandValves(landId) });

  useEffect(() => {
    if (auto) {
        setName(auto.name);
        setSensorId(auto.sensor_id);
        setSensorValue(auto.sensor_value);
        setPumpId(auto.pump_id || "");
        setValveId(auto.valve_id || "");
    }
  }, [auto]);

  const mutation = useMutation({
    mutationFn: updateAutoRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-automations", landId] });
      queryClient.invalidateQueries({ queryKey: ["automation", automationId] });
      navigate({ to: `/client/land/${landId}` });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
        id: automationId, name, sensor_id: Number(sensorId), sensor_value: Number(sensorValue),
        pump_id: pumpId ? Number(pumpId) : null, valve_id: valveId ? Number(valveId) : null,
    });
  };

  return (
    <div>
      <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Edit Automation</h1>
          <div className='space-x-2'>
            <button type="submit" form="edit-auto-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">{mutation.isPending ? "..." : "Update"}</button>
            <button onClick={() => navigate({ to: `/client/land/${landId}` })} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Cancel</button>
          </div>
      </div>
      <div className="p-5">
        <form id="edit-auto-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded p-2" />
            </div>
            {/* Same select inputs as create, but populated */}
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Sensor</label>
                <select value={sensorId} onChange={(e) => setSensorId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white">
                    <option value="">Select Sensor</option>
                    {sensors?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Sensor Value</label>
                <input type="number" step="0.1" value={sensorValue} onChange={(e) => setSensorValue(e.target.value)} className="border border-gray-300 rounded p-2" />
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