"use client";

import { useEffect, useState } from "react";

type Props = {
  token: string;
};

export default function RegisterForm({ token }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isFull, setIsFull] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

  useEffect(() => {
    let cancelled = false;

    async function checkLink() {
      if (!API_URL) {
        setMessage("API URL is not configured.");
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/registration-links/${token}`,
        );
        const data = await response.json();

        if (cancelled) return;

        if (
          response.status === 400 &&
          String(data.message).toLowerCase().includes("full")
        ) {
          setIsFull(true);
          setMessage(
            "Registration is full. We are no longer accepting registrations.",
          );
        } else if (!response.ok) {
          setMessage(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message || "Could not check registration availability.",
          );
        } else {
          setIsFull(false);
          setMessage(
            `Registration is open. ${data.remainingSlots} slots remaining.`,
          );
        }
      } catch {
        if (!cancelled) {
          setMessage("Could not connect to the registration server.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkLink();

    return () => {
      cancelled = true;
    };
  }, [API_URL, token]);

  async function registerUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || isFull) return;

    setLoading(true);
    setMessage("");

    try {
      if (!API_URL) {
        throw new Error("API URL is not configured.");
      }

      const response = await fetch(
        `${API_URL}/registration-links/${token}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Registration failed.";

        if (errorMessage.toLowerCase().includes("full")) {
          setIsFull(true);
          setMessage(
            "Registration is full. We are no longer accepting registrations.",
          );
          return;
        }

        throw new Error(errorMessage);
      }

      setName("");
      setEmail("");

      if (data.remainingSlots <= 0) {
        setIsFull(true);
        setMessage(
          "Registration successful! All 5 slots are filled. Registration is now closed.",
        );
      } else {
        setMessage(
          `Registration successful! ${data.remainingSlots} slots remaining.`,
        );
      }
    } catch (error) {
      setMessage(
        error instanceof TypeError
          ? "Could not reach the backend. Check your API URL and CORS settings."
          : error instanceof Error
            ? error.message
            : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-2 text-center text-3xl font-bold text-blue-700">
          Event Registration
        </h1>

        {checking ? (
          <p className="mt-6 text-center text-gray-600">
            Checking registration availability...
          </p>
        ) : isFull ? (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-center text-red-700">
            <h2 className="text-xl font-bold">Registration is full</h2>
            <p>We are no longer accepting registrations.</p>
          </div>
        ) : (
          <>
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
                <label className="mb-1 block font-medium">
                  Email Address
                </label>
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
          </>
        )}

        {message && !isFull && !checking && (
          <p className="mt-4 text-center text-sm text-blue-700">{message}</p>
        )}
      </div>
    </main>
  );
}