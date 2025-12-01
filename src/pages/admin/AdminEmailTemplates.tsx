import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import DOMPurify from "dompurify";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  content: string;
  description: string | null;
  available_variables: string[] | null;
  created_at: string;
  updated_at: string;
}

export default function AdminEmailTemplates() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, subject, content }: { id: string; subject: string; content: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({ subject, content })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template updated successfully");
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast.error("Failed to update template: " + error.message);
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditContent(template.content);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: editingTemplate.id,
        subject: editSubject,
        content: editContent,
      });
    } finally {
      setSaving(false);
    }
  };

  // Sanitize HTML before rendering to prevent XSS
  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
    });
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Templates</h1>
        <p className="text-muted-foreground">
          Manage automated email templates sent to users
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Email content is sanitized for security. Only safe HTML tags are allowed in previews and emails.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <CardTitle className="text-lg">{template.template_key}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {template.available_variables?.length || 0} variables
                    </Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}
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
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Email Template: {template.template_key}</DialogTitle>
                      <DialogDescription>
                        Customize the subject and content of this email template
                      </DialogDescription>
                    </DialogHeader>

                    {editingTemplate?.id === template.id && (
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="edit" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                              id="subject"
                              value={editSubject}
                              onChange={(e) => setEditSubject(e.target.value)}
                              maxLength={200}
                              placeholder="Email subject line"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="content">Content (HTML)</Label>
                            <Textarea
                              id="content"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[300px] font-mono text-sm"
                              placeholder="Email HTML content"
                            />
                          </div>

                          {template.available_variables && template.available_variables.length > 0 && (
                            <div className="rounded-lg border p-3 bg-muted/50">
                              <div className="text-sm font-medium mb-2">Available Variables:</div>
                              <div className="flex flex-wrap gap-2">
                                {template.available_variables.map((variable: string) => (
                                  <Badge key={variable} variant="secondary" className="text-xs">
                                    {`{{${variable}}}`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingTemplate(null)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
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
                              {/* SECURITY FIX: Sanitize HTML before rendering */}
                              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(editContent) }} />
                            </div>
                          </div>
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Preview shows sanitized HTML. Variables will be replaced with actual values when the email is sent.
                              For security, only safe HTML tags are allowed.
                            </AlertDescription>
                          </Alert>
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
                  <div className="text-sm font-medium mb-1">Last Updated:</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(template.updated_at).toLocaleDateString()}
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
