# Stock Notifications

## What it is

An Extend app that shows Workday's current stock price (WDAY) on a home page card. An orchestration calls an external stock quote API, then writes the ticker, price, and timestamp into a Workday business object through the Workday REST API so the card can render the latest value.

## What's inside

- `appManifest.json`, `presentation/` — the Extend app shell (site and app manifest)
- `cards/stockInfo.carddefinition` — the home page card that displays the stock price
- `model/StockInfo.businessobject` and `model/StockSecurityDomain.securitydomain` — the business object that stores the ticker, price, and last-updated fields
- `orchestration/StockRetrieval.orchestration` — fetches the quote from an external API and posts it into the `StockInfo` business object via the Workday API

## How to use it

1. Deploy the app source to your WCP development tenant (App Builder, the IDE plugins, or the WDCLI), then install and launch it.
2. Import `orchestration/StockRetrieval.orchestration` in Orchestration Builder and update the `SendHTTPRequest` node's URL to point at your own stock quote API.
3. The orchestration authenticates to that external API with a Basic Auth credential named `onrender`. Replace the placeholder `YOUR_USERNAME` / `YOUR_PASSWORD` values with your own credential — never commit real ones.
4. Deploy the orchestration to your tenant, then run it (or schedule it) to keep the `StockInfo` record fresh.
5. Launch the app; the `stockInfo` card reads from the `StockInfo` business object and shows the latest price.
