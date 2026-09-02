'use client';

import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleGauge,
  CloudHail,
  CloudRainWind,
  Compass,
  Mail,
  MapPin,
  Radar,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  SunMedium,
  Waves,
  Wind,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type RiskLevel = 'critical' | 'high' | 'watch' | 'clear';

type Branch = {
  city: string;
  province: string;
  lat: number;
  lon: number;
  risk: RiskLevel;
  headline: string;
  leadTime: string;
  window: string;
  distance: string;
  vehicles: number;
  coveredBays: number;
  recipients: string[];
  hazards: string[];
  updated: string;
};

const branches: Branch[] = [
  {
    city: 'Johannesburg',
    province: 'Gauteng',
    lat: -26.2041,
    lon: 28.0473,
    risk: 'critical',
    headline: 'Hail-producing storm line tracking east',
    leadTime: '42 min',
    window: '13:20-15:10',
    distance: '31 km west',
    vehicles: 184,
    coveredBays: 63,
    recipients: ['JHB Branch Managers', 'National Risk Team'],
    hazards: ['Hail', 'Lightning', 'Gusts 72 km/h'],
    updated: '11:44 SAST',
  },
  {
    city: 'Pretoria',
    province: 'Gauteng',
    lat: -25.7479,
    lon: 28.2293,
    risk: 'high',
    headline: 'Severe thunderstorm watch with hail signal',
    leadTime: '1 hr 15 min',
    window: '14:00-16:30',
    distance: '46 km south-west',
    vehicles: 126,
    coveredBays: 51,
    recipients: ['PTA Branch Managers', 'National Risk Team'],
    hazards: ['Hail risk', 'Heavy rain', 'Gusts 64 km/h'],
    updated: '11:39 SAST',
  },
  {
    city: 'Durban',
    province: 'KwaZulu-Natal',
    lat: -29.8587,
    lon: 31.0218,
    risk: 'watch',
    headline: 'Coastal rain bands building after peak hire window',
    leadTime: '3 hr 20 min',
    window: '15:45-21:00',
    distance: 'Offshore north-east',
    vehicles: 143,
    coveredBays: 88,
    recipients: ['DBN Branch Managers', 'National Risk Team'],
    hazards: ['Heavy rain', 'Local flooding', 'Crosswinds'],
    updated: '11:41 SAST',
  },
  {
    city: 'Cape Town',
    province: 'Western Cape',
    lat: -33.9249,
    lon: 18.4241,
    risk: 'clear',
    headline: 'No damaging weather inside active window',
    leadTime: 'None',
    window: 'Next 6 hr clear',
    distance: 'No storm cells',
    vehicles: 158,
    coveredBays: 94,
    recipients: ['CPT Branch Managers', 'National Risk Team'],
    hazards: ['Monitoring wind shift'],
    updated: '11:36 SAST',
  },
];

const sources = [
  {
    name: 'SAWS via AfriGIS',
    status: 'Warning feed active',
    cadence: 'Every 10 min',
    coverage: 'Municipality warnings',
  },
  {
    name: 'Windy Point Forecast',
    status: 'Storm parameters synced',
    cadence: 'Every 15 min',
    coverage: 'City coordinates',
  },
  {
    name: 'AccuWeather Alerts',
    status: 'Government + provider alerts',
    cadence: 'Every 15 min',
    coverage: 'Location keys',
  },
  {
    name: 'Yr / Meteoblue',
    status: 'Forecast cross-check',
    cadence: 'Every 30 min',
    coverage: 'Rain, wind, snow',
  },
];

const warnings = [
  {
    city: 'Johannesburg',
    level: 'Red',
    type: 'Hail storm',
    trigger: 'Storm cell inside 30-60 min window',
    sent: '11:45 SAST',
  },
  {
    city: 'Pretoria',
    level: 'Orange',
    type: 'Strong winds',
    trigger: 'Gust forecast above 65 km/h',
    sent: '11:40 SAST',
  },
  {
    city: 'Durban',
    level: 'Yellow',
    type: 'Heavy rain',
    trigger: 'Rain intensity above branch threshold',
    sent: '11:38 SAST',
  },
];

