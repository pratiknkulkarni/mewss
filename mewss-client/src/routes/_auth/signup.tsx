import { createFileRoute } from '@tanstack/react-router'
import { SignupForm } from '../../components/auth/signup-form'
import { PhraseComponent } from '../../components/auth/phrase-component';

export const Route = createFileRoute('/_auth/signup')({
  component: SignUpComponent,
})

function SignUpComponent() {
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

      <PhraseComponent />

    </div>
  )
}
