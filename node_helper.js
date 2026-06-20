/* MagicMirror2 Module Helper: MMM-HormuzBanner */
const NodeHelper = require("node_helper");
const http = require("http");
const https = require("https");
const { URL } = require("url");

module.exports = NodeHelper.create({
	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_FETCH_TEST") {
			return;
		}

		this.fetchTest(payload && payload.sourceUrl);
	},

	fetchTest: function (sourceUrl) {
		this.fetchPage(sourceUrl || "https://hormuzstraitmonitor.com/")
			.then(() => {
				this.sendSocketNotification("MMM_HORMUZBANNER_FETCH_TEST_RESULT", {
					message: "fetched"
				});
			})
			.catch((error) => {
				console.error("MMM-HormuzBanner fetch test failed:", error.message);
				this.sendSocketNotification("MMM_HORMUZBANNER_FETCH_TEST_RESULT", {
					message: "fetch failed"
				});
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

				response.resume();
				response.on("end", resolve);
			});

			request.on("timeout", () => {
				request.destroy(new Error("Fetch timeout"));
			});
			request.on("error", reject);
		});
	}
});
