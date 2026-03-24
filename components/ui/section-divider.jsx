export function SectionDivider() {
  return (
    <div className="w-full flex justify-center py-0">
      <div
        className="h-px w-full max-w-6xl mx-auto"
        style={{
          background: "linear-gradient(90deg, transparent, #eab877, transparent)",
          boxShadow: "0 0 12px 2px rgba(234, 184, 119, 0.5)",
        }}
        aria-hidden
      />
    </div>
  );
}
