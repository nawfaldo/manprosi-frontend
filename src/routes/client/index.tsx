import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';
import { Eye, Pencil, Trash, LogOut, Bell } from 'lucide-react';

export const Route = createFileRoute('/client/')({
  component: RouteComponent,
})

// --- API Helpers ---

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

// Fetch Notifications
async function getNotifications(userId: number) {
    const res = await fetch(`${API_URL}/users/${userId}/notifications`, {
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch notifications");
    return data.data;
}

// API Logout
async function logoutUser() {
    const res = await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Logout failed");
    return res.json();
}

function RouteComponent() {
    const [activeTab, setActiveTab] = useState('lands');
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    // --- Queries & Mutations ---

    const {
        data: lands,
        isLoading: isLoadingLands,
        isError: isErrorLands,
        error: errorLands,
    } = useQuery({
        queryKey: ["lands", user?.id],
        queryFn: () => getUserLands(user!.id),
        enabled: !!user?.id,
    });

    // Query Notifications
    const {
        data: notifications,
        isLoading: isLoadingNotif,
        isError: isErrorNotif,
        error: errorNotif,
    } = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: () => getNotifications(user!.id),
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

    // Logout Mutation
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
        { id: 'lands', label: 'lands' },
        { id: 'notifications', label: 'notifications' },
        { id: 'profile', label: 'profile' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'lands':
                if (isLoadingLands) return <p className="mt-5 text-gray-500">Loading lands...</p>;
                if (isErrorLands) return <p className="mt-5 text-red-500">{(errorLands as Error).message}</p>;
                if (lands && lands.length === 0) return <p className="mt-5 text-gray-500">You have no lands yet.</p>;

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
                                    <tr key={land.id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
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
            
            // KONTEN TAB NOTIFICATION (Desain Disamakan)
            case 'notifications':
                if (isLoadingNotif) return <p className="mt-5 text-gray-500">Loading notifications...</p>;
                if (isErrorNotif) return <p className="mt-5 text-red-500">{(errorNotif as Error).message}</p>;
                if (notifications && notifications.length === 0) return <p className="mt-5 text-gray-500">No new notifications.</p>;

                return (
                    <div className="mt-5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left border border-gray-300">
                                    <th className="p-2.5 font-normal w-16 text-center">#</th>
                                    <th className="p-2.5 font-normal">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((notif: any, index: number) => (
                                    <tr key={notif.id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                                        <td className="p-2.5 text-center text-gray-500">{index + 1}</td>
                                        <td className="p-2.5 text-gray-900 flex items-start gap-3">
                                            <Bell size={16} className="mt-1 text-blue-500 shrink-0" />
                                            <span>{notif.description}</span>
                                        </td>
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
                <h1 className='py-3'>Client Dashboard</h1>
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
            
            {activeTab === 'lands' && (
                <button
                    onClick={() => navigate({ to: '/client/land/create' })}
                    className="px-3 mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100"
                >
                    Create
                </button>
            )}
        </div>

        <div className="px-5">
            {renderTabContent()}
        </div>
      </div>
    )
}