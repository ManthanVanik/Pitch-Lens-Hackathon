
export type Founder = {
  name: string;
  education: string | null;
  previous_ventures: string | null;
  professional_background: string | null;
};

export type CompanyOverview = {
  name: string;
  sector: string;
  founders: Founder[];
  technology: string;
};

export type MarketValue = {
  value: string;
  cagr: string;
  source: string;
  projection?: string;
  name: string;
};

export type CompetitorDetail = {
  name: string;
  business_model: string;
  funding: string;
  margins: string;
  commentary: string;
  category: string;
};

export type MarketAnalysis = {
  industry_size_and_growth: {
    total_addressable_market: MarketValue;
    serviceable_obtainable_market: MarketValue;
    commentary: string;
  };
  recent_news: string;
  competitor_details: CompetitorDetail[];
  sub_segment_opportunities: string[];
};

export type BusinessModel = {
  revenue_streams: string;
  pricing: string;
  scalability: string;
  unit_economics: {
    customer_lifetime_value_ltv: string;
    customer_acquisition_cost_cac: string;
  };
};

export type FinancialProjection = {
  revenue: string;
  year: string;
};

export type Financials = {
  funding_history: string;
  projections: FinancialProjection[];
  valuation_rationale: string;
srr_mrr: {
    current_booked_arr: string;
    current_mrr: string;
  };
  burn_and_runway: {
    funding_ask: string;
    stated_runway: string;
    implied_net_burn: string;
  };
};

export type Claim = {
  result: string;
  simulated_probability: string;
  simulation_assumptions: {
    average_contract_value?: string;
    base_revenue?: string;
    engagement_conversion_rate?: string;
    pilot_conversion_rate?: string;
    runs?: string;
    time_horizon_months?: number;
    initial_customers?: number;
    acv_distribution?: string;
    assumptions?: string;
  };
  analysis_method: string;
  claim: string;
  input_dataset_length?: string;
};

export type ClaimsAnalysis = Claim[];

export type RiskMetrics = {
  narrative_justification: string;
  composite_risk_score: number;
  score_interpretation: string;
};

export type Conclusion = {
  overall_attractiveness: string;
};

export type MemoV1 = {
  claims_analysis: ClaimsAnalysis;
  market_analysis: MarketAnalysis;
  financials: Financials;
  company_overview: CompanyOverview;
  conclusion: Conclusion;
  business_model: BusinessModel;
  risk_metrics: RiskMetrics;
};

export type Memo = {
  docx_url: string;
  draft_v1: MemoV1;
  generated_at: string;
};

export type Metadata = {
  created_at: string;
  sector: string;
  deal_id: string;
  company_name: string;
  founder_names: string[];
  error: string | null;
  status: string;
  processed_at: string;
  weightage: {
    claim_credibility: number;
    financial_health: number;
    market_opportunity: number;
    team_strength: number;
    traction: number;
  };
};

export type AnalysisData = {
  memo: Memo;
  raw_files: {
    pitch_deck_url: string;
  };
  extracted_text: any;
  metadata: Metadata;
  public_data: any;
  deal_id: string;
};
