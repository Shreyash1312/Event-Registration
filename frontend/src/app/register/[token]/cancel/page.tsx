
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelRegistrationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  async function cancelRegistration(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!API_URL) {
      setMessage("API URL is not configured.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel your registration?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/registration-links/${token}/register`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cancellation failed.");
      }

      setMessage(
        data.message || "Registration cancelled successfully."
      );
      setName("");
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold">
          Cancel Registration
        </h1>

        <p className="mb-6 text-gray-600">
          Enter the same name and email address you used to register.
        </p>

        <form onSubmit={cancelRegistration} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border p-3"
          />

          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 p-3 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center" role="status">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push(`/register/${token}`)}
          className="mt-4 w-full rounded-lg border p-3"
        >
          Back to Registration
        </button>
      </div>
    </main>
  );
}
