function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCaretCharacterOffsetWithin(element) {
	var caretOffset = 0;
	var doc = element.ownerDocument || element.document;
	var win = doc.defaultView || doc.parentWindow;
	var sel;
	if (typeof win.getSelection != "undefined") {
		sel = win.getSelection();
		if (sel.rangeCount > 0) {
			var range = win.getSelection().getRangeAt(0);
			var preCaretRange = range.cloneRange();
			preCaretRange.selectNodeContents(element);
			preCaretRange.setEnd(range.endContainer, range.endOffset);
			caretOffset = preCaretRange.toString().length;
		}
	} else if ((sel = doc.selection) && sel.type != "Control") {
		var textRange = sel.createRange();
		var preCaretTextRange = doc.body.createTextRange();
		preCaretTextRange.moveToElementText(element);
		preCaretTextRange.setEndPoint("EndToEnd", textRange);
		caretOffset = preCaretTextRange.text.length;
	}
	return caretOffset;
}

function removeEntity(identifier) {
	$('[data-entity-id-marked="' + identifier + '"]')[0].outerHTML = $('[data-entity-id-marked="' + identifier + '"]')[0].innerHTML;
	$('[data-entity-id-JSON="' + identifier + '"]')[0].outerHTML = "";
	updateStats();
}

function updateStats() {
	var remaining = $("#raw-data-div .raw-data-row").length;
	var completedRaw = localStorage.getItem("spacy-annotation-completed-data") || "";
	var completed = completedRaw.split("<br/>").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; }).length;
	$("#stat-remaining").text(remaining + (remaining === 1 ? " sentence remaining" : " sentences remaining"));
	$("#stat-completed").text(completed + (completed === 1 ? " sentence completed" : " sentences completed"));
}

function RefreshData() {
	var annotationRawData = localStorage.getItem("spacy-annotation-raw-data");
	if (annotationRawData == null) {
		localStorage.setItem("spacy-annotation-raw-data", "");
		annotationRawData = "";
	}
	var annotationCompletedData = localStorage.getItem("spacy-annotation-completed-data");
	if (annotationCompletedData == null) {
		localStorage.setItem("spacy-annotation-completed-data", "");
		annotationCompletedData = "";
	}
	var numberOfSamples = localStorage.getItem("spacy-annotation-sample-count");
	if (numberOfSamples == null || numberOfSamples == 0) {
		localStorage.setItem("spacy-annotation-sample-count", "");
		numberOfSamples = 1;
	}
	$("#raw-data-div").html(annotationRawData);
	var remainingSampleData = $("#raw-data-div div").length;
	$("#completion-percent").attr("value", (numberOfSamples - remainingSampleData) / numberOfSamples * 100);
	$("#progress-label").text(Math.round((numberOfSamples - remainingSampleData) / numberOfSamples * 100) + "%");
	$("#annotation-text").html($(".raw-data-row:first-child").html());
	$("#completed-data-div").html(annotationCompletedData);
	$("#annotation-ner").html(localStorage.getItem("spacy-annotation-entity-names"));
	reindexEntityShortcuts();

	if (remainingSampleData > 0) {
		$("#sentence-position-hint").text("Sentence " + (numberOfSamples - remainingSampleData + 1) + " of " + numberOfSamples);
	} else {
		$("#sentence-position-hint").text("No sentences queued — paste raw data below");
	}

	updateStats();
}

function prepareJSONData() {
	var annotationSentence = $(".raw-data-row:first-child").html();
	var entities = [];
	$("#JSON-out .entity-json-item").each(function () {
		var start = $(this).data("start");
		var end = $(this).data("end");
		var label = $(this).data("label");
		entities.push("(" + start + "," + end + ",\"" + label + "\")");
	});
	return "(\"" + annotationSentence + "\",{\"entities\":[" + entities.join(",") + "]}),";
}

var SHORTCUT_ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function reindexEntityShortcuts() {
	$("#annotation-ner .ner-button").each(function (index) {
		var $chip = $(this);
		var $badge = $chip.find(".ner-button-key");
		if (index < SHORTCUT_ALPHABET.length) {
			var key = SHORTCUT_ALPHABET[index];
			$chip.attr("data-shortcut-key", key);
			if ($badge.length) {
				$badge.text(key);
			} else {
				$chip.prepend("<span class='ner-button-key'>" + key + "</span>");
			}
		} else {
			$chip.removeAttr("data-shortcut-key");
			$badge.remove();
		}
	});
}

