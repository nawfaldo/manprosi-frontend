import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'

export const Route = createFileRoute('/client/land/$landId/automation/$automationId/')({
  component: RouteComponent,
})

// --- API Helpers ---

// 1. Get Detail Automation
async function getAutomationById(id: string) {
    const res = await fetch(`${API_URL}/automations/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data.data;
}

// 2. Delete Automation
async function deleteAutomation(id: number) {
    const res = await fetch(`${API_URL}/automations/${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data;
}

// 3. Get Automation History
async function getAutomationHistory(automationId: string) {
    const res = await fetch(`${API_URL}/automations/${automationId}/history`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error);
    return data.data;
}

// 4. Helpers untuk mengambil nama komponen (Sensor, Pump, Valve)
async function getLandSensors(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/sensors`, { credentials: "include" }); return (await res.json()).data; }
async function getLandPumps(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/pumps`, { credentials: "include" }); return (await res.json()).data; }
async function getLandValves(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/valves`, { credentials: "include" }); return (await res.json()).data; }

function RouteComponent() {
    const { landId, automationId } = Route.useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    // Query Detail Automation
    const { data: auto, isLoading: isLoadingAuto } = useQuery({
      queryKey: ["automation", automationId],
      queryFn: () => getAutomationById(automationId),
    });

    // Query History Automation
    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["automation-history", automationId],
        queryFn: () => getAutomationHistory(automationId),
    });

    // Query Components untuk Lookup Nama
    const { data: sensors } = useQuery({ queryKey: ["land-sensors", landId], queryFn: () => getLandSensors(landId) });
    const { data: pumps } = useQuery({ queryKey: ["land-pumps", landId], queryFn: () => getLandPumps(landId) });
    const { data: valves } = useQuery({ queryKey: ["land-valves", landId], queryFn: () => getLandValves(landId) });
  
    const deleteMutation = useMutation({
      mutationFn: deleteAutomation,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["land-automations", landId] });
        navigate({ to: `/client/land/${landId}` });
      },
    });
  
    if (isLoadingAuto) return <p className="p-5">Loading...</p>;

    // Helper untuk mencari nama
    const getSensorName = (id: number) => sensors?.find((s: any) => s.id === id)?.name || `Sensor #${id}`;
    const getPumpName = (id: number) => pumps?.find((p: any) => p.id === id)?.name || `Pump #${id}`;
    const getValveName = (id: number) => valves?.find((v: any) => v.id === id)?.name || `Valve #${id}`;
  
    return (
      <div>
        {/* HEADER & ACTIONS */}
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Automation: {auto?.name}</h1>
          <div className='space-x-2'>
            <button onClick={() => navigate({ to: `/client/land/${landId}/automation/${automationId}/update` })} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100">Update</button>
            <button onClick={() => { if (confirm(`Delete?`)) deleteMutation.mutate(Number(auto.id)); }} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50">Delete</button>
          </div>
        </div>

        {auto && (
          <div className="p-5">
            <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Configuration</h3>
                <div className="space-y-3">
                    <p><strong className="font-semibold text-black">Type:</strong> {auto.automation_type}</p>
                    <p><strong className="font-semibold text-black">Condition:</strong> Trigger when {getSensorName(auto.sensor_id)} &gt; {auto.sensor_value}</p>
                    
                    <p>
                        <strong className="font-semibold text-black">Action Pump:</strong> 
                        {` Turn On ${getPumpName(auto.pump_id)}`}
                        {` (Dispense ${auto.dispense_amount} Liters)`}
                    </p>
                    
                    <p><strong className="font-semibold text-black">Action Valve:</strong> {`Open ${getValveName(auto.valve_id)}`}</p>
                </div>
            </div>

            {/* Bagian History Log */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Execution History</h3>
                
                {isLoadingHistory ? (
                    <p className="text-gray-500">Loading history...</p>
                ) : history && history.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-700">Triggered At</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {history.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-900">
                                            {log.triggered_at ? new Date(log.triggered_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
                                                Success
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No execution history recorded yet.</p>
                )}
            </div>
          </div>
        )}
      </div>
    );
  }