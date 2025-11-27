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
            navigate({ to: "/client/land" });
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
            <h2>Add New Land</h2>
            <form onSubmit={handleSubmit}>
            {errors.server && <p style={{ color: "red" }}>{errors.server}</p>}
            
            <div>
                <label>Location Name</label>
                <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="idk"
                />
                {errors.locationName && <p style={{ color: "red" }}>{errors.locationName}</p>}
            </div>

            <div>
                <label>Size</label>
                <input
                    type="number"
                    step="0.1" 
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="idk"
                />
                {errors.size && <p style={{ color: "red" }}>{errors.size}</p>}
            </div>

            <button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Land"}
            </button>
            </form>
        </div>
    );
}

