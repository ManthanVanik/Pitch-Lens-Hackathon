
'use client';

import { useState } from 'react';
import type { BusinessModel as BusinessModelType } from '@/lib/types';
import { businessModelVisualization } from '@/ai/flows/business-model-visualization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Layers, TrendingUp, Lightbulb, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function BusinessModel({ data, dealId }: { data: BusinessModelType, dealId: string }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await businessModelVisualization({ fileId: dealId });
      setInsight(result.insights);
    } catch (e) {
      setError('Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><DollarSign className="w-7 h-7 text-primary"/>Revenue Model</CardTitle>
          <CardDescription>{data.revenue_streams}</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-headline text-xl mb-4">Pricing Strategy</h3>
          <p className="text-sm text-muted-foreground">{data.pricing}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><Layers className="w-7 h-7 text-primary"/>Scalability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{data.scalability}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><Lightbulb className="w-7 h-7 text-accent"/>AI-Powered Visualization Insights</CardTitle>
          <CardDescription>
            Generate AI insights on revenue streams, pricing, and scalability based on the uploaded document.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!insight && !isLoading && (
            <Button onClick={handleGenerateInsights} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              Generate Insights
            </Button>
          )}
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating AI insights...</span>
            </div>
          )}
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {insight && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle className="font-headline">AI Insight</AlertTitle>
              <AlertDescription>
                {insight}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
