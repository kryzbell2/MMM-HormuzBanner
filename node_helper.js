/* MagicMirror2 Module Helper: MMM-HormuzBanner */
const NodeHelper = require("node_helper");
const Log = require("logger");
const http = require("http");
const https = require("https");
const { URL } = require("url");

module.exports = NodeHelper.create({
	start: function () {
		this.fetching = false;
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_FETCH") {
			return;
		}

		this.fetchStatus(payload && payload.sourceUrl);
	},

	fetchStatus: async function (sourceUrl) {
		if (this.fetching) {
			return;
		}

		this.fetching = true;

		try {
			const html = await this.fetchPage(sourceUrl || "https://hormuzstraitmonitor.com/");
			const parsed = this.parseHormuzPage(html);

			this.sendSocketNotification("MMM_HORMUZBANNER_DATA", {
				...parsed,
				updated: new Date().toISOString(),
				error: null
			});
		} catch (error) {
			Log.error(`MMM-HormuzBanner: ${error.message}`);
			this.sendSocketNotification("MMM_HORMUZBANNER_DATA", {
				status: "unavailable",
				passed24h: "Unknown",
				waiting: "Unknown",
				updated: new Date().toISOString(),
				error: error.message
			});
		} finally {
			this.fetching = false;
		}
	},

	fetchPage: function (sourceUrl) {
		return new Promise((resolve, reject) => {
			let requestUrl;

			try {
				requestUrl = new URL(sourceUrl);
			} catch (error) {
				reject(new Error(`Invalid sourceUrl: ${sourceUrl}`));
				return;
			}

			const transport = requestUrl.protocol === "http:" ? http : https;
			const request = transport.get(requestUrl, {
				headers: {
					"User-Agent": "MMM-HormuzBanner/1.0 (+https://magicmirror.builders/)"
				},
				timeout: 30000
			}, (response) => {
				if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
					response.resume();
					resolve(this.fetchPage(new URL(response.headers.location, requestUrl).toString()));
					return;
				}

				if (response.statusCode < 200 || response.statusCode >= 300) {
					response.resume();
					reject(new Error(`HTTP ${response.statusCode} from ${requestUrl.href}`));
					return;
				}

				let body = "";
				response.setEncoding("utf8");
				response.on("data", (chunk) => {
					body += chunk;
				});
				response.on("end", () => resolve(body));
			});

			request.on("timeout", () => {
				request.destroy(new Error(`Timeout fetching ${requestUrl.href}`));
			});
			request.on("error", reject);
		});
	},

	parseHormuzPage: function (html) {
		const text = this.normalizeText(this.htmlToText(html || ""));
		const status = this.extractStatus(text);

		return {
			status: status || "Unknown",
			passed24h: this.extractPassed24h(text) || "Unknown",
			waiting: this.extractWaiting(text) || "Unknown"
		};
	},

	htmlToText: function (html) {
		return html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
			.replace(/<[^>]+>/g, " ")
			.replace(/&nbsp;/gi, " ")
			.replace(/&amp;/gi, "&")
			.replace(/&quot;/gi, '"')
			.replace(/&#39;|&apos;/gi, "'")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">");
	},

	normalizeText: function (text) {
		return text.replace(/\s+/g, " ").trim();
	},

	extractStatus: function (text) {
		const patterns = [
			/currently\s+(OPEN|CLOSED|RESTRICTED)/i,
			/status[:\s]+(open|closed|restricted)/i
		];

		return this.firstMatch(text, patterns, 1, this.titleCaseStatus);
	},

	extractPassed24h: function (text) {
		const twentyFourHourPatterns = [
			/(?:last|past)\s+24\s*(?:hours?|hrs?).{0,80}?(?:ships?|vessels?)\s+(?:transiting|passed|crossings?)[^0-9a-z+]*(\d+|near zero|zero|[0-9]+\+)/i,
			/(?:ships?|vessels?)\s+(?:transiting|passed|crossings?).{0,80}?(?:last|past)\s+24\s*(?:hours?|hrs?)[^0-9a-z+]*(\d+|near zero|zero|[0-9]+\+)/i,
			/(\d+|near zero|zero|[0-9]+\+)\s+(?:ships?|vessels?).{0,80}?(?:last|past)\s+24\s*(?:hours?|hrs?)/i
		];
		const fallbackPatterns = [
			/ships?\s+(?:transiting|passed|crossings?)[^0-9]*(\d+|near zero|zero|[0-9]+\+)/i,
			/(\d+|near zero|zero|[0-9]+\+)\s+(?:ships?|vessels?).{0,50}?(?:transiting|passed|crossings?)/i
		];

		return this.firstMatch(text, twentyFourHourPatterns, 1, this.normalizeMetric) ||
			this.firstMatch(text, fallbackPatterns, 1, this.normalizeMetric);
	},

	extractWaiting: function (text) {
		const patterns = [
			/(?:waiting)\s+vessels?[^0-9]*(\d+|[0-9]+\+)/i,
			/(?:stranded)\s+vessels?[^0-9]*(\d+|[0-9]+\+)/i,
			/(\d+|[0-9]+\+)\s+(?:ships|vessels).{0,40}(?:waiting|stranded)/i
		];

		return this.firstMatch(text, patterns, 1, this.normalizeMetric);
	},

	firstMatch: function (text, patterns, groupIndex, formatter) {
		for (const pattern of patterns) {
			const match = text.match(pattern);
			if (match && match[groupIndex]) {
				return formatter.call(this, match[groupIndex]);
			}
		}

		return null;
	},

	titleCaseStatus: function (value) {
		const status = String(value).toUpperCase();
		if (status === "OPEN" || status === "CLOSED" || status === "RESTRICTED") {
			return status;
		}

		return "Unknown";
	},

	normalizeMetric: function (value) {
		const metric = String(value).trim();

		if (/^near zero$/i.test(metric)) {
			return "Near zero";
		}

		if (/^zero$/i.test(metric)) {
			return "0";
		}

		return metric;
	}
});
