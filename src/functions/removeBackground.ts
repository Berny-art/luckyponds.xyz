export const removeBackgroundFromSvg = (svgText: string): string => {
	const parser = new DOMParser();
	const doc = parser.parseFromString(svgText, "image/svg+xml");

	// Remove background <rect>
	for (const rect of doc.querySelectorAll('rect[fill="#12221F"]')) {
		rect.remove();
	}

	// Remove background properties from <style>
	const styleTag = doc.querySelector("style");
	if (styleTag) {
		if (styleTag.textContent) {
			styleTag.textContent = styleTag.textContent.replace(
				/background[^;]+;/g,
				"",
			);
		}
	}

	// Serialize back to string
	return new XMLSerializer().serializeToString(doc.documentElement);
};
