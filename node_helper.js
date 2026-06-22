/* MagicMirror2 Module Helper: MMM-HormuzBanner */
const NodeHelper = require("node_helper");
const http = require("http");
const https = require("https");
const { URL } = require("url");

module.exports = NodeHelper.create({
	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_FETCH") {
			return;
		}

		this.fetchStatus(payload && payload.sourceUrl);
	},

	fetchStatus: function (sourceUrl) {
		const fetchedAt = new Date().toISOString();

		this.fetchDashboardApi()
			.then((dashboard) => this.parseDashboardApi(dashboard))
			.catch((apiError) => {
				console.error("MMM-HormuzBanner API fetch failed, falling back to homepage:", apiError.message);
				return this.fetchPage(sourceUrl || "https://hormuzstraitmonitor.com/")
					.then((html) => this.parseHormuzPage(html));
			})
			.then((payload) => {
				this.sendSocketNotification("MMM_HORMUZBANNER_DATA", {
					...payload,
					updated: fetchedAt,
					error: null
				});
			})
			.catch((error) => {
				console.error("MMM-HormuzBanner fetch failed:", error.message);
				this.sendSocketNotification("MMM_HORMUZBANNER_DATA", {
					status: "Unknown",
					passed24h: "Unknown",
					waiting: "Unknown",
					updated: fetchedAt,
					error: error.message
				});
			});
	},

	fetchDashboardApi: function () {
		return this.fetchPage("https://hormuzstraitmonitor.com/api/dashboard")
			.then((body) => {
				try {
					return JSON.parse(body);
				} catch (error) {
					throw new Error("Invalid dashboard JSON");
				}
			});
	},

	fetchPage: function (sourceUrl) {
		return new Promise((resolve, reject) => {
			let requestUrl;

			try {
				requestUrl = new URL(sourceUrl);
			} catch (error) {
				reject(new Error("Invalid sourceUrl"));
				return;
			}

			const transport = requestUrl.protocol === "http:" ? http : https;
			const request = transport.get(requestUrl, {
				headers: {
					"User-Agent": "MMM-HormuzBanner/diagnostic"
				},
				timeout: 30000
			}, (response) => {
				if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
					response.resume();
					this.fetchPage(new URL(response.headers.location, requestUrl).toString())
						.then(resolve)
						.catch(reject);
					return;
				}

				if (response.statusCode < 200 || response.statusCode >= 300) {
					response.resume();
					reject(new Error("HTTP " + response.statusCode));
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
				request.destroy(new Error("Fetch timeout"));
			});
			request.on("error", reject);
		});
	},

	parseHormuzPage: function (html) {
		const text = this.normalizeText(this.htmlToText(html || ""));

		return {
			status: this.extractStatus(text) || "Unknown",
			passed24h: this.extractPassed24h(text) || "Unknown",
			waiting: this.extractWaiting(text) || "Unknown"
		};
	},

	parseDashboardApi: function (dashboard) {
		if (!dashboard || dashboard.success !== true || !dashboard.data) {
			throw new Error("Unexpected dashboard API response");
		}

		const data = dashboard.data;
		if (!data.straitStatus || !data.shipCount || !data.strandedVessels) {
			throw new Error("Missing dashboard API data");
		}

		if (typeof data.straitStatus.status !== "string" || data.shipCount.last24h === undefined || data.strandedVessels.total === undefined) {
			throw new Error("Missing dashboard API metrics");
		}

		const waiting = Number(data.strandedVessels.total) === 0 ? "Data not available" : String(data.strandedVessels.total);

		return {
			status: this.normalizeStatus(data.straitStatus.status),
			passed24h: String(data.shipCount.last24h),
			waiting: waiting
		};
	},

	htmlToText: function (html) {
		return html
			.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
			.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
			.replace(/<[^>]+>/g, " ")
			.replace(/&nbsp;/gi, " ")
			.replace(/&amp;/gi, "&")
			.replace(/&quot;/gi, "\"")
			.replace(/&#39;|&apos;/gi, "'")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">");
	},

	normalizeText: function (text) {
		return text.replace(/\s+/g, " ").trim();
	},

	extractStatus: function (text) {
		return this.firstMatch(text, [
			/currently\s+(OPEN|CLOSED|RESTRICTED)/i,
			/status[:\s]+(open|closed|restricted)/i
		], this.normalizeStatus);
	},

	extractPassed24h: function (text) {
		const directTransit = this.firstMatch(text, [
			/(?:ships?\s+transiting|transits?)\s*[:=]\s*(near zero|zero|n\/a|\d+\+?)/i
		], this.normalizeTransitMetric);

		if (directTransit) {
			return directTransit;
		}

		return this.firstMatch(text, [
			/(?:last|past)\s+24\s*(?:hours?|hrs?).{0,80}?(?:ships?|vessels?)\s+(?:transiting|passed|crossings?)[^0-9a-z+]*(\d+|near zero|zero|[0-9]+\+)/i,
			/(?:ships?|vessels?)\s+(?:transiting|passed|crossings?).{0,80}?(?:last|past)\s+24\s*(?:hours?|hrs?)[^0-9a-z+]*(\d+|near zero|zero|[0-9]+\+)/i,
			/(\d+|near zero|zero|[0-9]+\+)\s+(?:ships?|vessels?).{0,80}?(?:last|past)\s+24\s*(?:hours?|hrs?)/i,
			/ships?\s+(?:transiting|passed|crossings?)[^0-9]*(\d+|near zero|zero|[0-9]+\+)/i,
			/(\d+|near zero|zero|[0-9]+\+)\s+(?:ships?|vessels?).{0,50}?(?:transiting|passed|crossings?)/i
		], this.normalizeMetric);
	},

	extractWaiting: function (text) {
		const directWaiting = this.firstMatch(text, [
			/(?:vessels?\s+waiting|waiting\s+vessels?)\s*[:=]\s*(n\/a|none|unknown|near zero|zero|\d+\+?)/i
		], this.normalizeAvailabilityMetric);

		if (directWaiting) {
			return directWaiting;
		}

		return this.firstMatch(text, [
			/(?:waiting)\s+vessels?[^0-9]*(\d+|[0-9]+\+)/i,
			/(?:stranded)\s+vessels?[^0-9]*(\d+|[0-9]+\+)/i,
			/(\d+|[0-9]+\+)\s+(?:ships|vessels).{0,40}(?:waiting|stranded)/i
		], this.normalizeMetric);
	},

	firstMatch: function (text, patterns, formatter) {
		for (const pattern of patterns) {
			const match = text.match(pattern);
			if (match && match[1]) {
				return formatter.call(this, match[1]);
			}
		}

		return null;
	},

	normalizeStatus: function (value) {
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
	},

	normalizeTransitMetric: function (value) {
		const metric = String(value).trim();

		if (/^(near zero|zero)$/i.test(metric)) {
			return "0";
		}

		if (/^n\/a$/i.test(metric)) {
			return "N/A";
		}

		return metric;
	},

	normalizeAvailabilityMetric: function (value) {
		const metric = String(value).trim();

		if (/^n\/a$/i.test(metric)) {
			return "N/A";
		}

		if (/^none$/i.test(metric)) {
			return "None";
		}

		if (/^unknown$/i.test(metric)) {
			return "Unknown";
		}

		if (/^near zero$/i.test(metric)) {
			return "Near zero";
		}

		if (/^zero$/i.test(metric)) {
			return "0";
		}

		return metric;
	}
});
