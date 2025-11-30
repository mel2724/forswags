import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Award } from "lucide-react";

interface EvaluationData {
  id: string;
  completed_at: string;
  scores: Record<string, number>;
  feedback: string | null;
  coach_id: string | null;
}

interface Criterion {
  id: string;
  name: string;
  category: string;
  max_score: number;
}

interface EvaluationProgressChartProps {
  evaluations: EvaluationData[];
  criteria: Criterion[];
}

export const EvaluationProgressChart = ({ evaluations, criteria }: EvaluationProgressChartProps) => {
  // Sort evaluations by date
  const sortedEvaluations = [...evaluations].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  );

  // Prepare data for line chart (overall scores over time)
  const overallProgressData = sortedEvaluations.map((evaluation, index) => {
    const totalScore = Object.values(evaluation.scores).reduce((a, b) => a + b, 0);
    const maxScore = criteria.reduce((a, c) => a + c.max_score, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    return {
      name: `Eval ${index + 1}`,
      date: new Date(evaluation.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: percentage,
      total: totalScore,
    };
  });

  // Prepare data for radar chart (latest evaluation by category)
  const latestEvaluation = sortedEvaluations[sortedEvaluations.length - 1];
  const previousEvaluation = sortedEvaluations.length > 1 ? sortedEvaluations[sortedEvaluations.length - 2] : null;

  // Group criteria by category
  const categories = [...new Set(criteria.map(c => c.category))];
  
  const radarData = categories.map(category => {
    const categoryCriteria = criteria.filter(c => c.category === category);
    const currentScores = categoryCriteria.map(c => latestEvaluation?.scores[c.id] || 0);
    const previousScores = previousEvaluation ? categoryCriteria.map(c => previousEvaluation.scores[c.id] || 0) : [];
    
    const currentAvg = currentScores.length > 0 ? Math.round(currentScores.reduce((a, b) => a + b, 0) / currentScores.length) : 0;
    const previousAvg = previousScores.length > 0 ? Math.round(previousScores.reduce((a, b) => a + b, 0) / previousScores.length) : 0;
    
    return {
      category,
      current: currentAvg,
      previous: previousAvg,
    };
  });

  // Calculate overall improvement
  const calculateImprovement = () => {
    if (sortedEvaluations.length < 2) return null;
    
    const latest = sortedEvaluations[sortedEvaluations.length - 1];
    const previous = sortedEvaluations[sortedEvaluations.length - 2];
    
    const latestTotal = Object.values(latest.scores).reduce((a, b) => a + b, 0);
    const previousTotal = Object.values(previous.scores).reduce((a, b) => a + b, 0);
    
    const maxScore = criteria.reduce((a, c) => a + c.max_score, 0);
    const latestPercentage = maxScore > 0 ? (latestTotal / maxScore) * 100 : 0;
    const previousPercentage = maxScore > 0 ? (previousTotal / maxScore) * 100 : 0;
    
    return latestPercentage - previousPercentage;
  };

  const improvement = calculateImprovement();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Total Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{evaluations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {new Date(sortedEvaluations[0]?.completed_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              Latest Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overallProgressData[overallProgressData.length - 1]?.score}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Performance Level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {improvement !== null && improvement >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {improvement !== null ? (
              <>
                <div className={`text-3xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Since last evaluation
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Need 2+ evaluations to track progress
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>
            Track your overall performance improvements across evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overallProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.name}</p>
                        <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
                        <p className="text-lg font-bold text-primary">{payload[0].value}%</p>
                        <p className="text-xs text-muted-foreground">
                          Total: {payload[0].payload.total} points
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                activeDot={{ r: 8 }}
                name="Performance Score (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown Radar Chart */}
      {previousEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Category Comparison</CardTitle>
            <CardDescription>
              Latest vs previous evaluation across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis domain={[0, 10]} />
                <Radar 
                  name="Previous" 
                  dataKey="previous" 
                  stroke="hsl(var(--muted-foreground))" 
                  fill="hsl(var(--muted))" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Current" 
                  dataKey="current" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6} 
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category Improvements */}
      {previousEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Category Improvements</CardTitle>
            <CardDescription>
              Detailed breakdown of progress in each category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {radarData.map((item) => {
                const diff = item.current - item.previous;
                const isImproved = diff > 0;
                const isDeclined = diff < 0;
                
                return (
                  <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.category}</span>
                      {isImproved && (
                        <Badge className="bg-green-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{diff.toFixed(1)}
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge variant="destructive">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {diff.toFixed(1)}
                        </Badge>
                      )}
                      {!isImproved && !isDeclined && (
                        <Badge variant="secondary">No change</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.previous} → <span className="font-bold text-foreground">{item.current}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};