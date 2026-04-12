import { createFileRoute } from '@tanstack/react-router'
import { SignupForm } from '../../components/auth/signup-form'
import { useState } from 'react';

export const Route = createFileRoute('/_auth/signup')({
  component: SignUpComponent,
})

const phrases = [
  "Read like it's 2005",
  "Before the scroll took over",
  "Like the early internet, but better",
  "Back when reading was the point",
  "Read like it used to be",
]

function SignUpComponent() {
  const [phrase] = useState(() =>
    phrases[Math.floor(Math.random() * phrases.length)]
  );

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <span className="font-medium">MEWSS</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
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

      {/* <div className="flex items-center justify-center bg-muted"> */}
      {/*   <h1 className="text-lg text-muted-foreground"> */}
      {/*     Add something cool here */}
      {/*   </h1> */}
      {/* </div> */}
    </div>
  )
}
