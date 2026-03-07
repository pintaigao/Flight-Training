import { useMemo, useRef, useState } from 'react';
import FlightFilters from '@/components/flights/FlightFilters';
import FlightCard from '@/components/flights/FlightCard';
import { useStore } from '@/store/store';
import { readForeFlightKmlTimeRange } from '@/lib/utils/foreflightKmlTimeRange';
import ImportForeFlightKmlModal from '@/components/flights/ImportForeFlightKmlModal';
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
    const list = state.flightIds.map((id) => state.flightsById[id]);
    const q = state.filters.q.trim().toLowerCase();

    return list.filter((f) => {
      if (
        state.filters.aircraft !== 'ALL' &&
        f.aircraftTail !== state.filters.aircraft
      )
        return false;
      if (state.filters.tag !== 'ALL' && !f.tags.includes(state.filters.tag))
        return false;
      if (!q) return true;
      const hay =
        `${f.dateISO} ${f.from} ${f.to} ${f.aircraftTail} ${f.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [state]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Flights</h1>
          <div className="muted">
            Filter, browse, and open a flight to add notes
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={() => {
              setImportError(null);
              fileRef.current?.click();
            }}>
            Import ForeFlight KML
          </button>
          {/* prettier-ignore */}
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
            }} />
        </div>
      </div>

      {importError && <div className="error">{importError}</div>}
      {deleteError && <div className="error">{deleteError}</div>}
      <FlightFilters />

      <div className="flight-cards">
        {flights.map((f) => (
          // prettier-ignore
          <FlightCard
            key={f.id}
            flight={f}
            selected={state.selectedFlightId === f.id}
            onDelete={(id) => {
              setDeleteError(null);
              setDeleteId(id);
            }} />
        ))}
        {flights.length === 0 && (
          <div className="muted">
            No flights yet. Import a ForeFlight KML to create or attach a track.
          </div>
        )}
      </div>

      {/* prettier-ignore */}
      <ImportForeFlightKmlModal
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