const rules = [
  ['Hail', 'Any hail marker or severe thunderstorm with hail code inside 60 min'],
  ['Wind', 'Sustained wind above 48 km/h or gusts above 64 km/h'],
  ['Rain', 'Heavy rain warning or forecast accumulation above 20 mm / 3 hr'],
  ['Snow', 'Any snow or ice warning affecting the city operating window'],
  ['Official alerts', 'Any SAWS orange or red warning for the monitored city'],
];

const riskStyles: Record<RiskLevel, string> = {
  critical: 'border-red-400 bg-red-50 text-red-950',
  high: 'border-amber-400 bg-amber-50 text-amber-950',
  watch: 'border-sky-400 bg-sky-50 text-sky-950',
  clear: 'border-emerald-400 bg-emerald-50 text-emerald-950',
};

const riskPill: Record<RiskLevel, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-amber-500 text-slate-950',
  watch: 'bg-sky-600 text-white',
  clear: 'bg-emerald-600 text-white',
};

const markerPosition: Record<string, { left: string; top: string }> = {
  Johannesburg: { left: '58%', top: '35%' },
  Pretoria: { left: '60%', top: '31%' },
  Durban: { left: '72%', top: '56%' },
  'Cape Town': { left: '24%', top: '78%' },
};

function riskRank(risk: RiskLevel) {
  return { critical: 4, high: 3, watch: 2, clear: 1 }[risk];
}

