/*
 * updateBadges([ ["", ""], ["", ""], ["", ""] ])
 *
 */
function updateBadges(badgeData) {
	const badgeElements = document.querySelectorAll('.badges .badge');

	badgeData.forEach((item, index) => {
		if (!badgeElements[index]) return;

		var [label, value, unit] = item;

		unit = unit === undefined ? '' : unit;

		badgeElements[index].innerHTML = `
			${label}: <span>${value}</span>${unit}
		`;
	});
}

function updateCard(index, data) {
	const cards = document.querySelectorAll('.grid .card');
	const card = cards[index];

	if (!card) return;

	card.style.borderColor = "";

	// If this is a progress-style card
	if (data.progress !== undefined) {
		const highlightColor = data.highlight
			? `var(--card-border-${data.highlight})`
			: "";

		if (highlightColor) {
			card.style.borderColor = highlightColor;
		}

		card.innerHTML = `
			<div class="card-header">
				<div class="card-title-left">${data.title}</div>
				<div class="card-value-right">${data.main}</div>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" 
					 style="width: ${data.progress}%; 
							background: var(--progress-${data.progress_highlight || 'other'});">
				</div>
			</div>
			<div class="card-note">${data.note}</div>
		`;

	} else {
		card.innerHTML = `
			<div class="card-title">${data.title}</div>
			<div class="card-main">${data.main}</div>
			<div class="card-note">${data.note}</div>
		`;
	}
}

function updateSeverityCounts({ mild, severe, critical }) {
	const gridItem = document.getElementById("severity-grid-item");

	const titles = gridItem.querySelectorAll(".card-title-left");
	const values = gridItem.querySelectorAll(".card-value-right");
	const progressFills = gridItem.querySelectorAll(".progress-fill");

	const total = mild + severe + critical;

	const data = [
		{ label: "Mild", value: mild },
		{ label: "Severe", value: severe },
		{ label: "Critical", value: critical }
	];

	data.forEach((item, index) => {
		// Set number
		values[index].textContent = item.value;

		// Calculate percentage
		const percentage = total > 0 ? ((item.value / total) * 100) : 0;

		// Set progress bar width
		progressFills[index].style.width = percentage.toFixed(1) + "%";
	});
}

// export { updateBadges, updateCard };

var sample_data = {"inputs": { "population": 3168000, "magnitude": 6, "distance_km": 30, "depth_km": 10, "collapse_pct": 2 }, "seismic": { "hypocentral_distance_km":31.575306, "pga_g": 0.0311057823510973, "expected_injured": 2065 }, "medical": { "orthopedic_patients": 1797, "orthopedic_distribution": { "fractures": 1168, "crush_injury": 234, "compartment_syndrome": 137, "major_soft_tissue": 131, "crush_syndrome": 127 }, "severity": { "mild": 584, "severe": 949, "critical": 264 }, "resources": { "surgeries": 1436, "icu_beds": 311, "dialysis": 127 } } }

function formatNumber(value, decimals = 0) {
	return decimals > 0 ? value.toLocaleString("en-US", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals })
		: value.toLocaleString("en-US");
}

function buildBadgesArray(data) {
	const inputs = data?.inputs || {};
	const result = [];

	if (inputs.magnitude != null) {
	result.push(["M", String(inputs.magnitude)]);
	}

	if (inputs.population != null) {
	result.push(["Population", formatNumber(inputs.population)]);
	}

	if (inputs.distance_km != null) {
	result.push(["Distance", formatNumber(inputs.distance_km), "km"]);
	}

	if (inputs.depth_km != null) {
	result.push(["Depth", formatNumber(inputs.depth_km), "km"]);
	}

	if (inputs.collapse_pct != null) {
	result.push(["Collapse", formatNumber(inputs.collapse_pct), "%"]);
	}

	return result;
}

function buildSeismicArray(data) {
	const seismic = data?.seismic || {};
	const result = [];

	if (seismic.hypocentral_distance_km != null) {
		result.push({
			title: "Hypocentral Distance",
			main: formatNumber(seismic.hypocentral_distance_km, 1),
			note: "km"
		});
	}

	if (seismic.pga_g != null) {
		result.push({
			title: "Computed PGA",
			main: formatNumber(seismic.pga_g, 3),
			note: "g"
		});
	}

	if (seismic.expected_injured != null) {
		result.push({
			title: "Expected Injured",
			main: formatNumber(seismic.expected_injured),
			note: "people"
		});
	}

	return result;
}

function buildOrthopedicDistribution(data) {
	const medical = data?.medical || {};
	const total = medical.orthopedic_patients;
	const distribution = medical.orthopedic_distribution || {};
	return buildDistribution(total, distribution);
}

function buildDistribution(total, distribution) {
	if (!total) return [];

	const result = [];

	Object.entries(distribution).forEach(([key, value]) => {
		if (value == null) return;
	
		const percent = Math.round((value / total) * 100);
	
		// Convert snake_case to Title Case
		const title = key
			.replace(/_/g, " ")
			.replace(/\b\w/g, c => c.toUpperCase());
	
		result.push({
			title,
			main: formatNumber(value),
			progress: percent,
			progress_highlight: "other"
		});
	});

	return result;
}

function updateAll() {
	updateBadges(buildBadgesArray(sample_data));
	var topCards = buildSeismicArray(sample_data);
	updateCard(0, topCards[0]);
	updateCard(1, topCards[1]);
	updateCard(2, topCards[2]);
}
