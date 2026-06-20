# MMM-HormuzBanner

MagicMirror module that displays a compact Strait of Hormuz shipping status banner using server-side scraping from [hormuzstraitmonitor.com](https://hormuzstraitmonitor.com/).

Target display:

```text
HORMUZ: <STATUS> · 24H PASSED: <COUNT> · WAITING: <COUNT>
```

## Install

Clone or copy this module into your MagicMirror modules directory:

```bash
cd ~/MagicMirror/modules
git clone <your-repo-url> MMM-HormuzBanner
```

No npm install step is required. The module uses Node's built-in `http` and `https` modules.

## Configuration

Add the module to `~/MagicMirror/config/config.js`:

```js
{
	module: "MMM-HormuzBanner",
	position: "top_right",
	config: {
		sourceUrl: "https://hormuzstraitmonitor.com/",
		updateInterval: 60 * 60 * 1000,
		title: "HORMUZ",
		labels: {
			status: "Status",
			passed24h: "24H Passed",
			waiting: "Waiting",
			updated: "Updated"
		},
		show: {
			status: true,
			passed24h: true,
			waiting: true,
			updated: false
		}
	}
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `sourceUrl` | `https://hormuzstraitmonitor.com/` | Page to fetch from `node_helper.js`. |
| `updateInterval` | `60 * 60 * 1000` | Refresh interval in milliseconds. The default is 60 minutes. |
| `title` | `HORMUZ` | Banner title shown before the values. |
| `labels` | See example | Custom labels for parsed fields. |
| `show` | See example | Controls whether `status`, `passed24h`, `waiting`, and `updated` are shown. |
| `showLabels` | See defaults | Controls label visibility per field. By default, numeric fields are labeled and the status is not. A boolean is also accepted. |
| `separator` | ` · ` | Separator between visible fields. |

## Scraping Notes

This module scrapes public page text defensively, but scraping is inherently fragile. If the source site's wording or markup changes, a field may become unavailable. When that happens the module displays `Unknown` for that field instead of failing.

The 24-hour passed count tries exact 24-hour wording first. If no exact number is found, it falls back to the closest ships-transiting metric. Waiting vessels falls back to stranded vessels when waiting is unavailable.

The recommended refresh interval is 60 minutes or longer to reduce load on the source site and avoid noisy dashboard updates.

## Test

From the module directory, run:

```bash
node --check MMM-HormuzBanner.js
node --check node_helper.js
git diff --check
```

MagicMirror logs fetch or parse errors as `MMM-HormuzBanner` messages. On fetch error, the banner displays:

```text
HORMUZ: unavailable
```
