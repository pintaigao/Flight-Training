import { http } from './client';
import type {
  CreateTrackScheduleInput,
  TrackSchedule,
} from '@/lib/types/trackSchedule';

export function createTrackSchedule(input: CreateTrackScheduleInput) {
  return http
    .post<TrackSchedule>('/flights/track-schedules', input)
    .then((res) => res.data);
}

export function getTrackSchedules() {
  return http
    .get<TrackSchedule[]>('/flights/track-schedules')
    .then((res) => res.data);
}

export function getTrackSchedule(id: number | string) {
  return http
    .get<TrackSchedule>(`/flights/track-schedules/${encodeURIComponent(String(id))}`)
    .then((res) => res.data);
}

export function cancelTrackSchedule(id: number | string) {
  return http
    .post(`/flights/track-schedules/${encodeURIComponent(String(id))}/cancel`)
    .then((res) => res.data);
}

export function archiveTrackSchedule(id: number | string) {
  return http
    .post(`/flights/track-schedules/${encodeURIComponent(String(id))}/archive`)
    .then((res) => res.data);
}

export async function downloadTrackScheduleExecution(executionId: number | string) {
  const response = await http.get<Blob>(
    `/flights/track-schedules/executions/${encodeURIComponent(String(executionId))}/download`,
    { responseType: 'blob' },
  );

  const blob = response.data;
  const contentDisposition = response.headers['content-disposition'];
  const filenameMatch =
    typeof contentDisposition === 'string'
      ? /filename="?([^"]+)"?/i.exec(contentDisposition)
      : null;

  return {
    blob,
    filename: filenameMatch?.[1] ?? 'track-log.kml',
  };
}
