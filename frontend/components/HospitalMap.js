export default function HospitalMap({ latitude, longitude, height = 220 }) {
  if (!latitude || !longitude) return null;
  const d = 0.01;
  const bbox = `${longitude - d}%2C${latitude - d}%2C${longitude + d}%2C${latitude + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" style={{ height }}>
      <iframe
        title="GPS location"
        src={src}
        style={{ width: "100%", height: "100%", border: 0 }}
        loading="lazy"
      />
    </div>
  );
}
