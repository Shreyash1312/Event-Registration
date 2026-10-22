"use client";

import { useState } from "react";

type Props = {
  token: string;
};

export default function RegisterForm({ token }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [cancelName, setCancelName] = useState("");
  const [cancelEmail, setCancelEmail] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function registerUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
      if (!API_URL) throw new Error("API URL is not configured");

      const response = await fetch(
        `${API_URL}/registration-links/${token}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Registration failed",
        );
      }

      setMessage(
        `Registration successful! ${data.remainingSlots ?? ""} slots remaining.`,
      );
      setName("");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function cancelUserRegistration(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!window.confirm("Are you sure you want to cancel your registration?")) {
      return;
    }

    setCancelling(true);
    setMessage("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
      if (!API_URL) throw new Error("API URL is not configured");

      const response = await fetch(
        `${API_URL}/registration-links/${token}/register`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: cancelName.trim(),
            email: cancelEmail.trim().toLowerCase(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Cancellation failed",
        );
      }

      setMessage(
        `Registration cancelled successfully! ${data.remainingSlots ?? ""} slots remaining.`,
      );
      setCancelName("");
      setCancelEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-3xl font-bold text-blue-700">
          Event Registration
        </h1>

        <p className="mb-6 text-center text-gray-600">
          Register for the event or cancel your existing registration.
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
            className="w-full rounded-lg bg-blue-600 p-3 text-white disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-blue-700">{message}</p>
        )}

        <hr className="my-6" />

        <h2 className="mb-2 text-xl font-semibold text-red-700">
          Cancel My Registration
        </h2>

        <p className="mb-4 text-sm text-gray-600">
          Enter the same full name and email you used during registration.
        </p>

        <form onSubmit={cancelUserRegistration} className="space-y-4">
          <div>
            <label className="mb-1 block font-medium">Registered Full Name</label>
            <input
              className="w-full rounded-lg border p-3"
              value={cancelName}
              onChange={(event) => setCancelName(event.target.value)}
              placeholder="Enter your registered full name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium">Registered Email</label>
            <input
              className="w-full rounded-lg border p-3"
              type="email"
              value={cancelEmail}
              onChange={(event) => setCancelEmail(event.target.value)}
              placeholder="Enter your registered email"
              required
            />
          </div>

          <button
            className="w-full rounded-lg bg-red-600 p-3 text-white disabled:opacity-50"
            type="submit"
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel My Registration"}
          </button>
        </form>
      </div>
    </main>
  );
}