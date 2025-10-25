import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp } from "lucide-react";

interface Recommendation {
  plan_name: string;
  score: number;
  reason: string;
  best_for: string;
}

interface RecommendationCardsProps {
  recommendations: Recommendation[];
}

const RecommendationCards = ({ recommendations }: RecommendationCardsProps) => {
  if (!recommendations || recommendations.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Award className="w-4 h-4 text-secondary" />
        Đề xuất phù hợp
      </h3>
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{rec.plan_name}</span>
                <Badge variant="secondary" className={getScoreColor(rec.score)}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {rec.score}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Lý do:</span> {rec.reason}</p>
              <p><span className="font-medium">Phù hợp cho:</span> {rec.best_for}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default RecommendationCards;