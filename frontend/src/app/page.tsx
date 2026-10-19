"use client";

import { useState } from "react";

type CreatedLinkResponse = {
  registrationUrl?: string;
  message?: string | string[];
};

export default function RegisterPage() {
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createRegistrationLink() {
    setLoading(true);
    setMessage("");
    setRegistrationUrl("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

      if (!API_URL) {
        throw new Error("API URL is not configured");
      }

      const response = await fetch(`${API_URL}/registration-links`, {
        method: "POST",
      });
      const data: CreatedLinkResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Could not create a registration link",
        );
      }

      if (!data.registrationUrl) {
        throw new Error("The backend response did not include a registration URL");
      }

      setRegistrationUrl(data.registrationUrl);
    } catch (error) {
      setMessage(
        error instanceof TypeError && error.message === "Failed to fetch"
          ? "Could not reach the backend. Check that it is deployed, NEXT_PUBLIC_API_URL is correct, and its CORS settings allow this site."
          : error instanceof Error
            ? error.message
            : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow">
        <h1 className="mb-2 text-3xl font-bold text-blue-700">
          Event Registration
        </h1>
        <p className="mb-6 text-gray-600">
          Create a registration link to share with participants.
        </p>

        <button
          className="w-full rounded-lg bg-blue-600 p-3 text-white disabled:opacity-50"
          type="button"
          onClick={createRegistrationLink}
          disabled={loading}
        >
          {loading ? "Creating link..." : "Create registration link"}
        </button>

        {registrationUrl && (
          <div className="mt-4 break-all">
            <p className="mb-2 text-sm text-gray-600">
              Share this link with participants:
            </p>
            <a
              className="text-blue-700 underline"
              href={registrationUrl}
            >
              {registrationUrl}
            </a>
          </div>
        )}

        {message && (
          <p className="mt-4 text-center text-sm text-red-700">{message}</p>
        )}
      </div>
    </main>
  );
}
