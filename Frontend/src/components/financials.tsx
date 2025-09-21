
'use client';

import { useState } from 'react';
import type { Financials as FinancialsType, ClaimsAnalysis as ClaimsAnalysisType } from '@/lib/types';
import { generateFinancialMetricsDashboard } from '@/ai/flows/financial-metrics-dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart2, Briefcase, Calendar, Target, HelpCircle, GitBranch, PiggyBank, Sparkles, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MetricCard = ({ title, value, icon, tooltip }: { title: string, value?: string, icon: React.ReactNode, tooltip?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {tooltip ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="cursor-help">{icon}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      ) : (
        icon
      )}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold font-headline">{value || 'N/A'}</div>
    </CardContent>
  </Card>
);

export default function Financials({ data, claims }: { data: FinancialsType, claims: ClaimsAnalysisType }) {
  const [suggestions, setSuggestions] = useState<string[] | undefined | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateFinancialMetricsDashboard({ analysisText: JSON.stringify(data) + JSON.stringify(claims) });
      setSuggestions(result.followUpSuggestions);
    } catch (e) {
      setError('Failed to generate suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-2xl mb-4">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="ARR" value={data.arr_mrr.current_booked_arr} icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />} />
          <MetricCard title="MRR" value={data.arr_mrr.current_mrr} icon={<Calendar className="h-4 w-4 text-muted-foreground" />} />
          <MetricCard title="Est. Burn Rate" value={data.burn_and_runway.implied_net_burn} icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />} tooltip="Estimated by dividing funding ask by runway" />
          <MetricCard title="Runway" value={data.burn_and_runway.stated_runway} icon={<GitBranch className="h-4 w-4 text-muted-foreground" />} />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><PiggyBank className="w-7 h-7 text-primary"/>Funding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-semibold">Current Ask</h4>
            <p className="text-xl font-bold font-headline text-primary">{data.burn_and_runway.funding_ask}</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">Valuation Rationale</h4>
            <p className="text-sm text-muted-foreground">{data.valuation_rationale}</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold">Previous Funding</h4>
            <p className="text-sm text-muted-foreground">{data.funding_history}</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3"><BarChart2 className="w-7 h-7 text-primary"/>Financial Projections</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
            {data.projections.map((projection) => (
              <li key={projection.year} className="flex justify-between items-center p-2 rounded-md hover:bg-secondary/50">
                <span className="font-medium">{projection.year}</span>
                <span className="font-bold text-lg font-headline text-primary">{projection.revenue}</span>
              </li>
            ))}
            </ul>
          </CardContent>
        </Card>

        {claims.map((claim, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="font-headline text-xl flex items-center gap-3"><Target className="w-6 h-6 text-primary"/>Claim Analysis: {claim.claim}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-lg">
                  <span className="font-semibold text-lg">Simulated Probability</span>
                  <span className="text-3xl font-bold font-headline text-accent">{claim.simulated_probability}</span>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold">Result</h4>
                <p className="text-sm text-muted-foreground">{claim.result}</p>
              </div>
              <p className="text-sm text-muted-foreground"><span className="font-semibold">Analysis Method:</span> {claim.analysis_method}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><Sparkles className="w-7 h-7 text-accent"/>AI-Powered Investigation Suggestions</CardTitle>
          <CardDescription>Generate AI suggestions for follow-up questions based on financial projections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!suggestions && !isLoading && (
            <Button onClick={handleGenerateSuggestions} disabled={isLoading}>
               {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="mr-2 h-4 w-4" />
              )}
              Generate Suggestions
            </Button>
          )}
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Thinking of smart questions...</span>
            </div>
          )}
          {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {suggestions && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle className="font-headline">Follow-up Investigations</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
