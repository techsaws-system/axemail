const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const apiRequest = async (
    path: string,
    options: RequestInit = {}
) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
};
