export const inputClass =
  "w-full rounded-lg border border-gold/30 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20";
export const buttonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:opacity-60";

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gold/20 bg-white/80 p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-wine">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
