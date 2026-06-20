/* MagicMirror2 Module: MMM-HormuzBanner */
Module.register("MMM-HormuzBanner", {
	defaults: {
		title: "HORMUZ",
		message: "TEST"
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = "small bright";
		wrapper.textContent = this.config.title + ": " + this.config.message;
		return wrapper;
	}
});
