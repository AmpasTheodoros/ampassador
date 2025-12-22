import { SignOutButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Sign Out</h1>
      <p className="text-muted-foreground">Are you sure you want to sign out?</p>
      <SignOutButton>
        <Button variant="destructive" size="lg">
          Sign Out
        </Button>
      </SignOutButton>
    </div>
  )
}

