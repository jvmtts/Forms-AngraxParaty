import { ArrowDown, CalendarDays, MapPin, Waves } from 'lucide-react'
import { ExpeditionForm } from './components/ExpeditionForm'

function App() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071d26] text-white">
      <section className="relative isolate min-h-[620px] overflow-hidden lg:min-h-[760px]">
        <img
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          src="/images/angra.webp"
          alt="Jet ski navegando pelas águas de Angra dos Reis"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,22,30,0.97)_0%,rgba(4,22,30,0.76)_52%,rgba(4,22,30,0.2)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(3,17,24,0.94)_0%,transparent_50%)]" />

        <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-7 sm:px-10 lg:px-16 lg:py-9">
          <img
            className="h-16 w-auto brightness-0 invert sm:h-20 lg:h-24"
            src="/images/usina-logo.png"
            alt="Usina do Jet"
          />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-white/75 sm:text-xs">
            Expedição náutica
          </span>
        </header>

        <div className="mx-auto flex min-h-[500px] w-full max-w-[1440px] items-end px-6 pb-12 sm:px-10 lg:min-h-[610px] lg:px-16 lg:pb-16">
          <div className="w-full max-w-[1180px]">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md">
              <Waves aria-hidden="true" className="h-4 w-4 text-cyan-300" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
                Mar, estrada e experiência
              </span>
            </div>

            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.28em] text-cyan-300 sm:text-sm">
              Usina do Jet apresenta
            </p>
            <h1 className="font-display text-[clamp(3.25rem,8vw,8.6rem)] font-black uppercase leading-[0.84] tracking-[-0.065em]">
              <span className="block sm:inline">Angra</span>
              <span className="mr-[0.08em] text-lime-300 sm:ml-[0.08em]">×</span>
              <span>Paraty</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Preencha sua inscrição com calma. Antes do envio, você poderá revisar
              todos os dados e documentos da expedição.
            </p>

            <div className="mt-8 flex flex-col gap-5 border-t border-white/15 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
              <div className="flex items-center gap-3">
                <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-cyan-300" />
                <span className="text-sm font-semibold">Nova data em confirmação</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="h-5 w-5 shrink-0 text-cyan-300" />
                <span className="text-sm font-semibold">Angra dos Reis → Paraty</span>
              </div>
              <a
                className="inline-flex items-center justify-center gap-3 bg-cyan-300 px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#071d26] transition hover:bg-lime-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:ml-auto"
                href="#inscricao"
              >
                Começar inscrição
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <ExpeditionForm />
    </main>
  )
}

export default App