function hazardIcon(hazard: string) {
  const normalized = hazard.toLowerCase();

  if (normalized.includes('hail')) return <CloudHail className="size-4" />;
  if (normalized.includes('rain') || normalized.includes('flood'))
    return <CloudRainWind className="size-4" />;
  if (normalized.includes('gust') || normalized.includes('wind'))
    return <Wind className="size-4" />;
  if (normalized.includes('snow') || normalized.includes('ice'))
    return <Snowflake className="size-4" />;
  if (normalized.includes('coastal')) return <Waves className="size-4" />;
  return <AlertTriangle className="size-4" />;
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState('All cities');
  const visibleBranches = useMemo(
    () =>
      selectedCity === 'All cities'
        ? branches
        : branches.filter((branch) => branch.city === selectedCity),
    [selectedCity],
  );

  const topRisk = branches.reduce((highest, branch) =>
    riskRank(branch.risk) > riskRank(highest.risk) ? branch : highest,
  );
  const activeAlerts = branches.filter((branch) => branch.risk !== 'clear');
  const exposedVehicles = activeAlerts.reduce(
    (total, branch) => total + Math.max(branch.vehicles - branch.coveredBays, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-cyan-200">
                <Radar className="size-4" />
                AVIS Weather Risk Monitor
              </div>
              <h1 className="max-w-4xl text-2xl font-semibold sm:text-3xl">
                Extreme weather watch for Johannesburg, Pretoria, Durban and
                Cape Town
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-white/15">
                <RefreshCw className="size-4" />
                11:45 SAST
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200">
                <Mail className="size-4" />
                Email Queue
              </button>
            </div>
          </header>

          <section className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-red-400/60 bg-red-950/45 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-red-100">Highest risk</span>
                <ShieldAlert className="size-5 text-red-200" />
              </div>
              <p className="text-2xl font-semibold">{topRisk.city}</p>
              <p className="mt-1 text-sm text-red-100">{topRisk.leadTime}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">Active warnings</span>
                <BellRing className="size-5 text-cyan-200" />
              </div>
              <p className="text-2xl font-semibold">{activeAlerts.length}</p>
              <p className="mt-1 text-sm text-slate-400">Across 4 cities</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">Exposed vehicles</span>
                <CircleGauge className="size-5 text-cyan-200" />
              </div>
              <p className="text-2xl font-semibold">{exposedVehicles}</p>
              <p className="mt-1 text-sm text-slate-400">Outside covered bays</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">Alert channel</span>
                <Mail className="size-5 text-cyan-200" />
              </div>
              <p className="text-2xl font-semibold">Email</p>
              <p className="mt-1 text-sm text-slate-400">
                Branch Managers + Risk
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <section className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(440px,0.94fr)_minmax(0,1.06fr)]">
            <div className="rounded-lg border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-slate-950/25">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Operations Map</h2>
                  <p className="text-sm text-slate-400">
                    City-level weather exposure and lead time
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['All cities', ...branches.map((branch) => branch.city)].map(
                    (city) => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${
                          selectedCity === city
                            ? 'border-cyan-300 bg-cyan-300 text-slate-950'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {city}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="relative min-h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[#112935]">
                <svg
                  viewBox="0 0 640 520"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full opacity-90"
                >
                  <defs>
                    <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
                      <stop stopColor="#214a4d" />
                      <stop offset="1" stopColor="#173342" />
                    </linearGradient>
                    <pattern
                      id="grid"
                      width="44"
                      height="44"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 44 0 L 0 0 0 44"
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity="0.05"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="640" height="520" fill="#0d2430" />
                  <rect width="640" height="520" fill="url(#grid)" />
                  <path
                    d="M83 316 121 270 169 245 203 198 258 184 307 147 362 153 401 127 461 147 517 203 559 260 574 332 548 383 494 409 451 459 378 474 315 451 251 466 190 428 137 402Z"
                    fill="url(#land)"
                    stroke="#78d4dc"
                    strokeOpacity="0.55"
                    strokeWidth="2"
                  />
                  <path
                    d="M251 466 C270 419 307 398 354 390 C391 383 427 365 453 338"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.16"
                    strokeWidth="2"
                  />
                  <path
                    d="M169 245 C225 280 283 290 349 283 C406 276 457 288 512 321"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.14"
                    strokeWidth="2"
                  />
                  <path
                    d="M311 159 C343 216 384 253 448 271"
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.14"
                    strokeWidth="2"
                  />
                  <circle
                    cx="350"
                    cy="192"
                    r="112"
                    fill="#ef4444"
                    opacity="0.12"
                  />
                  <circle
                    cx="360"
                    cy="193"
                    r="64"
                    fill="#f59e0b"
                    opacity="0.18"
                  />
                  <circle
                    cx="463"
                    cy="292"
                    r="84"
                    fill="#38bdf8"
                    opacity="0.11"
                  />
                </svg>

                {visibleBranches.map((branch) => {
                  const position = markerPosition[branch.city];

                  return (
                    <div
                      key={branch.city}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: position.left, top: position.top }}
                    >
                      <div className="relative">
                        {branch.risk !== 'clear' ? (
                          <span
                            className={`absolute inset-0 rounded-full ${
                              branch.risk === 'critical'
                                ? 'bg-red-400'
                                : branch.risk === 'high'
                                  ? 'bg-amber-300'
                                  : 'bg-sky-300'
                            } animate-ping opacity-35`}
                          />
                        ) : null}
                        <div
                          className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white shadow-xl ${riskPill[branch.risk]}`}
                        >
                          <MapPin className="size-5" />
                        </div>
                      </div>
                      <div className="mt-2 w-36 rounded-md border border-white/10 bg-slate-950/80 px-2 py-1 text-center text-xs shadow-xl backdrop-blur">
                        <p className="font-semibold">{branch.city}</p>
                        <p className="text-slate-300">{branch.leadTime}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {visibleBranches.map((branch) => (
                <article
                  key={branch.city}
                  className={`rounded-lg border p-4 shadow-xl shadow-slate-950/20 ${riskStyles[branch.risk]}`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{branch.city}</h3>
                        <span
                          className={`rounded-sm px-2 py-1 text-[11px] font-bold uppercase ${riskPill[branch.risk]}`}
                        >
                          {branch.risk}
                        </span>
                      </div>
                      <p className="text-sm opacity-75">{branch.province}</p>
                    </div>
                    <Compass className="mt-1 size-5 shrink-0 opacity-70" />
                  </div>

                  <p className="min-h-12 text-base font-semibold">
                    {branch.headline}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs uppercase opacity-65">Lead</p>
                      <p className="font-semibold">{branch.leadTime}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase opacity-65">Window</p>
                      <p className="font-semibold">{branch.window}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase opacity-65">Track</p>
                      <p className="font-semibold">{branch.distance}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {branch.hazards.map((hazard) => (
                      <span
                        key={hazard}
                        className="inline-flex items-center gap-1 rounded-sm border border-current/20 bg-white/45 px-2 py-1 text-xs font-medium"
                      >
                        {hazardIcon(hazard)}
                        {hazard}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-current/15 pt-4 text-sm">
                    <div>
                      <p className="text-xs uppercase opacity-65">Fleet count</p>
                      <p className="text-xl font-semibold">{branch.vehicles}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase opacity-65">
                        Covered bays
                      </p>
                      <p className="text-xl font-semibold">
                        {branch.coveredBays}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Warning Messages</h2>
                  <p className="text-sm text-slate-400">
                    Email-ready notices by city and severity
                  </p>
                </div>
                <Mail className="size-5 text-cyan-200" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-400">
                      <th className="border-b border-white/10 pb-3">City</th>
                      <th className="border-b border-white/10 pb-3">Level</th>
                      <th className="border-b border-white/10 pb-3">Type</th>
                      <th className="border-b border-white/10 pb-3">Trigger</th>
                      <th className="border-b border-white/10 pb-3">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warnings.map((warning) => (
                      <tr key={`${warning.city}-${warning.type}`}>
                        <td className="border-b border-white/10 py-3 font-semibold">
                          {warning.city}
                        </td>
                        <td className="border-b border-white/10 py-3">
                          <span
                            className={`rounded-sm px-2 py-1 text-xs font-bold ${
                              warning.level === 'Red'
                                ? 'bg-red-500 text-white'
                                : warning.level === 'Orange'
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-yellow-200 text-slate-950'
                            }`}
                          >
                            {warning.level}
                          </span>
                        </td>
                        <td className="border-b border-white/10 py-3">
                          {warning.type}
                        </td>
                        <td className="border-b border-white/10 py-3 text-slate-300">
                          {warning.trigger}
                        </td>
                        <td className="border-b border-white/10 py-3 text-slate-300">
                          {warning.sent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-900 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Alert Rules</h2>
                  <p className="text-sm text-slate-400">
                    First-pass thresholds for vehicle damage risk
                  </p>
                </div>
                <CalendarClock className="size-5 text-cyan-200" />
              </div>
              <div className="space-y-3">
                {rules.map(([label, rule]) => (
                  <div
                    key={label}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                  >
                    <p className="mb-1 text-sm font-semibold text-cyan-100">
                      {label}
                    </p>
                    <p className="text-sm text-slate-300">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-white/10 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Source Health</h2>
                <p className="text-sm text-slate-400">
                  Multi-source verification status
                </p>
              </div>
              <CheckCircle2 className="size-5 text-emerald-300" />
            </div>
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.name}
                  className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{source.name}</p>
                      <p className="text-sm text-slate-300">{source.status}</p>
                    </div>
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgb(110_231_183/75%)]" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>{source.cadence}</span>
                    <span>{source.coverage}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Recipients</h2>
                <p className="text-sm text-slate-400">City routing groups</p>
              </div>
              <Mail className="size-5 text-cyan-200" />
            </div>
            <div className="space-y-3">
              {branches.map((branch) => (
                <div
                  key={branch.city}
                  className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">{branch.city}</p>
                    <span className="text-xs text-slate-400">
                      {branch.updated}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-300">
                    {branch.recipients.map((recipient) => (
                      <p key={recipient}>{recipient}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-cyan-300/25 bg-cyan-950/25 p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-100">
              <SunMedium className="size-5" />
              <h2 className="text-lg font-semibold">MVP Scope</h2>
            </div>
            <p className="text-sm leading-6 text-cyan-50/85">
              City-level warning aggregation, risk classification, branch email
              routing, and a live dashboard. Exact branch coordinates, SMS or
              WhatsApp, escalation, and vehicle movement workflows can be added
              after the alert feeds are connected.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
