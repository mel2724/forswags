import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Award, TrendingUp, Target, Zap } from "lucide-react";

interface Criterion {
  id: string;
  name: string;
  description: string;
  category: string;
  max_score: number;
}

interface SkillAssessmentMatrixProps {
  criteria: Criterion[];
  scores: Record<string, number>;
  onScoreChange: (criterionId: string, value: number) => void;
  isReadOnly?: boolean;
  previousScores?: Record<string, number>;
}

export const SkillAssessmentMatrix = ({
  criteria,
  scores,
  onScoreChange,
  isReadOnly = false,
  previousScores
}: SkillAssessmentMatrixProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | undefined>();

  // Group criteria by category
  const groupedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, Criterion[]>);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Technical': Target,
      'Physical': Zap,
      'Mental': Award,
      'Tactical': TrendingUp,
    };
    return icons[category] || Award;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Technical': 'bg-blue-500',
      'Physical': 'bg-green-500',
      'Mental': 'bg-purple-500',
      'Tactical': 'bg-orange-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getCategoryAverage = (categoryName: string) => {
    const categoryCriteria = groupedCriteria[categoryName] || [];
    const categoryScores = categoryCriteria
      .map(c => scores[c.id] || 0)
      .filter(s => s > 0);
    
    if (categoryScores.length === 0) return 0;
    return Math.round(categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length);
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreImprovement = (criterionId: string) => {
    if (!previousScores || !previousScores[criterionId]) return null;
    const current = scores[criterionId] || 0;
    const previous = previousScores[criterionId];
    const diff = current - previous;
    return diff;
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxTotalScore = criteria.reduce((a, c) => a + c.max_score, 0);
  const overallPercentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Skill Assessment Matrix
        </CardTitle>
        <CardDescription>
          Comprehensive evaluation across all performance categories
        </CardDescription>
        
        {/* Overall Score */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(totalScore, maxTotalScore)}`}>
              {totalScore}/{maxTotalScore}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full ${getCategoryColor('Technical')} transition-all duration-500`}
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{overallPercentage}% Performance Level</p>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion 
          type="single" 
          collapsible 
          value={expandedCategory}
          onValueChange={setExpandedCategory}
          className="space-y-4"
        >
          {Object.entries(groupedCriteria).map(([category, categoryCriteria]) => {
            const Icon = getCategoryIcon(category);
            const avgScore = getCategoryAverage(category);
            const maxCategoryScore = categoryCriteria.reduce((a, c) => a + c.max_score, 0);
            const categoryTotal = categoryCriteria.reduce((a, c) => a + (scores[c.id] || 0), 0);
            
            return (
              <AccordionItem key={category} value={category}>
                <Card>
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(category)} bg-opacity-10`}>
                          <Icon className={`h-5 w-5 ${getCategoryColor(category)} text-opacity-100`} />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">{category}</h3>
                          <p className="text-xs text-muted-foreground">
                            {categoryCriteria.length} criteria
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="text-lg px-3">
                          {categoryTotal}/{maxCategoryScore}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent>
                    <CardContent className="space-y-6 pt-4">
                      {categoryCriteria.map((criterion) => {
                        const improvement = getScoreImprovement(criterion.id);
                        const currentScore = scores[criterion.id] || 0;
                        
                        return (
                          <div key={criterion.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <Label className="font-medium text-base">{criterion.name}</Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {criterion.description}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <span className={`text-2xl font-bold ${getScoreColor(currentScore, criterion.max_score)}`}>
                                  {currentScore}
                                </span>
                                <span className="text-muted-foreground">/{criterion.max_score}</span>
                                {improvement !== null && (
                                  <div className="flex items-center gap-1 justify-end mt-1">
                                    <TrendingUp className={`h-3 w-3 ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'}`} />
                                    <span className={`text-xs font-medium ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                      {improvement > 0 ? '+' : ''}{improvement}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {!isReadOnly ? (
                              <>
                                <Slider
                                  value={[currentScore]}
                                  onValueChange={([value]) => onScoreChange(criterion.id, value)}
                                  max={criterion.max_score}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Poor</span>
                                  <span>Average</span>
                                  <span>Excellent</span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full ${getCategoryColor(category)} transition-all`}
                                  style={{ width: `${(currentScore / criterion.max_score) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};