"use client";

import { useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import PaymentMethodSelector from "../../../components/PaymentMethodSelector";
import { StarDisplay } from "../../../components/StarRating";
import { useGeolocation } from "../../../lib/useGeolocation";
import { api } from "../../../lib/api";

function PharmacyContent() {
  const { coords } = useGeolocation();
  const [medText, setMedText] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [file, setFile] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [cartPharmacy, setCartPharmacy] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState("");

  async function search(e) {
    e?.preventDefault();
    setSearching(true);
    setError("");
    setResults(null);
    setCart([]);
    setCartPharmacy(null);
    try {
      if (file) {
        await api.post("/pharmacy/prescription-upload", (() => {
          const fd = new FormData();
          fd.append("file", file);
          return fd;
        })(), { isForm: true });
      }
      const medicines = medText.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await api.post("/pharmacy/search", {
        medicines,
        prescription_text: prescriptionText,
        lat: coords.lat,
        lng: coords.lng,
      });
      setResults(res);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSearching(false);
    }
  }

  function addToCart(pharmacy, item) {
    if (cartPharmacy && cartPharmacy.id !== pharmacy.id) {
      if (!confirm("Your cart has items from another pharmacy. Start a new cart with this pharmacy?")) return;
      setCart([]);
    }
    setCartPharmacy(pharmacy);
    setCart((c) => {
      const existing = c.find((i) => i.name === item.medicine);
      if (existing) return c.map((i) => (i.name === item.medicine ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { name: item.medicine, price: item.price, qty: 1 }];
    });
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  async function placeOrder() {
    setPlacing(true);
    setOrderSuccess("");
    try {
      await api.post("/pharmacy/orders", {
        pharmacy_id: cartPharmacy.id,
        items: cart,
        payment_method: paymentMethod,
      });
      setOrderSuccess(`Order placed with ${cartPharmacy.name}! Total ₹${total.toFixed(2)} via ${paymentMethod.toUpperCase()}.`);
      setCart([]);
      setCartPharmacy(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">💊 Pharmacy</h1>
      <p className="mt-1 text-sm text-slate-500">Search any outer pharmacy in our network — we'll find the nearest one that has your medicine in stock.</p>

      <form onSubmit={search} className="card mt-5">
        <label className="mb-1 block text-sm font-medium text-slate-600">Tablet / medicine names (comma separated)</label>
        <input
          className="input"
          placeholder="e.g. Paracetamol, Azithromycin"
          value={medText}
          onChange={(e) => setMedText(e.target.value)}
        />

        <label className="mb-1 mt-4 block text-sm font-medium text-slate-600">Or paste your e-prescription text</label>
        <textarea
          className="input"
          rows={2}
          placeholder="e.g. Tab. Amoxicillin 500mg BD x 5 days, Tab. Cetirizine 10mg OD"
          value={prescriptionText}
          onChange={(e) => setPrescriptionText(e.target.value)}
        />

        <label className="mb-1 mt-4 block text-sm font-medium text-slate-600">Or upload e-prescription (image / PDF)</label>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-slate-600" />

        <button className="btn-primary mt-4 !bg-orange-600 hover:!bg-orange-700" disabled={searching}>
          {searching ? "Searching pharmacies..." : "Find nearest pharmacy in stock"}
        </button>
        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
      </form>

      {results && (
        <div className="mt-6">
          {results.unresolved_terms.length > 0 && (
            <p className="mb-3 text-xs text-amber-600">Couldn't recognize: {results.unresolved_terms.join(", ")}</p>
          )}
          {results.pharmacies.length === 0 ? (
            <p className="text-slate-400">No nearby pharmacy currently stocks these medicines.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.pharmacies.map((ph) => (
                <div key={ph.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{ph.name} {ph.is_open_24h && <span className="badge bg-emerald-100 text-emerald-700">24x7</span>}</p>
                      <StarDisplay value={ph.rating_avg} size="text-xs" />
                    </div>
                    {typeof ph.distance_km === "number" && <span className="text-xs font-medium text-teal-600">{ph.distance_km} km</span>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ph.address}</p>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {ph.matched_medicines.map((m) => (
                      <div key={m.medicine} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm">
                        <span className="text-slate-700">{m.medicine}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">₹{m.price.toFixed(2)}</span>
                          <button onClick={() => addToCart(ph, m)} className="rounded-md bg-orange-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-orange-700">Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cart.length > 0 && (
        <div className="card mt-6 border-orange-200 bg-orange-50/40">
          <h3 className="font-semibold text-slate-800">Your cart · {cartPharmacy?.name}</h3>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            {cart.map((i) => (
              <div key={i.name} className="flex justify-between">
                <span>{i.name} × {i.qty}</span>
                <span>₹{(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-orange-200 pt-2 font-semibold text-slate-800">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <h4 className="mt-4 mb-2 text-sm font-semibold text-slate-700">Payment method</h4>
          <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          <button disabled={placing} onClick={placeOrder} className="btn-primary mt-4 w-full !bg-orange-600 hover:!bg-orange-700">
            {placing ? "Placing order..." : "Place order"}
          </button>
          {orderSuccess && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{orderSuccess}</p>}
        </div>
      )}
    </div>
  );
}

export default function PharmacyPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <PharmacyContent />
    </RoleGuard>
  );
}
