import { useRouter } from 'next/router'
import { Signup } from '@/app/components/auth/signup'

export default function SignupPage() {
  const router = useRouter()

  return (
    <Signup
      onNavigateToLogin={() => router.push('/login')}
    />
  )
}
