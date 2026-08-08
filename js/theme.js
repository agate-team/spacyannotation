(function () {
	var STORAGE_KEY = "spacy-annotation-theme";

	function applyTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);
		try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
		var btn = document.getElementById("theme-toggle");
		if (btn) btn.setAttribute("aria-pressed", theme === "dark");
	}

	document.addEventListener("DOMContentLoaded", function () {
		var btn = document.getElementById("theme-toggle");
		if (!btn) return;
		var current = document.documentElement.getAttribute("data-theme") || "light";
		btn.setAttribute("aria-pressed", current === "dark");
		btn.addEventListener("click", function () {
			var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
			applyTheme(next);
		});
	});
})();
