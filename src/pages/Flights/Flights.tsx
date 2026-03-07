import { useMemo, useRef, useState } from 'react';
import FlightFilters from '@/components/flights/FlightFilters';
import FlightCard from '@/components/flights/FlightCard';
import { useStore } from '@/store/store';
import { readForeFlightKmlTimeRange } from '@/lib/utils/foreflightKmlTimeRange';
import ImportFlightDataModal from '@/components/flights/ImportFlightDataModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { deleteFlight } from '@/lib/api/flight.api';
import './Flights.scss';

export default function Flights() {
  const { state, dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{
    originalFilename: string;
    startTimeISO: string;
    endTimeISO: string;
    file: File;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const flights = useMemo(() => {
    const list = state.flights.flightIds.map(
      (id) => state.flights.flightsById[id],
    );
    const q = state.ui.filters.q.trim().toLowerCase();

    return list.filter((f) => {
      if (
        state.ui.filters.aircraft !== 'ALL' &&
        f.aircraftTail !== state.ui.filters.aircraft
      )
        return false;
      if (
        state.ui.filters.tag !== 'ALL' &&
        !f.tags.includes(state.ui.filters.tag)
      )
        return false;
      if (!q) return true;
      const hay =
        `${f.dateISO} ${f.from} ${f.to} ${f.aircraftTail} ${f.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [state]);

  return (
    <div className="flightsPage space-y-6">
      <div className="flightsHead flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flightsTitle text-3xl font-extrabold tracking-tight">
            Flights
          </h1>
          <div className="flightsSubtitle mt-1 text-sm text-[var(--muted)]">
            Browse flights and open a flight to add notes
          </div>
        </div>

        <div className="flightsActions flex items-center gap-3">
          <button
            className="btn-primary inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 font-semibold text-white hover:bg-[var(--accent2)]"
            type="button"
            onClick={() => {
              setImportError(null);
              fileRef.current?.click();
            }}>
            Import ForeFlight KML
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".kml,application/vnd.google-earth.kml+xml,text/xml"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImportError(null);
              try {
                const res = await readForeFlightKmlTimeRange(file);
                setParsed({
                  originalFilename: file.name,
                  startTimeISO: res.startTimeISO,
                  endTimeISO: res.endTimeISO,
                  file,
                });
                setImportOpen(true);
              } catch (err: any) {
                setImportError(err?.message ?? 'Failed to parse KML');
              } finally {
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </div>

      {(importError || deleteError) && (
        <div className="space-y-2">
          {importError && (
            <div className="text-sm text-red-400">{importError}</div>
          )}
          {deleteError && (
            <div className="text-sm text-red-400">{deleteError}</div>
          )}
        </div>
      )}

      <FlightFilters />

      <div className="flightsList space-y-2">
        {flights.map((f) => (
          <FlightCard
            key={f.id}
            flight={f}
            selected={state.flights.selectedFlightId === f.id}
            onDelete={(id) => {
              setDeleteError(null);
              setDeleteId(id);
            }} />
        ))}
        {flights.length === 0 && (
          <div className="muted text-sm text-[var(--muted)]">
            No flights yet. Import a ForeFlight KML to create or attach a track.
          </div>
        )}
      </div>

      {/* prettier-ignore */}
      <ImportFlightDataModal
        open={importOpen}
        parsed={parsed}
        onClose={() => {
          setImportOpen(false);
          setParsed(null);
        }} />

      {/* prettier-ignore */}
      <ConfirmModal
        open={!!deleteId}
        title="Delete flight?"
        message="This permanently deletes the flight and any saved tracks from the database."
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        danger
        disabled={deleting}
        onCancel={() => {
          if (deleting) return;
          setDeleteId(null);
        }}
        onConfirm={async () => {
          if (!deleteId) return;
          setDeleteError(null);
          setDeleting(true);
          try {
            await deleteFlight(deleteId);
            setDeleteId(null);
            // optimistic local update
            dispatch({ type: 'DELETE_FLIGHT', id: deleteId });
          } catch (e: any) {
            setDeleteError(
              e?.body?.message || e?.message || 'Failed to delete flight',
            );
          } finally {
            setDeleting(false);
          }
        }} />
    </div>
  );
}