function addEntityLabel(name) {
	var id = Math.round(Math.random() * 1000000000000).toString();
	var color = "rgb(" + getRandomInt(140, 255) + "," + getRandomInt(140, 255) + "," + getRandomInt(140, 255) + ")";
	var chip = "<span class='ner-button' data-label-id='" + id + "' data-color='" + color + "' style='--chip-color:" + color + "'>" +
		"<span class='ner-button-text'>" + name + "</span>" +
		"<button type='button' class='chip-remove' data-label-id='" + id + "' aria-label='Remove label' title='Remove label'>&times;</button>" +
		"</span>";
	$("#annotation-ner").append(chip);
	reindexEntityShortcuts();
	localStorage.setItem("spacy-annotation-entity-names", $("#annotation-ner").html());
	updateStats();
}

function applyEntityChip(chipEl) {
	var entityText = window.getSelection().toString();
	if (!entityText) return;
	var $chip = $(chipEl);
	var entityTextLength = entityText.length;
	var entityType = $chip.find(".ner-button-text").length
		? $chip.find(".ner-button-text").text()
		: $chip.clone().find(".chip-remove, .ner-button-key").remove().end().text().trim();
	var chipColor = chipEl.dataset.color || chipEl.style.backgroundColor;
	var sel = window.getSelection();
	if (!sel.rangeCount) return;
	var entityID = Math.round(Math.random() * 1000000000000).toString();
	var caretPos = getCaretCharacterOffsetWithin(document.getElementById("annotation-text"));
	var nodeText = "<span class='ner-span' data-entity-id-marked='" + entityID + "' style='background-color:" + chipColor + "'>" + entityText + "</span>";
	document.execCommand("insertHTML", false, nodeText);

	var entityStartPosition = caretPos - entityTextLength;
	var entityEndPosition = caretPos;
	$("#JSON-out").append(
		"<div data-entity-id-JSON='" + entityID + "' class='entity-json-item' data-start='" + entityStartPosition + "' data-end='" + entityEndPosition + "' data-label=\"" + entityType + "\" style='--chip-color:" + chipColor + "'>" +
		"<span class='entity-json-label' style='background-color:" + chipColor + "'>" + entityType + "</span>" +
		"<span class='entity-json-text'>" + entityText + "</span>" +
		"<span class='entity-json-pos'>(" + entityStartPosition + ", " + entityEndPosition + ")</span>" +
		"<button type='button' class='JSONdelete' data-entity-id-jsonx='" + entityID + "' aria-label='Remove entity' title='Remove entity'>&times;</button>" +
		"</div>"
	);
}

function showToast(message) {
	var $toast = $("<div class='toast'></div>").text(message).appendTo("body");
	requestAnimationFrame(function () { $toast.addClass("show"); });
	setTimeout(function () {
		$toast.removeClass("show");
		setTimeout(function () { $toast.remove(); }, 300);
	}, 1800);
}

