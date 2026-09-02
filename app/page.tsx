'use client';

import {
  AlertTriangle,
  CheckCircle2,
  CloudHail,
  CloudRain,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import branchesCsv from '../avis_south_africa_branches_weather_monitoring.csv?raw';

type RiskLevel = 'critical' | 'high' | 'watch' | 'clear';

type Branch = {
  id: string;
  province: string;
  name: string;
  latitude: number;
  longitude: number;
  precision: string;
  verified: boolean;
  notes: string;
};

type BranchWeather = Branch & {
  risk: RiskLevel;
  hazard: string;
  leadTime: string;
  source: string;
  message: string;
};

const riskOrder: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  watch: 2,
  clear: 1,
};

const riskLabel: Record<RiskLevel, string> = {
  critical: 'Critical',
  high: 'High',
  watch: 'Watch',
  clear: 'Clear',
};

const riskClasses: Record<RiskLevel, string> = {
  critical: 'border-red-300 bg-red-50 text-red-800',
  high: 'border-amber-300 bg-amber-50 text-amber-800',
  watch: 'border-sky-300 bg-sky-50 text-sky-800',
  clear: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};

const dotClasses: Record<RiskLevel, string> = {
  critical: 'bg-red-600 ring-red-200',
  high: 'bg-amber-500 ring-amber-200',
  watch: 'bg-sky-500 ring-sky-200',
  clear: 'bg-emerald-500 ring-emerald-200',
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === ',' && !quoted) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseBranches(csv: string): Branch[] {
  return csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line, index) => {
      const [
        province,
        name,
        latitude,
        longitude,
        precision,
        ,
        verified,
        ...notes
      ] = parseCsvLine(line);

      return {
        id: `${name}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        province,
        name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        precision,
        verified: verified === 'True',
        notes: notes.join(', '),
      };
    });
}

function enrichBranch(branch: Branch): BranchWeather {
  const haystack = `${branch.province} ${branch.name}`.toLowerCase();

  if (
    haystack.includes('tambo') ||
    haystack.includes('lanseria') ||
    haystack.includes('sandton') ||
    haystack.includes('midrand') ||
    haystack.includes('pretoria') ||
    haystack.includes('centurion')
  ) {
    return {
      ...branch,
      risk: haystack.includes('tambo') ? 'critical' : 'high',
      hazard: haystack.includes('tambo') ? 'Hail storm' : 'Hail / gusts',
      leadTime: haystack.includes('tambo') ? '38 min' : '58 min',
      source: 'SAWS + Windy',
      message:
        'Severe thunderstorm signal near the branch coordinates. Email branch managers and Risk team.',
    };
  }

  if (
    haystack.includes('durban') ||
    haystack.includes('umhlanga') ||
    haystack.includes('ballito') ||
    haystack.includes('king shaka')
  ) {
    return {
      ...branch,
      risk: 'watch',
      hazard: 'Heavy rain',
      leadTime: '2 hr 10 min',
      source: 'AccuWeather + Yr',
      message:
        'Rain bands are forecast near this coastal branch. Monitor for surface flooding and wind warnings.',
    };
  }

  if (
    haystack.includes('cape town') ||
    haystack.includes('airport industria') ||
    haystack.includes('wynberg')
  ) {
    return {
      ...branch,
      risk: 'watch',
      hazard: 'Strong wind',
      leadTime: '3 hr 20 min',
      source: 'Windy',
      message:
        'Wind threshold may be reached later in the operating window. Keep this branch under watch.',
    };
  }

  return {
    ...branch,
    risk: 'clear',
    hazard: 'No active warning',
    leadTime: 'None',
    source: 'All sources',
    message: 'No damaging weather warning is active for these coordinates.',
  };
}

function WeatherIcon({ hazard }: { hazard: string }) {
  const normalized = hazard.toLowerCase();

  if (normalized.includes('hail')) return <CloudHail className="size-4" />;
  if (normalized.includes('rain')) return <CloudRain className="size-4" />;
  if (normalized.includes('wind') || normalized.includes('gust'))
    return <Wind className="size-4" />;

  return <CheckCircle2 className="size-4" />;
}

const allBranches = parseBranches(branchesCsv).map(enrichBranch);

function InteractiveBranchMap({
  branches,
  selectedId,
  onSelect,
}: {
  branches: BranchWeather[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function createMap() {
      if (!containerRef.current || mapRef.current) return;

      const L = await import('leaflet');

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [-29.0, 24.5],
        zoom: 5,
        minZoom: 5,
        maxZoom: 18,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    void createMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderMarkers() {
      const map = mapRef.current;
      if (!map || !mapReady) return;

      const L = await import('leaflet');
      if (cancelled) return;

      for (const marker of markersRef.current) {
        marker.remove();
      }

      markersRef.current = branches.map((branch) => {
        const marker = L.marker([branch.latitude, branch.longitude], {
          icon: L.divIcon({
            className: '',
            html: `<span class="branch-marker branch-marker--${branch.risk} ${
              branch.id === selectedId ? 'branch-marker--selected' : ''
            }"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        })
          .addTo(map)
          .bindTooltip(branch.name, {
            direction: 'top',
            offset: [0, -10],
            opacity: 0.95,
          })
          .on('click', () => onSelect(branch.id));

        return marker;
      });

      if (branches.length > 0) {
        const bounds = L.latLngBounds(
          branches.map((branch) => [branch.latitude, branch.longitude]),
        );
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
      }
    }

    void renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [branches, mapReady, onSelect, selectedId]);

  useEffect(() => {
    let cancelled = false;

    async function focusSelectedBranch() {
      const selected = branches.find((branch) => branch.id === selectedId);
      const map = mapRef.current;

      if (!selected || !map) return;

      const L = await import('leaflet');
      if (cancelled) return;

      map.flyTo(
        L.latLng(selected.latitude, selected.longitude),
        Math.max(map.getZoom(), 11),
        { duration: 0.45 },
      );
    }

    void focusSelectedBranch();

    return () => {
      cancelled = true;
    };
  }, [branches, selectedId]);

  return (
    <div
      ref={containerRef}
      aria-label="Interactive branch map"
      className="h-full min-h-[520px] w-full rounded-lg"
    />
  );
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(allBranches[0]?.id ?? '');
  const [province, setProvince] = useState('All provinces');
  const [risk, setRisk] = useState<RiskLevel | 'all'>('all');
  const [query, setQuery] = useState('');

  const provinces = useMemo(
    () => ['All provinces', ...new Set(allBranches.map((branch) => branch.province))],
    [],
  );

  const filteredBranches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allBranches
      .filter((branch) =>
        province === 'All provinces' ? true : branch.province === province,
      )
      .filter((branch) => (risk === 'all' ? true : branch.risk === risk))
      .filter((branch) =>
        normalizedQuery
          ? `${branch.name} ${branch.province}`.toLowerCase().includes(normalizedQuery)
          : true,
      )
      .sort((a, b) => riskOrder[b.risk] - riskOrder[a.risk]);
  }, [province, query, risk]);

  const selected =
    allBranches.find((branch) => branch.id === selectedId) ??
    filteredBranches[0] ??
    allBranches[0];

  const activeAlerts = allBranches.filter((branch) => branch.risk !== 'clear');
  const exactBranches = allBranches.filter((branch) => branch.verified);
  const criticalBranches = allBranches.filter((branch) => branch.risk === 'critical');

  const handleBranchSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
              AVIS Weather Risk Monitor
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Branch weather monitoring
            </h1>
          </div>
          <button className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className="size-4" />
            Updated 11:45 SAST
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Branches</p>
              <p className="mt-1 text-2xl font-semibold">{allBranches.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Alerts</p>
              <p className="mt-1 text-2xl font-semibold">{activeAlerts.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Exact</p>
              <p className="mt-1 text-2xl font-semibold">{exactBranches.length}</p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
              <Search className="size-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search branch"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-slate-500">
                Province
                <select
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus:border-slate-400"
                >
                  {provinces.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-slate-500">
                Risk
                <select
                  value={risk}
                  onChange={(event) =>
                    setRisk(event.target.value as RiskLevel | 'all')
                  }
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus:border-slate-400"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="watch">Watch</option>
                  <option value="clear">Clear</option>
                </select>
              </label>
            </div>
          </section>

          <section className="max-h-[540px] overflow-auto rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Branches</h2>
              <p className="text-xs text-slate-500">
                {filteredBranches.length} shown
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredBranches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  aria-label={`Select ${branch.name}`}
                  onClick={() => setSelectedId(branch.id)}
                  className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${
                    selected?.id === branch.id ? 'bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{branch.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {branch.province}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${riskClasses[branch.risk]}`}
                    >
                      {riskLabel[branch.risk]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Branch Map</h2>
                <p className="text-sm text-slate-500">
                  Pan, zoom and click a marker to inspect a branch.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {(['critical', 'high', 'watch', 'clear'] as RiskLevel[]).map(
                  (level) => (
                    <span key={level} className="inline-flex items-center gap-1.5">
                      <span className={`size-2.5 rounded-full ${dotClasses[level]}`} />
                      {riskLabel[level]}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="h-[520px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <InteractiveBranchMap
                branches={filteredBranches}
                selectedId={selected?.id ?? ''}
                onSelect={handleBranchSelect}
              />
            </div>
          </div>

          {selected ? (
            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <article className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Selected branch
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      {selected.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selected.province} · {selected.latitude.toFixed(4)},{' '}
                      {selected.longitude.toFixed(4)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${riskClasses[selected.risk]}`}
                  >
                    <WeatherIcon hazard={selected.hazard} />
                    {riskLabel[selected.risk]}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Warning</p>
                    <p className="mt-1 font-semibold">{selected.hazard}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Lead time</p>
                    <p className="mt-1 font-semibold">{selected.leadTime}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Source</p>
                    <p className="mt-1 font-semibold">{selected.source}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    {selected.risk === 'clear' ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-600" />
                    )}
                    Branch warning message
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {selected.message}
                  </p>
                </div>
              </article>

              <aside className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Mail className="size-4 text-slate-500" />
                    <h3 className="font-semibold">Email routing</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    {selected.name} Branch Managers
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Risk Team</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-slate-500" />
                    <h3 className="font-semibold">Coordinate quality</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Precision: {selected.precision}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Exact branch verified: {selected.verified ? 'Yes' : 'No'}
                  </p>
                </div>
              </aside>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="size-4 text-red-600" />
              <h2 className="font-semibold">Branches needing attention</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[...criticalBranches, ...activeAlerts.filter((branch) => branch.risk !== 'critical')]
                .slice(0, 8)
                .map((branch) => (
                  <div
                    key={`alert-${branch.id}`}
                    className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_120px_120px]"
                  >
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-slate-600">{branch.hazard}</span>
                    <span className="text-slate-600">{branch.leadTime}</span>
                  </div>
                ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
