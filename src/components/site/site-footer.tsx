export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 md:px-10">
        <p>Serein Blog. Built for portfolio, notes, and AI engineering experiments.</p>
        <p>{new Date().getFullYear()} © Jiang Fan</p>
      </div>
    </footer>
  );
}
