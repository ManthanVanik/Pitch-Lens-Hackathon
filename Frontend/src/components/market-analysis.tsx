
import type { MarketAnalysis as MarketAnalysisType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Scale, Newspaper, Target } from 'lucide-react';

export default function MarketAnalysis({ data }: { data: MarketAnalysisType }) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><TrendingUp className="w-7 h-7 text-primary"/>Industry Size & Growth</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
            <h4 className="font-semibold text-lg">{data.industry_size_and_growth.total_addressable_market.name} (TAM)</h4>
            <p className="text-4xl font-bold font-headline text-primary">{data.industry_size_and_growth.total_addressable_market.value}</p>
            <Badge variant="secondary">CAGR: {data.industry_size_and_growth.total_addressable_market.cagr}</Badge>
          </div>
          <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
            <h4 className="font-semibold text-lg">{data.industry_size_and_growth.serviceable_obtainable_market.name} (SOM)</h4>
            <p className="text-4xl font-bold font-headline text-primary">{data.industry_size_and_growth.serviceable_obtainable_market.value}</p>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary">CAGR: {data.industry_size_and_growth.serviceable_obtainable_market.cagr}</Badge>
              {data.industry_size_and_growth.serviceable_obtainable_market.projection && (
                <Badge variant="outline">Projection: {data.industry_size_and_growth.serviceable_obtainable_market.projection}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><Target className="w-7 h-7 text-primary"/>Sub-segment Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside text-muted-foreground">
                {data.sub_segment_opportunities.map((opp, i) => (
                    <li key={i}>{opp}</li>
                ))}
            </ul>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-headline text-2xl mb-4 flex items-center gap-3"><Scale className="w-7 h-7 text-primary"/>Competitor Details</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Competitor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Business Model</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead>Margins & Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.competitor_details.map((competitor) => (
                <TableRow key={competitor.name}>
                  <TableCell className="font-medium">{competitor.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{competitor.commentary}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{competitor.business_model}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{competitor.funding}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{competitor.margins}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3"><Newspaper className="w-7 h-7 text-primary"/>Recent News</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{data.recent_news}</p>
        </CardContent>
      </Card>
    </div>
  );
}
