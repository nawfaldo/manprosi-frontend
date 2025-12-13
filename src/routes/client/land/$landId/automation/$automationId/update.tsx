import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { API_URL } from '@/constants'
import { Info, Filter } from 'lucide-react'

export const Route = createFileRoute('/client/land/$landId/automation/$automationId/update')({
  component: RouteComponent,
})

// --- API Helpers ---
async function getAutomationById(id: string) { const res = await fetch(`${API_URL}/automations/${id}`, { credentials: "include" }); return (await res.json()).data; }
async function getLandSensors(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/sensors`, { credentials: "include" }); return (await res.json()).data; }
async function getLandPumps(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/pumps`, { credentials: "include" }); return (await res.json()).data; }
async function getLandValves(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/valves`, { credentials: "include" }); return (await res.json()).data; }

async function getRecommendations() { const res = await fetch(`${API_URL}/recommendations`, { credentials: "include" }); return (await res.json()).data; }
async function getSeeds() { const res = await fetch(`${API_URL}/seeds`, { credentials: "include" }); return (await res.json()).data; }

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

  // State Form
  const [name, setName] = useState("");
  const [type, setType] = useState(""); 
  const [sensorId, setSensorId] = useState("");
  const [sensorValue, setSensorValue] = useState("");
  const [pumpId, setPumpId] = useState("");
  const [valveId, setValveId] = useState("");
  const [dispenseAmount, setDispenseAmount] = useState("");
  const [error, setError] = useState("");

  // State Filter Kanan
  const [selectedSeedFilter, setSelectedSeedFilter] = useState(""); 

  // Queries
  const { data: auto } = useQuery({ queryKey: ["automation", automationId], queryFn: () => getAutomationById(automationId) });
  const { data: sensors } = useQuery({ queryKey: ["land-sensors", landId], queryFn: () => getLandSensors(landId) });
  const { data: pumps } = useQuery({ queryKey: ["land-pumps", landId], queryFn: () => getLandPumps(landId) });
  const { data: valves } = useQuery({ queryKey: ["land-valves", landId], queryFn: () => getLandValves(landId) });
  
  const { data: recommendations } = useQuery({ queryKey: ["recommendations"], queryFn: getRecommendations });
  const { data: seeds } = useQuery({ queryKey: ["seeds"], queryFn: getSeeds });

  // Populate Data
  useEffect(() => {
    if (auto) {
        setName(auto.name);
        setType(auto.automation_type);
        setSensorId(auto.sensor_id);
        setSensorValue(auto.sensor_value);
        setPumpId(auto.pump_id);
        setValveId(auto.valve_id);
        setDispenseAmount(auto.dispense_amount);
    }
  }, [auto]);

  // Filter Logic
  const filteredRecommendations = recommendations?.filter((rec: any) => {
      const matchType = rec.rec_type === type;
      const matchSeed = selectedSeedFilter ? rec.seed_id === Number(selectedSeedFilter) : true;
      return matchType && matchSeed;
  }) || [];

  const getSeedName = (id: number) => seeds?.find((s: any) => s.id === id)?.name || `Seed #${id}`;

  const mutation = useMutation({
    mutationFn: updateAutoRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["land-automations", landId] });
      queryClient.invalidateQueries({ queryKey: ["automation", automationId] });
      navigate({ to: `/client/land/${landId}` });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sensorId || !sensorValue || !pumpId || !valveId || !dispenseAmount) {
        setError("All fields are mandatory");
        return;
    }

    mutation.mutate({
        id: automationId, 
        name, 
        automation_type: type, 
        sensor_id: Number(sensorId), 
        sensor_value: Number(sensorValue),
        pump_id: Number(pumpId),
        valve_id: Number(valveId),
        dispense_amount: Number(dispenseAmount),
    });
  };

  return (
    // Layout Full Height Split
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] overflow-hidden bg-white">
      
      {/* BAGIAN KIRI: FORM */}
      <div className="flex-1 flex flex-col h-full border-r border-gray-300 overflow-y-auto">
        
        {/* Header Style Asli */}
        <div className="flex justify-between px-5 border-b border-gray-300 bg-white sticky top-0 z-10">
            <h1 className='py-3'>Edit Automation</h1>
            <div className='space-x-2 flex items-center'>
                {/* Tombol Style Asli */}
                <button 
                    type="submit" 
                    form="edit-auto-form" 
                    disabled={mutation.isPending} 
                    className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                    {mutation.isPending ? "..." : "Update"}
                </button>
                <button 
                    onClick={() => navigate({ to: `/client/land/${landId}` })} 
                    className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50"
                >
                    Cancel
                </button>
            </div>
        </div>

        <div className="p-5">
            <form id="edit-auto-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                {error && <p className="text-red-500 text-sm">{error}</p>}

                {/* Input Style Asli */}
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black" />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="border border-gray-300 rounded p-2 bg-white focus:outline-none focus:border-black">
                        <option value="Watering">Watering</option>
                        <option value="Fertilization">Fertilization</option>
                        <option value="PestControl">Pest Control</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Sensor</label>
                    <select value={sensorId} onChange={(e) => setSensorId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white focus:outline-none focus:border-black">
                        <option value="">Select Sensor</option>
                        {sensors?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.sensor_type})</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Sensor Value</label>
                    <input type="number" step="0.1" value={sensorValue} onChange={(e) => setSensorValue(e.target.value)} className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black" />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Pump *</label>
                    <select value={pumpId} onChange={(e) => setPumpId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white focus:outline-none focus:border-black" required>
                        <option value="">Select Pump</option>
                        {pumps?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Valve *</label>
                    <select value={valveId} onChange={(e) => setValveId(e.target.value)} className="border border-gray-300 rounded p-2 bg-white focus:outline-none focus:border-black" required>
                        <option value="">Select Valve</option>
                        {valves?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Dispense Amount (Liters) *</label>
                    <input type="number" step="0.1" value={dispenseAmount} onChange={(e) => setDispenseAmount(e.target.value)} className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black" required />
                </div>
            </form>
        </div>
      </div>

      {/* BAGIAN KANAN: RECOMMENDATIONS */}
      <div className="w-full md:w-[400px] bg-gray-50 flex flex-col h-full overflow-hidden">
        {/* Header Kanan dengan Filter (Sesuai Screenshot 2) */}
        <div className="px-5 py-4 bg-gray-50 sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-1">
                <Info size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">Expert Recommendations</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Based on best practices for <strong>{type}</strong>.</p>
            
            {/* Filter Style sesuai Screenshot 2 */}
            <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                <Filter size={14} className="text-gray-400" />
                <select 
                    value={selectedSeedFilter} 
                    onChange={(e) => setSelectedSeedFilter(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none cursor-pointer"
                >
                    <option value="">All Plants</option>
                    {seeds?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>
        
        <div className="px-5 overflow-y-auto flex-1 space-y-3 pb-5">
            {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((rec: any) => (
                    // Card Style sesuai Screenshot 2
                    <div key={rec.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight">{rec.name}</h4>
                            <span className="shrink-0 ml-2 text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {getSeedName(rec.seed_id)}
                            </span>
                        </div>
                        <p className="text-gray-600 text-xs leading-relaxed">
                            {rec.description}
                        </p>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">No recommendations found.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}