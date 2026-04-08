export interface ScoreBucket {
  key: string;
  label: string;
  min: number;
  max?: number;
}

export const ScoreBucketMap: ScoreBucket[] = [
  { key: 'excellent', label: '90-100', min: 90, max: 100 },
  { key: 'good', label: '80-89', min: 80, max: 89.99 },
  { key: 'medium', label: '70-79', min: 70, max: 79.99 },
  { key: 'pass', label: '60-69', min: 60, max: 69.99 },
  { key: 'fail', label: '0-59', min: 0, max: 59.99 },
];
