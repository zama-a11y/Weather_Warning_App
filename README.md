# AVIS Weather Risk Monitor

A prototype weather monitoring dashboard for a car hire company that needs early warning of extreme weather near AVIS branches in South Africa.

The first version monitors city-level risk for:

- Johannesburg
- Pretoria
- Durban
- Cape Town

It is designed to help Branch Managers and the Risk team see severe-weather warnings early enough to reduce vehicle damage risk, especially for hail belt locations.

## Current Prototype

The dashboard currently includes:

- City-level risk status cards
- A live-map style operations view
- Sample warnings for hail, strong wind, heavy rain, snow and other damaging weather
- Lead-time windows such as `42 min`, `1 hr 15 min`, and `3 hr 20 min`
- Source health panels for SAWS/AfriGIS, Windy, AccuWeather, Yr and Meteoblue-style feeds
- Email recipient routing for Branch Managers and the Risk team
- First-pass alert rules for severe weather thresholds

The current weather data is representative sample data. It is not connected to live weather APIs yet.

## Intended Alert Logic

Warnings should be created when any monitored city meets one or more of these conditions:

- Hail risk within 60 minutes
- Storm cell within roughly 30 km of the city
- Strong wind or damaging gust threshold is reached
- Heavy rain or flooding risk is detected
- Snow or ice warning affects the city operating window
- SAWS orange or red warning applies to the monitored city

No escalation workflow is included in the MVP.

## Planned Data Sources

Likely production integrations:

- SA Weather Service warnings, potentially via AfriGIS warning feeds
- AccuWeather Alerts API
- Windy Point Forecast API
- Yr / MET Norway Locationforecast API
- Meteoblue forecast or warning data

API credentials, terms of use and commercial permissions still need to be confirmed before production use.

## Alert Channel

The first requested alert channel is email.

Expected recipients:

- Branch Managers for the affected city
- National or regional Risk team

Future versions can add SMS, WhatsApp, Teams, Slack, acknowledgement workflows, or escalation rules.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

Note: the generated UI scaffold currently has some lint findings in unused component primitives. The app-specific files were checked separately and passed lint.

## Deployment

The prototype was published privately with Sites:

https://avis-weather-risk-monitor.uzamazulu.chatgpt.site

Because the deployment is private, access may require sign-in.

## Next Steps

1. Confirm the exact AVIS branch email groups and city ownership.
2. Decide whether city-level monitoring is enough for MVP, or whether exact branch coordinates are needed.
3. Obtain API access for the selected weather providers.
4. Replace sample warning data with live source adapters.
5. Add scheduled polling and email sending.
6. Add an audit log of sent warnings.
