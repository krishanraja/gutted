import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <Image 
        src="/icon.png" 
        alt="gutted." 
        width={64} 
        height={64} 
        className="mb-8 opacity-50"
      />
      <h1 className="text-6xl font-bold text-white/20 mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page not found</h2>
      <p className="text-white/50 text-center mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button>Go home</Button>
      </Link>
    </div>
  )
}
