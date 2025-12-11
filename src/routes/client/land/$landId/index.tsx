import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { API_URL } from '@/constants'
import { useAuthStore } from '@/stores/useAuthStore'
import { Eye, Pencil, Trash } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/client/land/$landId/')({
  component: RouteComponent,
})

// --- API Helpers (Land, Sensor, Plant, Valve, Pump) ---
async function getLandById(id: string) { const res = await fetch(`${API_URL}/lands/${id}`, { credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data.data; }
async function deleteLand(id: number) { const res = await fetch(`${API_URL}/lands/${id}`, { method: "DELETE", credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data; }

// Sensors
async function getLandSensors(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/sensors`, { credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data.data; }
async function getLatestSensorValue(sensorId: number) { const res = await fetch(`${API_URL}/sensors/${sensorId}/latest`, { credentials: "include" }); if (res.status === 404) return null; const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data.data; }
async function deleteSensor(id: number) { const res = await fetch(`${API_URL}/sensors/${id}`, { method: "DELETE", credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data; }

// Plants
async function getLandPlants(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/plants`, { credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data.data; }
async function deletePlant(id: number) { const res = await fetch(`${API_URL}/plants/${id}`, { method: "DELETE", credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data; }

// Valves
async function getLandValves(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/valves`, { credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data.data; }
async function deleteValve(id: number) { const res = await fetch(`${API_URL}/valves/${id}`, { method: "DELETE", credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data; }

// PUMPS (NEW)
async function getLandPumps(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/pumps`, { credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data.data; }
async function deletePump(id: number) { const res = await fetch(`${API_URL}/pumps/${id}`, { method: "DELETE", credentials: "include" }); const data = await res.json(); if (!res.ok || !data.success) throw new Error(data.error); return data; }

async function getLandAutomations(landId: string) { const res = await fetch(`${API_URL}/lands/${landId}/automations`, { credentials: "include" }); return (await res.json()).data; }
async function deleteAutomation(id: number) { const res = await fetch(`${API_URL}/automations/${id}`, { method: "DELETE", credentials: "include" }); return await res.json(); }

// --- Row Components ---

function SensorRow({ sensor, navigate, onDelete }: { sensor: any, navigate: any, onDelete: (id: number) => void }) {
  const { data: latestHistory, isLoading } = useQuery({ queryKey: ["sensor-latest", sensor.id], queryFn: () => getLatestSensorValue(sensor.id), retry: false });
  return (
    <tr className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
        <td className="p-2.5 text-gray-900 whitespace-nowrap">{sensor.name}</td>
        <td className="p-2.5 text-gray-700 whitespace-nowrap">{sensor.sensor_type}</td>
        <td className="p-2.5 text-gray-700 whitespace-nowrap">{isLoading ? "Loading..." : latestHistory ? `${latestHistory.value} ${sensor.unit}` : <span className="text-gray-400 italic">No data</span>}</td>
        <td className="p-2.5 whitespace-nowrap">
            <div className="flex items-center gap-1">
                <button onClick={() => navigate({ to: `/client/land/${sensor.land_id}/sensor/${sensor.id}` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Detail"><Eye size={18} /></button>
                <button onClick={() => navigate({ to: `/client/land/${sensor.land_id}/sensor/${sensor.id}/update` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Edit"><Pencil size={18} /></button>
                <button className="p-1 text-red-500 hover:text-red-700" onClick={() => { if (confirm(`Delete sensor ${sensor.name}?`)) onDelete(sensor.id); }} title="Delete"><Trash size={18} /></button>
            </div>
        </td><td></td><td></td>
    </tr>
  );
}

function PlantRow({ plant, navigate, onDelete }: { plant: any, navigate: any, onDelete: (id: number) => void }) {
    return (
      <tr className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
          <td className="p-2.5 text-gray-900 whitespace-nowrap">{plant.name}</td>
          <td className="p-2.5 text-gray-700 whitespace-nowrap">{plant.quantity}</td>
          <td className="p-2.5 text-gray-700 whitespace-nowrap">{plant.planted_at ? new Date(plant.planted_at).toLocaleDateString() : '-'}</td>
          <td className="p-2.5 whitespace-nowrap">
              <div className="flex items-center gap-1">
                  <button onClick={() => navigate({ to: `/client/land/${plant.land_id}/plant/${plant.id}` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Detail"><Eye size={18} /></button>
                  <button onClick={() => navigate({ to: `/client/land/${plant.land_id}/plant/${plant.id}/update` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Edit"><Pencil size={18} /></button>
                  <button className="p-1 text-red-500 hover:text-red-700" onClick={() => { if (confirm(`Delete plant ${plant.name}?`)) onDelete(plant.id); }} title="Delete"><Trash size={18} /></button>
              </div>
          </td><td></td><td></td>
      </tr>
    );
}

function ValveRow({ valve, navigate, onDelete }: { valve: any, navigate: any, onDelete: (id: number) => void }) {
    return (
      <tr className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
          <td className="p-2.5 text-gray-900 whitespace-nowrap">{valve.name}</td>
          <td className="p-2.5 whitespace-nowrap">
              <div className="flex items-center gap-1">
                  <button onClick={() => navigate({ to: `/client/land/${valve.land_id}/valve/${valve.id}` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Detail"><Eye size={18} /></button>
                  <button onClick={() => navigate({ to: `/client/land/${valve.land_id}/valve/${valve.id}/update` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Edit"><Pencil size={18} /></button>
                  <button className="p-1 text-red-500 hover:text-red-700" onClick={() => { if (confirm(`Delete valve ${valve.name}?`)) onDelete(valve.id); }} title="Delete"><Trash size={18} /></button>
              </div>
          </td><td></td><td></td>
      </tr>
    );
}

function PumpRow({ pump, navigate, onDelete }: { pump: any, navigate: any, onDelete: (id: number) => void }) {
    return (
      <tr className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
          <td className="p-2.5 text-gray-900 whitespace-nowrap">{pump.name}</td>
          <td className="p-2.5 whitespace-nowrap">
              <div className="flex items-center gap-1">
                  <button onClick={() => navigate({ to: `/client/land/${pump.land_id}/pump/${pump.id}` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Detail"><Eye size={18} /></button>
                  <button onClick={() => navigate({ to: `/client/land/${pump.land_id}/pump/${pump.id}/update` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Edit"><Pencil size={18} /></button>
                  <button className="p-1 text-red-500 hover:text-red-700" onClick={() => { if (confirm(`Delete pump ${pump.name}?`)) onDelete(pump.id); }} title="Delete"><Trash size={18} /></button>
              </div>
          </td><td></td><td></td>
      </tr>
    );
}

function AutomationRow({ auto, navigate, onDelete }: { auto: any, navigate: any, onDelete: (id: number) => void }) {
  return (
    <tr className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
        <td className="p-2.5 text-gray-900 whitespace-nowrap">{auto.name}</td>
        <td className="p-2.5 text-gray-700 whitespace-nowrap">Sensor {auto.sensor_id} &gt; {auto.sensor_value}</td>
        <td className="p-2.5 text-gray-700 whitespace-nowrap">
            {auto.pump_id ? `Pump ${auto.pump_id} ` : ''} 
            {auto.valve_id ? `Valve ${auto.valve_id}` : ''}
        </td>
        <td className="p-2.5 whitespace-nowrap">
            <div className="flex items-center gap-1">
                <button onClick={() => navigate({ to: `/client/land/${auto.land_id}/automation/${auto.id}` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Detail"><Eye size={18} /></button>
                <button onClick={() => navigate({ to: `/client/land/${auto.land_id}/automation/${auto.id}/update` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Edit"><Pencil size={18} /></button>
                <button className="p-1 text-red-500 hover:text-red-700" onClick={() => { if (confirm(`Delete?`)) onDelete(auto.id); }} title="Delete"><Trash size={18} /></button>
            </div>
        </td>
        <td></td><td></td>
    </tr>
  );
}

// --- Main Component ---

function RouteComponent() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const { landId } = Route.useParams();
    
    // Updated Tabs
    const [activeTab, setActiveTab] = useState<'sensors' | 'plants' | 'valves' | 'pumps' | 'automations'>('sensors');
    
    const tabs = [
        { id: 'sensors', label: 'Sensors' },
        { id: 'plants', label: 'Plants' },
        { id: 'valves', label: 'Valves' },
        { id: 'pumps', label: 'Pumps' }, // Tab Baru
        { id: 'automations', label: 'Automations' },
    ];
  
    // Queries
    const { data: land, isLoading: isLoadingLand } = useQuery({ queryKey: ["land", landId], queryFn: () => getLandById(landId) });
    const { data: sensors, isLoading: isLoadingSensors } = useQuery({ queryKey: ["land-sensors", landId], queryFn: () => getLandSensors(landId) });
    const { data: plants, isLoading: isLoadingPlants } = useQuery({ queryKey: ["land-plants", landId], queryFn: () => getLandPlants(landId) });
    const { data: valves, isLoading: isLoadingValves } = useQuery({ queryKey: ["land-valves", landId], queryFn: () => getLandValves(landId) });
    const { data: pumps, isLoading: isLoadingPumps } = useQuery({ queryKey: ["land-pumps", landId], queryFn: () => getLandPumps(landId) });
    const { data: automations, isLoading: isLoadingAutomations } = useQuery({ queryKey: ["land-automations", landId], queryFn: () => getLandAutomations(landId) });

    // Mutations
    const deleteLandMutation = useMutation({ mutationFn: deleteLand, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lands", user?.id] }); navigate({ to: '/client' }); } });
    const deleteSensorMutation = useMutation({ mutationFn: deleteSensor, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["land-sensors", landId] }) });
    const deletePlantMutation = useMutation({ mutationFn: deletePlant, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["land-plants", landId] }) });
    const deleteValveMutation = useMutation({ mutationFn: deleteValve, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["land-valves", landId] }) });
    const deletePumpMutation = useMutation({ mutationFn: deletePump, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["land-pumps", landId] }) });
    const deleteAutomationMutation = useMutation({ mutationFn: deleteAutomation, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["land-automations", landId] }) });

  
    if (isLoadingLand) return <p className="p-5">Loading land details...</p>;
    
    // Handlers
    const handleDeleteSensor = (id: number) => deleteSensorMutation.mutate(id);
    const handleDeletePlant = (id: number) => deletePlantMutation.mutate(id);
    const handleDeleteValve = (id: number) => deleteValveMutation.mutate(id);
    const handleDeletePump = (id: number) => deletePumpMutation.mutate(id);
    const handleDeleteAutomation = (id: number) => deleteAutomationMutation.mutate(id);
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'sensors':
                return (
                    <div className="mt-5">
                        {isLoadingSensors && <p>Loading...</p>}
                        {sensors && sensors.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 text-left border border-gray-300">
                                        <th className="p-2.5 font-normal">Name</th><th className="p-2.5 font-normal">Type</th><th className="p-2.5 font-normal">Latest Value</th><th className="p-2.5 font-normal">Actions</th><th className="text-transparent">p</th><th className="text-transparent">p</th>
                                    </tr>
                                </thead>
                                <tbody>{sensors.map((s: any) => <SensorRow key={s.id} sensor={s} navigate={navigate} onDelete={handleDeleteSensor} />)}</tbody>
                            </table>
                        ) : <p className="text-gray-500">No sensors installed.</p>}
                    </div>
                );
            case 'plants':
                return (
                    <div className="mt-5">
                        {isLoadingPlants && <p>Loading...</p>}
                        {plants && plants.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 text-left border border-gray-300">
                                        <th className="p-2.5 font-normal">Name</th><th className="p-2.5 font-normal">Quantity</th><th className="p-2.5 font-normal">Planted At</th><th className="p-2.5 font-normal">Actions</th><th className="text-transparent">p</th><th className="text-transparent">p</th>
                                    </tr>
                                </thead>
                                <tbody>{plants.map((p: any) => <PlantRow key={p.id} plant={p} navigate={navigate} onDelete={handleDeletePlant} />)}</tbody>
                            </table>
                        ) : <p className="text-gray-500">No plants recorded.</p>}
                    </div>
                );
            case 'valves':
                return (
                    <div className="mt-5">
                        {isLoadingValves && <p>Loading...</p>}
                        {valves && valves.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 text-left border border-gray-300">
                                        <th className="p-2.5 font-normal">Name</th><th className="p-2.5 font-normal">Actions</th><th className="text-transparent">p</th><th className="text-transparent">p</th>
                                    </tr>
                                </thead>
                                <tbody>{valves.map((v: any) => <ValveRow key={v.id} valve={v} navigate={navigate} onDelete={handleDeleteValve} />)}</tbody>
                            </table>
                        ) : <p className="text-gray-500">No valves installed.</p>}
                    </div>
                );
            case 'pumps':
                return (
                    <div className="mt-5">
                        {isLoadingPumps && <p>Loading...</p>}
                        {pumps && pumps.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-100 text-left border border-gray-300">
                                        <th className="p-2.5 font-normal">Name</th><th className="p-2.5 font-normal">Actions</th><th className="text-transparent">p</th><th className="text-transparent">p</th>
                                    </tr>
                                </thead>
                                <tbody>{pumps.map((p: any) => <PumpRow key={p.id} pump={p} navigate={navigate} onDelete={handleDeletePump} />)}</tbody>
                            </table>
                        ) : <p className="text-gray-500">No pumps installed.</p>}
                    </div>
                );
                case 'automations':
                  return (
                      <div className="mt-5">
                          {isLoadingAutomations && <p>Loading...</p>}
                          {automations && automations.length > 0 ? (
                              <table className="w-full">
                                  <thead>
                                      <tr className="bg-gray-100 text-left border border-gray-300">
                                          <th className="p-2.5 font-normal">Name</th><th className="p-2.5 font-normal">Trigger</th><th className="p-2.5 font-normal">Action</th><th className="p-2.5 font-normal">Actions</th><th className="text-transparent">p</th><th className="text-transparent">p</th>
                                      </tr>
                                  </thead>
                                  <tbody>{automations.map((a: any) => <AutomationRow key={a.id} auto={a} navigate={navigate} onDelete={handleDeleteAutomation} />)}</tbody>
                              </table>
                          ) : <p className="text-gray-500">No automations configured.</p>}
                      </div>
                  );
            default: return null;
        }
    };
  
    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>View Land: {land && land.location_name}</h1>
          <div className='space-x-2'>
            <button onClick={() => navigate({ to: `/client/land/${landId}/update` })} className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50">Update</button>
            <button onClick={() => { if (land && confirm(`Delete ${land.location_name}?`)) deleteLandMutation.mutate(Number(land.id)); }} disabled={deleteLandMutation.isPending} className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 disabled:opacity-50">{deleteLandMutation.isPending ? "..." : "Delete"}</button>
          </div>
        </div>

        {land && <div className="p-5 mb-5"><p className="mb-1"><strong>Location Name:</strong> {land.location_name}</p><p><strong>Size:</strong> {land.size} Hectares</p></div>}

        <div className="flex justify-between px-5 border-b border-gray-300">
            <nav aria-label="Tabs" className="flex space-x-3">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-3 pt-3 px-1 ${activeTab === tab.id ? 'border-b-2 border-black font-medium' : 'border-b-2 border-transparent text-gray-500'}`}>{tab.label}</button>
                ))}
            </nav>
            <button
                onClick={() => {
                    if (activeTab === 'sensors') navigate({ to: `/client/land/${landId}/sensor/create` });
                    else if (activeTab === 'plants') navigate({ to: `/client/land/${landId}/plant/create` });
                    else if (activeTab === 'valves') navigate({ to: `/client/land/${landId}/valve/create` });
                    else if (activeTab === 'pumps') navigate({ to: `/client/land/${landId}/pump/create` });
                    else if (activeTab === 'automations') navigate({ to: `/client/land/${landId}/automation/create` });
                }}
                className="px-3 mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100"
            >
                Create
            </button>
        </div>

        <div className="px-5">{renderTabContent()}</div>
      </div>
    );
  }