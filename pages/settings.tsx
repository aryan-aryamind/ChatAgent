import { useRouter } from 'next/router'
import { Sidebar } from '@/app/components/dashboard/sidebar'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Switch } from '@/app/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'

export default function SettingsPage() {
  const router = useRouter()

  const handleNavigate = (page: string) => {
    if (page === 'dashboard') {
      router.push('/dashboard')
    } else if (page === 'profile') {
      router.push('/profile')
    } else if (page === 'agents') {
      router.push('/agents')
    } else {
      router.push(`/${page}`)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage="settings" 
        onNavigate={handleNavigate} 
      />
      
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="p-8">
          <PageHeader
            title="Workspace Settings"
            description="Manage your workspace configuration and preferences"
          />

          <div className="mt-8 space-y-6">
            {/* General Settings */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    defaultValue="My Workspace"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger className="mt-2">
                      <SelectValue>UTC</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">EST</SelectItem>
                      <SelectItem value="pst">PST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your agents</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Agent Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when agents need attention</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* API Settings */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    defaultValue="https://api.chatbase.co"
                    className="mt-2"
                    disabled
                  />
                </div>
                <Button variant="outline">Regenerate API Keys</Button>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
