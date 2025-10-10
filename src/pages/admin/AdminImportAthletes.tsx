import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Users, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminImportAthletes() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      
      const { data, error } = await supabase.functions.invoke("import-athletes", {
        body: { csvData: text },
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Import completed",
        description: `Successfully imported ${data.created} athletes, updated ${data.updated}, skipped ${data.skipped} duplicates`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import athletes",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Athletes</h1>
        <p className="text-muted-foreground">
          Bulk import athlete profiles from CSV. Athletes will receive claim emails.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>CSV Format Requirements:</strong>
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>Required: full_name, email, sport, graduation_year</li>
            <li>Optional: position, high_school, gpa, height_in, weight_lb, and any stats</li>
            <li>Athletes with graduation year &lt; current year will be marked as Alumni</li>
            <li>Duplicates (same name + grad year + sport) will be updated, not recreated</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV File
          </CardTitle>
          <CardDescription>
            Select a CSV file containing athlete information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="whitespace-nowrap"
            >
              {importing ? "Importing..." : "Import Athletes"}
            </Button>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name}
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {results.created}
                </div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {results.updated}
                </div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {results.skipped}
                </div>
                <div className="text-sm text-muted-foreground">Duplicates Skipped</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {results.alumni}
                </div>
                <div className="text-sm text-muted-foreground">Alumni</div>
              </div>
            </div>

            {results.emailsSent > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Sent {results.emailsSent} claim invitation emails
                </AlertDescription>
              </Alert>
            )}

            {results.errors && results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="list-disc ml-4 mt-2">
                    {results.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sample CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
{`full_name,email,sport,position,graduation_year,high_school,gpa,height_in,weight_lb
John Smith,john@example.com,Football,Quarterback,2025,Lincoln High,3.8,72,185
Jane Doe,jane@example.com,Basketball,Guard,2024,Washington High,3.9,68,140
Mike Johnson,mike@example.com,Baseball,Pitcher,2020,Jefferson High,3.5,74,190`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}