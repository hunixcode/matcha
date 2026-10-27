import { b21 } from './b2-1';
import { bu } from './bu';
import type { ReportDefinition, ReportId } from './types';

export const reports: Record<ReportId, ReportDefinition> = {
  'b2-1': b21,
  bu,
};

export const reportList: ReportDefinition[] = [b21, bu];

export function getReport(id: string | string[] | undefined): ReportDefinition | undefined {
  return typeof id === 'string' && id in reports ? reports[id as ReportId] : undefined;
}
