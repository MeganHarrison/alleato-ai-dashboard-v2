import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Settings" description="Manage your application settings" />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" defaultValue="Next Level AI Dashboard" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="UTC" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" defaultChecked />
                <Label htmlFor="dark-mode">Enable Dark Mode</Label>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>Configure your Supabase database connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase URL</Label>
                <Input id="supabase-url" defaultValue="https://your-project.supabase.co" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabase-key">Supabase API Key</Label>
                <Input id="supabase-key" type="password" defaultValue="••••••••••••••••" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-sync" defaultChecked />
                <Label htmlFor="auto-sync">Auto-sync database changes</Label>
              </div>
              <Button>Test Connection</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Settings</CardTitle>
              <CardDescription>Configure your AI assistant settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input id="openai-key" type="password" defaultValue="••••••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <Input id="ai-model" defaultValue="gpt-4o" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="ai-enabled" defaultChecked />
                <Label htmlFor="ai-enabled">Enable AI Assistant</Label>
              </div>
              <Button>Save AI Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
