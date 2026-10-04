"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "தமிழ்" },
  { code: "hi", label: "हिन्दी" },
];

const DICT = {
  en: {
    appName: "CityCare",
    tagline: "Hospitals & pharmacies, delivered like never before.",
    findHospital: "Find a Hospital",
    pharmacy: "Pharmacy",
    myAppointments: "My Appointments",
    profile: "Profile",
    dashboard: "Dashboard",
    emergency: "Emergency SOS",
    bookNow: "Book Now",
    nearMe: "Near Me",
    topRated: "Top Rated",
    searchPlaceholder: "Search hospitals, specialities, or symptoms...",
    logout: "Logout",
    chatWithUs: "Chat with CityCare Assistant",
    addToCart: "Add",
    checkout: "Checkout",
    placeOrder: "Place Order",
    payNow: "Pay Now",
    rateVisit: "Rate this visit",
    alternateSlots: "See alternate slots",
  },
  ta: {
    appName: "சிட்டிகேர்",
    tagline: "மருத்துவமனைகள் & மருந்தகங்கள், புதிய முறையில்.",
    findHospital: "மருத்துவமனை தேடு",
    pharmacy: "மருந்தகம்",
    myAppointments: "எனது சந்திப்புகள்",
    profile: "சுயவிவரம்",
    dashboard: "டாஷ்போர்டு",
    emergency: "அவசர SOS",
    bookNow: "இப்போது முன்பதிவு செய்யவும்",
    nearMe: "அருகில்",
    topRated: "சிறந்த மதிப்பீடு",
    searchPlaceholder: "மருத்துவமனைகள், சிறப்புகள் தேடவும்...",
    logout: "வெளியேறு",
    chatWithUs: "சிட்டிகேர் உதவியாளருடன் பேசவும்",
    addToCart: "சேர்",
    checkout: "செக்அவுட்",
    placeOrder: "ஆர்டர் செய்யவும்",
    payNow: "இப்போது செலுத்து",
    rateVisit: "இந்த வருகையை மதிப்பிடவும்",
    alternateSlots: "மாற்று நேரங்களைக் காண்க",
  },
  hi: {
    appName: "सिटीकेयर",
    tagline: "अस्पताल और फार्मेसी, एक नए अंदाज़ में.",
    findHospital: "अस्पताल खोजें",
    pharmacy: "फार्मेसी",
    myAppointments: "मेरी नियुक्तियाँ",
    profile: "प्रोफ़ाइल",
    dashboard: "डैशबोर्ड",
    emergency: "आपातकालीन SOS",
    bookNow: "अभी बुक करें",
    nearMe: "मेरे नज़दीक",
    topRated: "सर्वोच्च रेटेड",
    searchPlaceholder: "अस्पताल, विशेषज्ञता खोजें...",
    logout: "लॉग आउट",
    chatWithUs: "सिटीकेयर सहायक से बात करें",
    addToCart: "जोड़ें",
    checkout: "चेकआउट",
    placeOrder: "ऑर्डर करें",
    payNow: "अभी भुगतान करें",
    rateVisit: "इस विज़िट को रेट करें",
    alternateSlots: "वैकल्पिक स्लॉट देखें",
  },
};

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("citycare_lang") : null;
    if (saved && DICT[saved]) setLang(saved);
  }, []);

  function changeLang(code) {
    setLang(code);
    if (typeof window !== "undefined") localStorage.setItem("citycare_lang", code);
  }

  function t(key) {
    return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
  }

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
