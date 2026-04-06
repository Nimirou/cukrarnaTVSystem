"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Přihlášení se nezdařilo");
      }
    } catch {
      setError("Chyba připojení k serveru");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-zinc-900 text-center mb-6">
          Cukrárna Signage
        </h1>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-zinc-900 mb-1">
            Heslo
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-md px-3 py-2 w-full text-zinc-900 mb-4"
            placeholder="Zadejte heslo..."
            autoFocus
          />
          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}
