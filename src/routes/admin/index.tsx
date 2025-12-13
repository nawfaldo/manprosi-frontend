import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';
import { Pencil, Trash, LogOut } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
})

async function getUsers() {
  const res = await fetch(`${API_URL}/users`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch users");
  }

  return data.data;
}

async function deleteUser(id: number) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to delete user");
  }

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

function getRoleName(roleId: number): string {
  switch (roleId) {
    case 1: return "Admin";
    case 2: return "Farmer";
    case 3: return "Consultant";
    default: return "Unknown";
  }
}

function RouteComponent() {
    const [activeTab, setActiveTab] = useState('users');
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);

    // --- Queries & Mutations ---

    const {
        data: users,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
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
        { id: 'users', label: 'users' },
        { id: 'roles', label: 'user roles' },
        { id: 'profile', label: 'profile' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'users':
                if (isLoading) return <p className="mt-5 text-gray-500">Loading users...</p>;
                if (isError) return <p className="mt-5 text-red-500">{(error as Error).message}</p>;
                if (users && users.length === 0) return <p className="mt-5 text-gray-500">No users found.</p>;

                return (
                    <div className="mt-5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left border border-gray-300">
                                    <th className="p-2.5 font-normal">Username</th>
                                    <th className="p-2.5 font-normal">Role</th>
                                    <th className="p-2.5 font-normal">Actions</th>
                                    <th className="text-transparent">placeholder</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u: any) => (
                                    <tr key={u.id} className="border-b border-gray-300">
                                        <td className="p-2.5">{u.username}</td>
                                        <td className="p-2.5">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                                {getRoleName(u.user_role_id)}
                                            </span>
                                        </td>
                                        <td className="p-2.5">
                                            <div className="flex items-center">
                                                <button 
                                                    onClick={() => navigate({ to: `/admin/update-user/${u.id}` })}
                                                    className="p-1 hover:[&_svg]:stroke-[2.5]"
                                                    title="Edit User"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    className="p-1 text-red-500 hover:text-red-700" 
                                                    onClick={() => {
                                                        if (confirm(`Are you sure you want to delete ${u.username}?`)) {
                                                            deleteMutation.mutate(u.id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    title="Delete User"
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

            case 'roles':
                // Static view untuk roles karena tidak ada API roles di contoh awal
                return (
                    <div className="mt-5">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 text-left border border-gray-300">
                                    <th className="p-2.5 font-normal">ID</th>
                                    <th className="p-2.5 font-normal">Role Name</th>
                                    <th className="p-2.5 font-normal">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-300">
                                    <td className="p-2.5">1</td>
                                    <td className="p-2.5 font-medium">Admin</td>
                                    <td className="p-2.5 text-gray-500">idk</td>
                                </tr>
                                <tr className="border-b border-gray-300">
                                    <td className="p-2.5">2</td>
                                    <td className="p-2.5 font-medium">Farmer</td>
                                    <td className="p-2.5 text-gray-500">idk</td>
                                </tr>
                                <tr className="border-b border-gray-300">
                                    <td className="p-2.5">3</td>
                                    <td className="p-2.5 font-medium">Consultant</td>
                                    <td className="p-2.5 text-gray-500">idk</td>
                                </tr>
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
                <h1 className='py-3'>Admin Dashboard</h1>
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
            
            {activeTab === 'users' && (
                <button
                    onClick={() => navigate({ to: '/admin/create-user' })} 
                    className="px-3 mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100"
                >
                    Create User
                </button>
            )}
        </div>

        <div className="px-5">
            {renderTabContent()}
        </div>
      </div>
    )
}