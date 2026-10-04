"use client";

import { useEffect, useState } from "react";

// Falls back to central Chennai if the user declines location access,
// so the "near me" sorting still works for the demo.
const FALLBACK = { lat: 13.0827, lng: 80.2707 };

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [permission, setPermission] = useState("prompt"); // prompt | granted | denied

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords(FALLBACK);
      setPermission("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermission("granted");
      },
      () => {
        setCoords(FALLBACK);
        setPermission("denied");
      },
      { timeout: 8000 }
    );
  }, []);

  return { coords: coords || FALLBACK, permission, ready: coords !== null };
}
