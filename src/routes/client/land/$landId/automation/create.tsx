import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { API_URL } from '@/constants'
import { Info, Filter } from 'lucide-react'

export const Route = createFileRoute('/client/land/$landId/automation/create')({
  component: RouteComponent,
})

// --- Helper Functions ---
async function getLandSensors(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/sensors`, { credentials: "include" }); return (await res.json()).data; }
async function getLandPumps(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/pumps`, { credentials: "include" }); return (await res.json()).data; }
async function getLandValves(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/valves`, { credentials: "include" }); return (await res.json()).data; }

async function getRecommendations() { const res = await fetch(`${API_URL}/recommendations`, { credentials: "include" }); return (await res.json()).data; }
async function getSeeds() { const res = await fetch(`${API_URL}/seeds`, { credentials: "include" }); return (await res.json()).data; }

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

  // State Form
  const [name, setName] = useState("");
  const [type, setType] = useState("Watering");
  const [sensorId, setSensorId] = useState("");
  const [sensorValue, setSensorValue] = useState("");
  const [pumpId, setPumpId] = useState("");
  const [valveId, setValveId] = useState("");
  const [dispenseAmount, setDispenseAmount] = useState("");
  const [error, setError] = useState("");

  // State Filter Rekomendasi (Kanan)
  const [selectedSeedFilter, setSelectedSeedFilter] = useState(""); 

  // Queries
  const { data: sensors } = useQuery({ queryKey: ["land-sensors", landId], queryFn: () => getLandSensors(landId) });
  const { data: pumps } = useQuery({ queryKey: ["land-pumps", landId], queryFn: () => getLandPumps(landId) });
  const { data: valves } = useQuery({ queryKey: ["land-valves", landId], queryFn: () => getLandValves(landId) });
  
  const { data: recommendations } = useQuery({ queryKey: ["recommendations"], queryFn: getRecommendations });
  const { data: seeds } = useQuery({ queryKey: ["seeds"], queryFn: getSeeds });

  // Filter Logic
  const filteredRecommendations = recommendations?.filter((rec: any) => {
      const matchType = rec.rec_type === type;
      const matchSeed = selectedSeedFilter ? rec.seed_id === Number(selectedSeedFilter) : true;
      return matchType && matchSeed;
  }) || [];

  const getSeedName = (id: number) => seeds?.find((s: any) => s.id === id)?.name || `Seed #${id}`;

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
    if (!name || !sensorId || !sensorValue || !pumpId || !valveId || !dispenseAmount) { 
      setError("All fields are mandatory!"); 
      return; 
    }
    
    mutation.mutate({
      name,
      automation_type: type,
      land_id: Number(landId),
      sensor_id: Number(sensorId),
      sensor_value: Number(sensorValue),
      pump_id: Number(pumpId),
      valve_id: Number(valveId),
      dispense_amount: Number(dispenseAmount),
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-60px)] overflow-hidden">
      
      <div className="flex-1 flex flex-col h-full border-r border-gray-200 bg-white overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h1 className='text-lg font-semibold text-gray-800'>Add Automation</h1>
            <div className='space-x-3'>
              <button onClick={() => navigate({ to: `/client/land/${landId}` })} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" form="create-auto-form" disabled={mutation.isPending} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">{mutation.isPending ? "Saving..." : "Save"}</button>
            </div>
        </div>
        
        <div className="p-6">
          <form id="create-auto-form" onSubmit={handleSubmit} className="space-y-6 max-w-xl">
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
              
              <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Automation Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" placeholder="e.g. Morning Watering" />
              </div>

              <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none">
                      <option value="Watering">Watering</option>
                      <option value="Fertilization">Fertilization</option>
                      <option value="PestControl">Pest Control</option>
                  </select>
                  <p className="text-xs text-gray-500">Changes the recommendations on the right panel.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Trigger Sensor</label>
                    <select value={sensorId} onChange={(e) => setSensorId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black outline-none">
                        <option value="">Select Sensor</option>
                        {sensors?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.sensor_type})</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Threshold Value</label>
                    <input type="number" step="0.1" value={sensorValue} onChange={(e) => setSensorValue(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" placeholder="0.0" />
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Action Pump *</label>
                  <select value={pumpId} onChange={(e) => setPumpId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black outline-none" required>
                      <option value="">Select Pump</option>
                      {pumps?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
              </div>

              <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Action Valve *</label>
                  <select value={valveId} onChange={(e) => setValveId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-black outline-none" required>
                      <option value="">Select Valve</option>
                      {valves?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
              </div>

              <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Dispense Amount (Liters) *</label>
                  <input type="number" step="0.1" value={dispenseAmount} onChange={(e) => setDispenseAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none" placeholder="e.g. 5.0" required />
              </div>
          </form>
        </div>
      </div>

      <div className="w-full md:w-[400px] bg-gray-50 flex flex-col h-full overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-1">
                <Info size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">Expert Recommendations</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">Based on best practices for <strong>{type}</strong>.</p>
            
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
        
        <div className="px-5 overflow-y-auto flex-1 space-y-3">
            {filteredRecommendations.length > 0 ? (
                filteredRecommendations.map((rec: any) => (
                    <div key={rec.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                    <p className="text-xs text-gray-400 mt-1">Try changing the plant filter or automation type.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}