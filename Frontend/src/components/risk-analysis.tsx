
'use client';

import { useState } from 'react';
import type { RiskMetrics, Conclusion, AnalysisData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ShieldCheck, CheckCircle, Info, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

const ScoreCircle = ({ score, isLoading }: { score: string | number; isLoading?: boolean }) => {
    const numericScore = typeof score === 'string' ? parseFloat(score) : score;
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (numericScore / 100) * circumference;
  
    let colorClass = 'text-chart-2';
    if (numericScore < 70) colorClass = 'text-chart-4';
    if (numericScore < 50) colorClass = 'text-chart-1';

    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-secondary"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                { !isLoading && (
                  <circle
                      className={colorClass}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="45"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              ) : (
                <>
                  <span className={`font-headline font-bold text-4xl ${colorClass}`}>{score}</span>
                  <span className="text-sm text-muted-foreground">Safety Score</span>
                </>
              )}
            </div>
        </div>
    );
};


export default function RiskAnalysis({ riskMetrics, conclusion, isRecalculating }: { riskMetrics: RiskMetrics, conclusion: Conclusion, isRecalculating: boolean }) {

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="font-headline text-2xl flex items-center gap-3"><ShieldCheck className="w-7 h-7 text-primary"/>Risk Metrics</CardTitle>
            <CardDescription>Generated composite score and narrative justification.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <ScoreCircle score={riskMetrics.composite_risk_score} isLoading={isRecalculating} />
          </div>
          <div className="space-y-4">
            <h3 className="font-headline text-xl">Narrative Justification</h3>
            <p className="text-muted-foreground">{riskMetrics.narrative_justification}</p>
            <Badge>{riskMetrics.score_interpretation}</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><CheckCircle className="w-7 h-7 text-primary"/>Conclusion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold">Overall Attractiveness</h3>
                <p className="text-muted-foreground">{conclusion.overall_attractiveness}</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
