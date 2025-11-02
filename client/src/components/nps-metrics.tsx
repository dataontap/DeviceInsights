import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, TrendingUp, Users, ThumbsUp } from "lucide-react";

interface NpsStats {
  totalResponses: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
}

interface NpsResponse {
  id: number;
  rating: number;
  feedback: string | null;
  searchId: number | null;
  createdAt: string;
}

export default function NpsMetrics() {
  const { data: stats, isLoading: statsLoading } = useQuery<NpsStats>({
    queryKey: ['/api/admin/nps/stats'],
  });

  const { data: responses, isLoading: responsesLoading } = useQuery<NpsResponse[]>({
    queryKey: ['/api/admin/nps/responses'],
  });

  const getNpsCategory = (rating: number): { label: string; color: string } => {
    if (rating >= 9) return { label: 'Promoter', color: 'bg-green-100 text-green-800' };
    if (rating >= 7) return { label: 'Passive', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Detractor', color: 'bg-red-100 text-red-800' };
  };

  const getNpsScoreColor = (score: number): string => {
    if (score >= 50) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNpsScoreLabel = (score: number): string => {
    if (score >= 70) return 'Excellent';
    if (score >= 50) return 'Great';
    if (score >= 30) return 'Good';
    if (score >= 0) return 'Needs Improvement';
    return 'Critical';
  };

  if (statsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats || stats.totalResponses === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
            User Feedback (NPS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No feedback responses yet</p>
            <p className="text-sm mt-2">NPS widget will appear for users after successful IMEI searches</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
        User Feedback & Satisfaction
      </h3>

      {/* NPS Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPS Score</p>
                <p className={`text-3xl font-bold ${getNpsScoreColor(stats.npsScore)}`}>
                  {stats.npsScore}
                </p>
                <p className="text-xs text-gray-500 mt-1">{getNpsScoreLabel(stats.npsScore)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalResponses}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promoters</p>
                <p className="text-3xl font-bold text-green-600">{stats.promoters}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.promoterPercentage}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ThumbsUp className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Detractors</p>
                <p className="text-3xl font-bold text-red-600">{stats.detractors}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.detractorPercentage}%</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="text-red-600 w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution and Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Promoters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Promoters (9-10)</span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats.promoters} ({stats.promoterPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats.promoterPercentage}%` }}
                  />
                </div>
              </div>

              {/* Passives */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Passives (7-8)</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {stats.passives} ({stats.passivePercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats.passivePercentage}%` }}
                  />
                </div>
              </div>

              {/* Detractors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Detractors (0-6)</span>
                  <span className="text-sm font-semibold text-red-600">
                    {stats.detractors} ({stats.detractorPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats.detractorPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  NPS Score = (% Promoters - % Detractors) × 100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {responsesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : responses && responses.length > 0 ? (
                responses.slice(0, 10).map((response) => {
                  const category = getNpsCategory(response.rating);
                  return (
                    <div
                      key={response.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      data-testid={`nps-response-${response.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={category.color}>{category.label}</Badge>
                        <span className="text-2xl font-bold text-gray-900">{response.rating}</span>
                      </div>
                      {response.feedback && (
                        <p className="text-sm text-gray-700 mt-2 italic">"{response.feedback}"</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(response.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No feedback responses yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
