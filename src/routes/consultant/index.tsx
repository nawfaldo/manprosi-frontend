import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';
import { LogOut, Eye, Pencil, Trash } from 'lucide-react';

export const Route = createFileRoute('/consultant/')({
  component: RouteComponent,
})

// --- API Helpers ---

async function getSeeds() {
  const res = await fetch(`${API_URL}/seeds`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch seeds");
  return data.data;
}

async function deleteSeed(id: number) {
    const res = await fetch(`${API_URL}/seeds/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete seed");
    return data;
}

// Get Recommendations
async function getRecommendations() {
    const res = await fetch(`${API_URL}/recommendations`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch recommendations");
    return data.data;
}

// Delete Recommendation
async function deleteRecommendation(id: number) {
    const res = await fetch(`${API_URL}/recommendations/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete recommendation");
    return data;
}

async function logoutUser() {
    const res = await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Logout failed");
    return res.json();
}

function RouteComponent() {
    const [activeTab, setActiveTab] = useState('recommendation');
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    // --- Queries ---

    const {
        data: seeds,
        isLoading: isLoadingSeeds,
        isError: isErrorSeeds,
        error: errorSeeds,
    } = useQuery({
        queryKey: ["seeds"],
        queryFn: getSeeds,
    });

    const {
        data: recs,
        isLoading: isLoadingRecs,
        isError: isErrorRecs,
        error: errorRecs,
    } = useQuery({
        queryKey: ["recommendations"],
        queryFn: getRecommendations,
    });

    // --- Mutations ---

    const deleteSeedMutation = useMutation({
        mutationFn: deleteSeed,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["seeds"] });
        },
        onError: (err: Error) => {
          alert(err.message);
        },
    });

    const deleteRecMutation = useMutation({
        mutationFn: deleteRecommendation,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["recommendations"] });
        },
        onError: (err: Error) => {
          alert(err.message);
        },
    });

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: async () => {
            await useAuthStore.getState().clearUser();
            queryClient.removeQueries(); 
            navigate({ to: "/login" });
        },
        onError: (err: Error) => {
            alert(err.message);
        }
    });

    const tabs = [
        { id: 'recommendation', label: 'recommendation' },
        { id: 'seed', label: 'seed' },
        { id: 'profile', label: 'profile' },
    ];

    // Helper to get seed name by ID
    const getSeedName = (id: number) => {
        if (!seeds) return "Loading...";
        const found = seeds.find((s: any) => s.id === id);
        return found ? found.name : `Unknown (ID: ${id})`;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'recommendation':
                if (isLoadingRecs) return <p className="mt-5 text-gray-500">Loading recommendations...</p>;
                if (isErrorRecs) return <p className="mt-5 text-red-500">{(errorRecs as Error).message}</p>;
                if (recs && recs.length === 0) return <p className="mt-5 text-gray-500">No recommendations available.</p>;

                return (
                    <div className="mt-5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left border border-gray-300">
                                    <th className="p-2.5 font-normal">Name</th>
                                    <th className="p-2.5 font-normal">Type</th>
                                    <th className="p-2.5 font-normal">Target Seed</th>
                                    <th className="p-2.5 font-normal">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recs.map((rec: any) => (
                                    <tr key={rec.id} className="border-b border-gray-300">
                                        <td className="p-2.5 font-medium">{rec.name}</td>
                                        
                                        {/* PERBAIKAN DISINI: Gunakan rec.rec_type bukan rec.type */}
                                        <td className="p-2.5">{rec.rec_type}</td>
                                        
                                        <td className="p-2.5">{getSeedName(rec.seed_id)}</td>
                                        <td className="p-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => navigate({ to: `/consultant/recommendation/${rec.id}` })} 
                                                    className="p-1 hover:[&_svg]:stroke-[2.5]" 
                                                    title="Detail"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => navigate({ to: `/consultant/recommendation/${rec.id}/update` })} 
                                                    className="p-1 hover:[&_svg]:stroke-[2.5]" 
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button 
                                                    className="p-1 text-red-500 hover:text-red-700" 
                                                    onClick={() => { 
                                                        if (confirm(`Delete recommendation ${rec.name}?`)) {
                                                            deleteRecMutation.mutate(rec.id); 
                                                        }
                                                    }} 
                                                    title="Delete"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'seed':
                if (isLoadingSeeds) return <p className="mt-5 text-gray-500">Loading seeds...</p>;
                if (isErrorSeeds) return <p className="mt-5 text-red-500">{(errorSeeds as Error).message}</p>;
                if (seeds && seeds.length === 0) return <p className="mt-5 text-gray-500">No seeds available.</p>;

                return (
                    <div className="mt-5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left border border-gray-300">
                                    <th className="p-2.5 font-normal">ID</th>
                                    <th className="p-2.5 font-normal">Seed Name</th>
                                    <th className="p-2.5 font-normal">Actions</th>
                                    <th className="text-transparent">placeholder</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seeds.map((seed: any) => (
                                    <tr key={seed.id} className="border-b border-gray-300">
                                        <td className="p-2.5">{seed.id}</td>
                                        <td className="p-2.5 font-medium">{seed.name}</td>
                                        <td className="p-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => navigate({ to: `/consultant/seed/${seed.id}` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Detail"><Eye size={18} /></button>
                                                <button onClick={() => navigate({ to: `/consultant/seed/${seed.id}/update` })} className="p-1 hover:[&_svg]:stroke-[2.5]" title="Edit"><Pencil size={18} /></button>
                                                <button 
                                                    className="p-1 text-red-500 hover:text-red-700" 
                                                    onClick={() => { if (confirm(`Delete seed ${seed.name}?`)) deleteSeedMutation.mutate(seed.id); }} 
                                                    title="Delete"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-2.5"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            
            case 'profile':
                return (
                    <div className="mt-8">
                        <div className="space-y-3 max-w-lg">
                            <h2 className="text-3xl font-bold text-gray-900">{user?.username}</h2>
                            <p className="text-gray-900 text-xl font-medium capitalize">{user?.role}</p>

                            <div>
                                <button
                                    onClick={() => logoutMutation.mutate()}
                                    disabled={logoutMutation.isPending}
                                    className="flex items-center justify-center gap-2 px-6 py-2.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-300 transition-all font-medium w-full sm:w-auto"
                                >
                                    <LogOut size={18} />
                                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                                </button>
                                {logoutMutation.isError && (
                                    <p className="text-red-500 text-sm mt-2">
                                        {(logoutMutation.error as Error).message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
            <div className="flex space-x-5">
                <h1 className='py-3'>Consultant Dashboard</h1>
                <nav aria-label="Tabs" className="flex space-x-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 pt-3 px-1 ${
                                activeTab === tab.id 
                                    ? 'border-b-2 border-black font-medium' 
                                    : 'border-b-2 border-transparent text-gray-500 hover:text-black'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* Logic Tombol Create Berdasarkan Tab Aktif */}
            {activeTab === 'seed' && (
                <button
                    onClick={() => navigate({ to: '/consultant/seed/create' })}
                    className="px-3 mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100"
                >
                    Create Seed
                </button>
            )}
            {activeTab === 'recommendation' && (
                <button
                    onClick={() => navigate({ to: '/consultant/recommendation/create' })}
                    className="px-3 mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100"
                >
                    Create Recommendation
                </button>
            )}
        </div>

        <div className="px-5">
            {renderTabContent()}
        </div>
      </div>
    )
}