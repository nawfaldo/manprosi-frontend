import { API_URL } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react';

export const Route = createFileRoute('/client/land/create')({
  component: RouteComponent,
})

async function createLandRequest(payload: {
  location_name: string;
  size: number;
  user_id: number;
}) {
  const res = await fetch(`${API_URL}/lands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to create land");
  }

  return data.data;
}

function RouteComponent() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const [locationName, setLocationName] = useState("");
  const [size, setSize] = useState("");
  const [errors, setErrors] = useState<{
      locationName?: string;
      size?: string;
      server?: string;
  }>({});

  const mutation = useMutation({
      mutationFn: createLandRequest,
      onSuccess: () => {
          navigate({ to: "/client" });
      },
      onError: (err: Error) => {
          setErrors({ server: err.message });
      },
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const newErrors: typeof errors = {};
      
      if (!locationName.trim()) newErrors.locationName = "Location name is required";
      if (!size || Number(size) <= 0) newErrors.size = "Size must be greater than 0";
      if (!user?.id) newErrors.server = "User session not found. Please relogin.";

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      mutation.mutate({
          location_name: locationName,
          size: Number(size),
          user_id: user!.id,
      });
  };

  return (
      <div>
        <div className="flex justify-between px-5 border-b border-gray-300">
          <h1 className='py-3'>Create Land</h1>
          <div className='space-x-2'>
            {/* Tombol Save Header (Sekarang menghandle loading state) */}
            <button
                type="submit"
                form="create-land-form" 
                disabled={mutation.isPending}
                className="w-[80px] mt-1 h-[40px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {mutation.isPending ? "Saving..." : "Save"}
            </button>
            
            {/* Tombol Cancel */}
            <button
                onClick={() => navigate({ to: '/client' })}
                className="w-[80px] mt-1 h-[40px] border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
            >
                Cancel
            </button>
          </div>
        </div>

        <div className="p-5">
            {/* Form dikaitkan dengan ID "create-land-form" */}
            <form id="create-land-form" onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                {errors.server && <p className="text-red-500 text-sm">{errors.server}</p>}
                
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Location Name</label>
                    <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="idk"
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
                    />
                    {errors.locationName && <p className="text-red-500 text-xs">{errors.locationName}</p>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Size (Ha)</label>
                    <input
                        type="number"
                        step="0.1" 
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="idk"
                        className="border border-gray-300 rounded p-2 focus:outline-none focus:border-black"
                    />
                    {errors.size && <p className="text-red-500 text-xs">{errors.size}</p>}
                </div>
            </form>
        </div>
      </div>
  );
}