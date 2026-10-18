
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function RegisterPage() {
  const params = useParams();
  const token = params.token as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function registerUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:3002/registration-links/${token}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage(
        `Registration successful! ${data.remainingSlots} slots remaining.`
      );
      setName("");
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-3xl font-bold text-blue-700">
          Event Registration
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Enter your details to register.
        </p>

        <form onSubmit={registerUser} className="space-y-4">
          <div>
            <label className="mb-1 block font-medium">Full Name</label>
            <input
              className="w-full rounded-lg border p-3"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Email Address</label>
            <input
              className="w-full rounded-lg border p-3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-blue-700">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
