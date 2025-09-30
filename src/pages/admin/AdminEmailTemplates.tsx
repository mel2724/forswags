import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Edit, Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  content: string;
  description: string | null;
  available_variables: string[];
  created_at: string;
  updated_at: string;
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");

      if (error) throw error;
      const templatesData = (data || []).map(t => ({
        ...t,
        available_variables: Array.isArray(t.available_variables) 
          ? t.available_variables as string[]
          : []
      }));
      setTemplates(templatesData as EmailTemplate[]);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditContent(template.content);
    setEditDescription(template.description || "");
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: editSubject,
          content: editContent,
          description: editDescription,
        })
        .eq("id", editingTemplate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email template updated successfully",
      });

      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setEditSubject("");
    setEditContent("");
    setEditDescription("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage automated email notifications sent to users
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.template_key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Email Template</DialogTitle>
                      <DialogDescription>
                        Customize the subject, content, and description for this email template
                      </DialogDescription>
                    </DialogHeader>

                    {editingTemplate && (
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="When is this email sent?"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject Line</Label>
                            <Input
                              id="subject"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              placeholder="Email subject"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="content">Email Content (HTML)</Label>
                            <Textarea
                              id="content"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="Email HTML content"
                              rows={15}
                              className="font-mono text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Available Variables</Label>
                            <div className="flex flex-wrap gap-2">
                              {editingTemplate.available_variables.map((variable) => (
                                <Badge key={variable} variant="secondary">
                                  {`{{${variable}}}`}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Use these variables in your template by wrapping them in double curly braces
                            </p>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={handleCancel}
                              disabled={saving}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="preview" className="space-y-4">
                          <div className="rounded-lg border p-4 bg-muted/50">
                            <div className="space-y-2 mb-4">
                              <div className="text-sm text-muted-foreground">Subject:</div>
                              <div className="font-semibold">{editSubject}</div>
                            </div>
                            <div className="rounded border bg-background p-6">
                              <div dangerouslySetInnerHTML={{ __html: editContent }} />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Note: Variables will be replaced with actual values when the email is sent
                          </p>
                        </TabsContent>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Subject:</div>
                  <div className="text-sm text-muted-foreground">{template.subject}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Available Variables:</div>
                  <div className="flex flex-wrap gap-2">
                    {template.available_variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
