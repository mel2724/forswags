import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Video, BarChart3, Library } from "lucide-react";

// Import existing admin components
import AdminCourses from "./AdminCourses";
import AdminPlaybookVideos from "./AdminPlaybookVideos";
import AdminPlaybookDashboard from "./AdminPlaybookDashboard";

export default function AdminLearning() {
  const [activeTab, setActiveTab] = useState("courses");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Learning Management</h1>
        <p className="text-muted-foreground">
          Manage all learning content, courses, and videos from one place
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="courses" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Course Management
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Playbook Videos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Course Management Tab */}
        <TabsContent value="courses" className="mt-6">
          <AdminCourses />
        </TabsContent>

        {/* Playbook Videos Tab */}
        <TabsContent value="videos" className="mt-6">
          <AdminPlaybookVideos />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <AdminPlaybookDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
