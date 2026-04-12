import { useState } from "react";

const phrases = [
  "Read like it's 2005",
  "Before the scroll took over",
  "Like the early internet, but better",
  "Back when reading was the point",
  "Read like it used to be",
]

export function PhraseComponent() {
  const [phrase] = useState(() =>
    phrases[Math.floor(Math.random() * phrases.length)]
  );

  return (
    <section className="hidden md:flex w-full bg-panel-brand relative flex-row justify-center items-center overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

      <blockquote className="mb-6">
        <h2 className="font-headline italic text-[30px] text-[#E8F0E9] leading-tight">
          {phrase}
        </h2>
      </blockquote>
    </section>
  )

}
