"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

const FAQ = [
  { keys: ["book", "appointment", "doctor"], reply: "You can book an appointment from Find a Hospital → pick a hospital → choose a doctor → select an open slot. Payment can be done online or in person." },
  { keys: ["cancel"], reply: "You can cancel from 'My Appointments'. If the hospital cancels on you, we'll automatically show alternate slots with the same doctor so you can rebook in one tap." },
  { keys: ["pharmacy", "medicine", "tablet", "prescription"], reply: "Open the Pharmacy tab, type a tablet name or upload your e-prescription — we'll search every partner pharmacy and show the nearest ones that have it in stock." },
  { keys: ["payment", "pay", "upi", "card"], reply: "We support UPI, Card, Net Banking, Wallet, and Cash on visit/delivery — choose whichever suits you at checkout." },
  { keys: ["emergency", "sos", "ambulance"], reply: "Tap the red SOS button in the corner any time — it instantly shares your GPS location with the nearest available ambulance driver." },
  { keys: ["rating", "review"], reply: "After a completed appointment, you can rate and review the hospital from 'My Appointments'. Hospitals are ranked by their average rating." },
  { keys: ["qr", "profile"], reply: "Your Profile page has a QR code with your patient ID — hospital staff can scan it for instant check-in." },
  { keys: ["language", "tamil", "hindi"], reply: "You can switch the app language (English, Tamil, Hindi) from the selector in the top navigation bar." },
  { keys: ["fee", "cost", "price", "charge"], reply: "Consultation fees vary by doctor and are shown before you confirm a booking. Pharmacy prices are shown per item before checkout." },
  { keys: ["hi", "hello", "hey"], reply: "Hi there! 👋 I'm the CityCare Assistant. Ask me about booking appointments, pharmacy orders, payments, or emergencies." },
];

function getReply(text) {
  const lower = text.toLowerCase();
  const hit = FAQ.find((f) => f.keys.some((k) => lower.includes(k)));
  if (hit) return hit.reply;
  return "I can help with booking appointments, finding nearby pharmacies, payments, reviews, or emergencies. Could you rephrase, or try one of the quick topics below?";
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your CityCare Assistant, here 24/7. How can I help — booking, pharmacy, payments, or an emergency?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!user) return null;

  function send(text) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: getReply(clean) }]);
    }, 350);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-2xl text-white shadow-lg shadow-teal-600/40 transition hover:scale-105 hover:bg-teal-700"
        aria-label="Chat with CityCare Assistant"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 left-5 z-40 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-teal-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">CityCare Assistant</p>
              <p className="text-[11px] text-teal-100">Instant answers, any time</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-lg">✕</button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.from === "bot" ? "bg-white text-slate-700 shadow-sm" : "ml-auto bg-teal-600 text-white"}`}>
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex flex-wrap gap-1 border-t border-slate-100 px-2 py-1.5">
            {["Book appointment", "Find pharmacy", "Payment options", "Emergency help"].map((q) => (
              <button key={q} onClick={() => send(q)} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200">
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t border-slate-200 p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="input !py-1.5"
            />
            <button type="submit" className="btn-primary !px-3 !py-1.5">Send</button>
          </form>
        </div>
      )}
    </>
  );
}
