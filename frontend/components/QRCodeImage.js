export default function QRCodeImage({ data, size = 180, label }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Patient QR code"
        width={size}
        height={size}
        className="rounded-lg border border-slate-200 bg-white p-2"
      />
      {label && <p className="text-xs text-slate-400">{label}</p>}
    </div>
  );
}
