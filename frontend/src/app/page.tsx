
"use client";

import { useState } from "react";
import "./globals.css";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");

  // Step 1: Collect registration details
  function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setStep(2);
  }

  // Step 2: Verify OTP (temporary demo)
  function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (otp === "123456") {
      setMessage("Registration successful!");
    } else {
      setMessage("Invalid OTP. Please try again.");
    }
  }

  return (
    <main>
      <h1>Event Registration</h1>
      <p>Register now. Only 5 registrations are allowed.</p>

      {step === 1 && (
        <form onSubmit={register}>
          <label>Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <button type="submit">Continue</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyOtp}>
          <p>Enter OTP for {email}</p>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            inputMode="numeric"
            maxLength={6}
            required
          />

          <button type="submit">Verify OTP</button>
        </form>
      )}

      {message && <p>{message}</p>}
    </main>
  );
}
