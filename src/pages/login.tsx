import { useRouter } from 'next/router'
import { Login } from '@/app/components/auth/login'

export default function LoginPage() {
  const router = useRouter()

  return (
    <Login
      onNavigateToSignup={() => router.push('/signup')}
    />
  )
}
