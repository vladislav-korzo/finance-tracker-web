export type AnalyticsScreenProps = {
  loading: boolean;
  chartData: { label: string; income: number; expense: number }[];
  defaultCurrency: string;
};
