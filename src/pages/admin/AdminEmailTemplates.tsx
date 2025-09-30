import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Mail, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  content: string;
  description: string | null;
  available_variables: string[];
}

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("template_key");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
      console.error("Error loading templates:", error);
    } else {
      const typedData = data?.map(template => ({
        ...template,
        available_variables: Array.isArray(template.available_variables) 
          ? template.available_variables as string[]
          : [],
      })) || [];
      setTemplates(typedData);
      if (typedData.length > 0 && !selectedTemplate) {
        selectTemplate(typedData[0]);
      }
    }
    setLoading(false);
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedContent(template.content);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: editedSubject,
        content: editedContent,
      })
      .eq("id", selectedTemplate.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
      console.error("Error saving template:", error);
    } else {
      toast({
        title: "Success",
        description: "Template saved successfully",
      });
      loadTemplates();
    }
    setSaving(false);
  };

  const previewTemplate = () => {
    if (!selectedTemplate) return;

    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      const previewContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${editedSubject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              background-color: #0F1117;
              color: #F1F1F1;
              margin: 0;
              padding: 40px 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #1A1F2E;
              border-radius: 8px;
              padding: 32px;
              border: 1px solid #2D3748;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${editedContent}
          </div>
        </body>
        </html>
      `;
      previewWindow.document.write(previewContent);
      previewWindow.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage automated email notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>{templates.length} email templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                className="w-full justify-start text-left"
                onClick={() => selectTemplate(template)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-semibold text-sm">{template.template_key}</span>
                  {template.description && (
                    <span className="text-xs opacity-70">{template.description}</span>
                  )}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Template Editor */}
        {selectedTemplate && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTemplate.template_key}</CardTitle>
                  <CardDescription>{selectedTemplate.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={previewTemplate}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="Email subject"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">HTML Content</Label>
                    <Textarea
                      id="content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Email HTML content"
                      className="mt-2 font-mono text-sm min-h-[400px]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use {`{{variable_name}}`} to insert dynamic content
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Available Variables</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use these variables in your template with double curly braces:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.available_variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">Example Usage:</h4>
                      <code className="text-xs">
                        {`<p>Hello {{first_name}}, welcome!</p>`}
                      </code>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
