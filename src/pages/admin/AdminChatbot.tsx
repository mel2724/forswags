import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, MessageSquare, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminChatbot() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    coach_name: 'Coach Ray',
    system_prompt: '',
    knowledge_base: '',
    sports_nicknames: [] as string[]
  });
  const [nicknamesInput, setNicknamesInput] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_config')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          coach_name: data.coach_name,
          system_prompt: data.system_prompt,
          knowledge_base: data.knowledge_base,
          sports_nicknames: data.sports_nicknames || []
        });
        setNicknamesInput(data.sports_nicknames?.join(', ') || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load chatbot configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const nicknames = nicknamesInput.split(',').map(n => n.trim()).filter(n => n);
      
      const { error } = await supabase
        .from('chatbot_config')
        .update({
          coach_name: config.coach_name,
          system_prompt: config.system_prompt,
          knowledge_base: config.knowledge_base,
          sports_nicknames: nicknames,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('chatbot_config').select('id').single()).data?.id);

      if (error) throw error;

      toast.success('Chatbot configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save chatbot configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          AI Chatbot Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure and train your AI assistant to better serve your users
        </p>
      </div>

      <Tabs defaultValue="personality" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personality">Personality & Voice</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="personality">
          <Card>
            <CardHeader>
              <CardTitle>Coach Personality</CardTitle>
              <CardDescription>
                Define how the chatbot introduces itself and interacts with users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coach_name">Coach Name</Label>
                <Input
                  id="coach_name"
                  value={config.coach_name}
                  onChange={(e) => setConfig({ ...config, coach_name: e.target.value })}
                  placeholder="e.g., Coach Ray"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt (Personality)</Label>
                <Textarea
                  id="system_prompt"
                  value={config.system_prompt}
                  onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                  placeholder="Define the chatbot's personality, tone, and behavior..."
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  This defines how the AI assistant behaves, its tone, and personality traits
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nicknames">Sports Nicknames (comma-separated)</Label>
                <Input
                  id="nicknames"
                  value={nicknamesInput}
                  onChange={(e) => setNicknamesInput(e.target.value)}
                  placeholder="e.g., Champ, MVP, All-Star, Rookie, Captain"
                />
                <p className="text-sm text-muted-foreground">
                  The chatbot will randomly assign one of these nicknames to each user
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Train the chatbot with information about your platform and services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="knowledge_base">Knowledge Base Content</Label>
                <Textarea
                  id="knowledge_base"
                  value={config.knowledge_base}
                  onChange={(e) => setConfig({ ...config, knowledge_base: e.target.value })}
                  placeholder="Add information about your services, features, pricing, etc..."
                  className="min-h-[300px]"
                />
                <p className="text-sm text-muted-foreground">
                  Include details about your platform features, membership tiers, services, and any other information the chatbot should know to answer user questions accurately
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={saveConfig} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}