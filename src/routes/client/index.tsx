import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';
import { Eye, Pencil, Trash } from 'lucide-react';

export const Route = createFileRoute('/client/')({
  component: RouteComponent,
})

async function getUserLands(userId: number) {
    const res = await fetch(`${API_URL}/users/${userId}/lands`, {
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch lands");
    return data.data;
}

async function deleteLand(id: number) {
    const res = await fetch(`${API_URL}/lands/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete land");
    return data;
}

function RouteComponent() {
    const [activeTab, setActiveTab] = useState('lands');
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    const {
        data: lands,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["lands", user?.id],
        queryFn: () => getUserLands(user!.id),
        enabled: !!user?.id,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteLand,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["lands", user?.id] });
        },
        onError: (err: Error) => {
          alert(err.message);
        },
    });

    const tabs = [
        { id: 'lands', label: 'lands' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'lands':
                if (isLoading) return <p>Loading lands...</p>;
                if (isError) return <p className="text-red-500">{(error as Error).message}</p>;
                if (lands && lands.length === 0) return <p>You have no lands yet.</p>;

                return (
                    <div className="mt-5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left border border-gray-300">
                                    <th className="p-2.5 font-normal">Name</th>
                                    <th className="p-2.5 font-normal">Size (Ha)</th>
                                    <th className="p-2.5 font-normal">Actions</th>
                                    <th className="text-transparent">placeholder</th>
                                    <th className="text-transparent">placeholder</th>
                                    <th className="text-transparent">placeholder</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lands.map((land: any) => (
                                    <tr key={land.id} className="border-b border-gray-300">
                                        <td className="p-2.5">{land.location_name}</td>
                                        <td className="p-2.5">{land.size}</td>
                                        <td className="p-2.5">
                                            <div className="flex items-center">
                                                <button 
                                                    onClick={() => navigate({ to: `/client/land/${land.id}` })}
                                                    className="p-1 hover:[&_svg]:stroke-[2.5]"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => navigate({ to: `/client/land/${land.id}/update` })}
                                                    className="p-1 hover:[&_svg]:stroke-[2.5]"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    className="p-1 text-red-500 hover:text-red-700" 
                                                    onClick={() => {
                                                        if (confirm(`Delete ${land.location_name}?`)) {
                                                            deleteMutation.mutate(land.id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
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
            default:
                return null;
        }
    };

    return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
            <div className="flex space-x-5">
                <h1 className='py-3'>Client Dashboard</h1>
                <nav aria-label="Tabs" className="flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 pt-3 ${
                                activeTab === tab.id 
                                    ? 'border-b-2 border-black' 
                                    : 'border-b-2 border-transparent'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <button
                onClick={() => navigate({ to: '/client/land/create' })}
                className="px-3 mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100"
            >
                Create
            </button>
        </div>

        <div className="px-5">
            {renderTabContent()}
        </div>
      </div>
    )
}