import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration_minutes: number | null;
    is_published: boolean;
  };
  userProgress?: number;
  isEnrolled?: boolean;
}

export const CourseCard = ({ course, userProgress = 0, isEnrolled = false }: CourseCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20 hover:border-primary transition-all group">
      <CardHeader className="pb-3">
        {course.thumbnail_url && (
          <div className="w-full h-40 rounded-lg overflow-hidden mb-3 bg-muted">
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="uppercase tracking-tight line-clamp-2">
            {course.title}
          </CardTitle>
          {isEnrolled && (
            <Badge variant="secondary" className="flex-shrink-0">
              Enrolled
            </Badge>
          )}
        </div>
        {course.description && (
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>Course</span>
          </div>
        </div>

        {isEnrolled && userProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{userProgress}%</span>
            </div>
            <Progress value={userProgress} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => navigate(`/courses/${course.id}`)}
          className="w-full"
          variant={isEnrolled ? "default" : "outline"}
        >
          {isEnrolled ? (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Continue Learning
            </>
          ) : (
            <>
              View Course
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
