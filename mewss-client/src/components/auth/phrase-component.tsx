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
    <section className="hidden md:flex w-full bg-primary relative flex-row justify-center items-center overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

      <blockquote className="mb-6">
        <h2 className="font-headline italic text-[30px] text-[#E8F0E9] leading-tight">
          {phrase}
        </h2>
      </blockquote>

      <div className="absolute top-12 right-12 w-48 h-48 opacity-15">
        <img
          className="w-full h-full object-cover grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCliycYur7ErZWdFZjAw-m4EOUD_4hp3l8xTf0hqrsdMjppnRhZDGopLJENrzzXmLJYWklnZ9F4r2lwe9sckRRLsJFOSH4uA37jI9SH_giKDKrL40EYDPjNu7dgGlSHQKWVPpeSPHuZ-7Flqyt1k-J7Gt6_UDBdXUZUQpxepdE6hZpZEkvNIlEFR0DyYExmRr4wet0zzHd1m4DkdglQwcItjGg8Mjd96-XI2IgbnhDtijeGTR9ioiZh8ichZZfrkSVwzs_5ETFBElvC"
          alt="Texture 2"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
  )

}
