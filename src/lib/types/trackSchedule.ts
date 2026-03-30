export type TrackTargetType = 'tail' | 'hex' | 'flight';

export type TrackScheduleExecution = {
  id: number;
  scheduleId: number;
  status: string;
  matchedPointCount: number;
  startedAtUtc?: string | null;
  finishedAtUtc?: string | null;
  errorMessage?: string | null;
  downloadUrl?: string | null;
};

export type TrackSchedule = {
  id: number;
  displayName: string;
  targetType: TrackTargetType | string;
  targetValue: string;
  watchDateUtc: string;
  startZulu: string;
  endZulu: string;
  status: string;
  createdAtUtc: string;
  latestExecution?: TrackScheduleExecution | null;
  executions?: TrackScheduleExecution[];
};

export type CreateTrackScheduleInput = {
  displayName: string;
  targetType: TrackTargetType;
  targetValue: string;
  watchDateUtc: string;
  startZulu: string;
  endZulu: string;
};
