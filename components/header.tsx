import Image from "next/image"

export function Header() {
  return (
    <header className="border-b bg-gradient-to-r from-[#8B1538] to-[#C41E3A] text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Image
            src="/images/escudo-unipamplona.png"
            alt="Escudo Universidad de Pamplona"
            width={80}
            height={80}
            className="h-16 w-auto md:h-20"
          />
          <div>
            <h1 className="text-xl font-bold leading-tight md:text-2xl lg:text-3xl">Sistema de Monitoreo Ambiental</h1>
            <p className="text-sm text-white/90 md:text-base">Universidad de Pamplona</p>
          </div>
        </div>
      </div>
    </header>
  )
}
