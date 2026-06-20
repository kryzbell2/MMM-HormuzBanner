# MMM-HormuzBanner

MagicMirror module diagnostic checkpoint.

This module fetches and parses Strait of Hormuz shipping status server-side:

```text
HORMUZ: <STATUS> · 24H PASSED: <COUNT> · WAITING: <COUNT>
```

It includes a conservative refresh timer and minimal CSS that stays in MagicMirror's normal layout flow.

## Install

Clone or copy this module into your MagicMirror modules directory:

```bash
cd ~/MagicMirror/modules
git clone <your-repo-url> MMM-HormuzBanner
```

No npm install step is required.

## Configuration

Add the module to `~/MagicMirror/config/config.js`:

```js
{
	module: "MMM-HormuzBanner",
	position: "top_bar",
	config: {
		sourceUrl: "https://hormuzstraitmonitor.com/",
		updateInterval: 60 * 60 * 1000,
		title: "HORMUZ",
		message: "Loading",
		labels: {
			passed24h: "24H PASSED",
			waiting: "WAITING",
			updated: "UPDATED"
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
| `sourceUrl` | `https://hormuzstraitmonitor.com/` | URL fetched once by `node_helper.js`. |
| `updateInterval` | `60 * 60 * 1000` | Refresh interval in milliseconds. Values below 5 minutes are raised to 5 minutes. |
| `title` | `HORMUZ` | Text before the colon. |
| `message` | `Loading` | Temporary text shown before helper data arrives. |
| `labels` | See example | Custom labels for displayed fields. |
| `show` | See example | Row visibility for `status`, `passed24h`, `waiting`, and `updated`. |

## Test Plan

1. Put this module before several known-good modules in `config.js`.
2. Restart MagicMirror.
3. Confirm that the Hormuz line displays parsed fields or `Unknown`.
4. Confirm that modules listed after `MMM-HormuzBanner` also appear.
5. If the mirror stops after this module, the problem is in repeated updates or config-driven rendering, not CSS.

## CSS Safety Notes

The stylesheet intentionally avoids `position: fixed`, `position: absolute`, `100vw`, opaque backgrounds, and viewport-height rules. For a full-width banner, use `position: "top_bar"` in MagicMirror config instead of forcing layout in CSS.

Status text is colored by parsed state: `OPEN` is green, `CLOSED` is red, and `RESTRICTED` is orange.

## Test

From the module directory, run:

```bash
node --check MMM-HormuzBanner.js
node --check node_helper.js
git diff --check
```
