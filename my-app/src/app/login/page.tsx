'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-100 p-6">
            <div className="bg-white p-8 rounded-2xl shadow w-full max-w-sm">

                <h1 className="text-2xl font-semibold text-center mb-6">
                    Admin Login
                </h1>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-2 border rounded"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-2 border rounded"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-2 rounded"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

            </div>
        </div>
    );
}
