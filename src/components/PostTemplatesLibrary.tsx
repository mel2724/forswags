import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Copy, Search, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PostTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  content_template: string;
  suggested_hashtags: string[];
  is_public: boolean;
  usage_count: number;
}

interface PostTemplatesLibraryProps {
  onTemplateSelect?: (template: PostTemplate) => void;
}

export const PostTemplatesLibrary = ({ onTemplateSelect }: PostTemplatesLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: templates, isLoading } = useQuery({
    queryKey: ['post-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_templates')
        .select('*')
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data as PostTemplate[];
    },
  });

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || template.template_type === selectedType;
    return matchesSearch && matchesType;
  });

  const templateTypes = [
    { value: 'all', label: 'All Templates' },
    { value: 'offer', label: 'Offers' },
    { value: 'commitment', label: 'Commitments' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'training', label: 'Training' },
    { value: 'gameday', label: 'Game Day' },
    { value: 'recruitment', label: 'Recruitment' },
    { value: 'custom', label: 'Custom' },
  ];

  const handleUseTemplate = (template: PostTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    } else {
      navigator.clipboard.writeText(template.content_template);
      toast.success('Template copied to clipboard!');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'offer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'commitment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'achievement': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'training': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'gameday': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'recruitment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading templates...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Post Templates Library
        </CardTitle>
        <CardDescription>
          Pre-made templates to help you create engaging content quickly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              {templateTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge className={`text-xs ${getTypeColor(template.template_type)}`}>
                              {template.template_type}
                            </Badge>
                            {template.is_public && (
                              <Badge variant="outline" className="text-xs">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                      </div>

                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-mono">{template.content_template}</p>
                      </div>

                      {template.suggested_hashtags && template.suggested_hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {template.suggested_hashtags.map((hashtag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {hashtag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Used {template.usage_count} times</span>
                        {template.content_template.includes('{') && (
                          <span>📝 Fill in the {'{'}brackets{'}'} with your details</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No templates found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};