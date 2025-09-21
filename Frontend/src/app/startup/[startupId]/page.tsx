
'use client';

import { useState, useEffect, use } from 'react';
import type { AnalysisData } from '@/lib/types';
import AnalysisDashboard from '@/components/analysis-dashboard';
import { Loader2 } from 'lucide-react';
import Header from '@/components/header';
import { notFound } from 'next/navigation';

export default function StartupPage({ params }: { params: { startupId: string } }) {
  const { startupId } = use(params);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchDeal = async () => {
      if (startupId === 'new') {
        setIsLoading(false);
        // Potentially set some default state for a new analysis
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/deals/${startupId}`);
        if (!response.ok) {
          if(response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch analysis data.');
        }
        const data = await response.json();
        setAnalysisData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeal();
  }, [startupId]);


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-headline font-semibold text-primary">Loading Analysis...</h2>
            <p className="text-muted-foreground mt-2">Our AI is hard at work. This might take a moment.</p>
          </div>
        ) : error ? (
           <div className="text-center py-20">
              <h2 className="text-2xl font-headline font-semibold text-destructive">{error}</h2>
          </div>
        ) : analysisData ? (
          <AnalysisDashboard analysisData={analysisData} startupId={startupId}/>
        ) : (
          <div className="text-center py-20">
              <h2 className="text-2xl font-headline font-semibold text-destructive">Analysis not found.</h2>
          </div>
        )}
      </main>
    </div>
  );
}