function loadRawData(rawText) {
	var rawDataArray = rawText.split("\n");
	var numberOfSamples = rawDataArray.length;
	localStorage.setItem("spacy-annotation-sample-count", numberOfSamples);
	var preparedRawData = "";
	rawDataArray.forEach(function (rawData) {
		preparedRawData += "<div class = 'raw-data-row'>" + rawData.replace(/[^\x00-\x7F]/g, "").replace(/\"/g, "") + "</div>";
	});
	localStorage.setItem("spacy-annotation-raw-data", preparedRawData);
	$("#raw-data-div").html(localStorage.getItem("spacy-annotation-raw-data"));
	RefreshData();
}

function getCompletedDataAsText() {
	var html = localStorage.getItem("spacy-annotation-completed-data") || "";
	return html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, "\"")
		.replace(/&#39;/g, "'")
		.trim();
}

function downloadTextFile(filename, text) {
	var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
	var url = URL.createObjectURL(blob);
	var $link = $("<a></a>").attr({ href: url, download: filename }).appendTo("body");
	$link[0].click();
	$link.remove();
	setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

$(document).ready(function () {
	RefreshData();

	if (localStorage.getItem("spacy-annotation-info-dismissed") === "1") {
		$("#info-banner").hide();
	}
	$("#info-banner-dismiss").on("click", function () {
		localStorage.setItem("spacy-annotation-info-dismissed", "1");
		$("#info-banner").fadeOut(150);
	});

	function tryAddEntity() {
		var value = $("#add-entity-value").val().trim();
		if (!value) return;
		addEntityLabel(value);
		$("#add-entity-value").val("").focus();
	}
	$("#add-entity-button").on("click", tryAddEntity);
	$("#add-entity-value").on("keydown", function (e) {
		if (e.key === "Enter") { e.preventDefault(); tryAddEntity(); }
	});

	$(document).on("click", ".chip-remove", function (e) {
		e.preventDefault();
		e.stopPropagation();
		$(this).closest(".ner-button").remove();
		reindexEntityShortcuts();
		localStorage.setItem("spacy-annotation-entity-names", $("#annotation-ner").html());
		updateStats();
	});

	$(document).on("click", ".ner-button", function (e) {
		if ($(e.target).closest(".chip-remove").length) return;
		applyEntityChip(this);
	});

	$(document).on("keydown", function (e) {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		if ($(document.activeElement).is("input, textarea")) return;
		var key = e.key ? e.key.toLowerCase() : "";
		if (!/^[a-z]$/.test(key)) return;
		var sel = window.getSelection();
		if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
		var annotationTextEl = document.getElementById("annotation-text");
		if (!$.contains(annotationTextEl, sel.anchorNode) && sel.anchorNode !== annotationTextEl) return;
		var $chip = $("#annotation-ner .ner-button[data-shortcut-key='" + key + "']");
		if (!$chip.length) return;
		e.preventDefault();
		applyEntityChip($chip[0]);
	});

	$(document).on("dblclick", ".ner-span", function () {
		removeEntity($(this).data("entity-id-marked"));
	});
	$(document).on("click", ".JSONdelete", function () {
		removeEntity($(this).data("entity-id-jsonx"));
	});

	$(document).on("mouseenter", ".entity-json-item", function () {
		$("[data-entity-id-marked='" + $(this).data("entity-id-json") + "']").addClass("ner-span-highlight");
	});
	$(document).on("mouseleave", ".entity-json-item", function () {
		$("[data-entity-id-marked='" + $(this).data("entity-id-json") + "']").removeClass("ner-span-highlight");
	});

	$("#raw-data-div").bind("paste", function (e) {
		var pastedData = e.originalEvent.clipboardData.getData("text");
		e.preventDefault();
		loadRawData(pastedData);
	});

	$("#raw-upload-button").on("click", function () {
		$("#raw-upload-input").trigger("click");
	});
	$("#raw-upload-input").on("change", function (e) {
		var file = e.target.files && e.target.files[0];
		if (!file) return;
		var reader = new FileReader();
		reader.onload = function (evt) {
			loadRawData(evt.target.result);
			showToast("Loaded " + file.name);
		};
		reader.readAsText(file);
		$(this).val("");
	});

	$("#mark-complete-button").on("click", function () {
		if (!$(".raw-data-row").length) return;
		var annotationCompletedData = localStorage.getItem("spacy-annotation-completed-data");
		localStorage.setItem("spacy-annotation-completed-data", prepareJSONData() + "<br/>" + annotationCompletedData);
		$(".raw-data-row:first-child").remove();
		$("#JSON-out").html("");
		var updatedRawData = $("#raw-data-div").html();
		localStorage.setItem("spacy-annotation-raw-data", updatedRawData);
		RefreshData();
	});

	$("#clear-raw").on("click", function () {
		localStorage.setItem("spacy-annotation-raw-data", "");
		RefreshData();
	});
	$("#clear-completed").on("click", function () {
		localStorage.setItem("spacy-annotation-completed-data", "");
		RefreshData();
	});
	$("#clear-entity-button").on("click", function () {
		localStorage.setItem("spacy-annotation-entity-names", "");
		RefreshData();
	});

	$("#copy-completed-button").on("click", function () {
		var text = getCompletedDataAsText();
		if (!text) return;
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(function () { showToast("Copied to clipboard"); });
		} else {
			var range = document.createRange();
			range.selectNodeContents(document.getElementById("completed-data-div"));
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			document.execCommand("copy");
			sel.removeAllRanges();
			showToast("Copied to clipboard");
		}
	});

	$("#download-completed-button").on("click", function () {
		var text = getCompletedDataAsText();
		if (!text) return;
		downloadTextFile("spacy-annotations.txt", text);
		showToast("Downloaded spacy-annotations.txt");
	});

	$("#annotation-text").keypress(function (e) {
		e.preventDefault();
	});
});
