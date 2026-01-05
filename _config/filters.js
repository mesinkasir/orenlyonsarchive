import { DateTime } from "luxon";

const memoize = (fn) => {
	const cache = new Map();
	return (...args) => {
		const key = JSON.stringify(args);
		if (cache.has(key)) return cache.get(key);
		const result = fn(...args);
		cache.set(key, result);
		return result;
	};
};

export default function(eleventyConfig) {
	const readableDate = memoize((dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	const htmlDateString = memoize((dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	const limit = memoize((array, n) => {
		if(!n || n < 0) return array;
		return array.slice(0, n);
	});

	// Get the first `n` elements of a collection.
	const head = memoize((array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	const min = memoize((...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	const getKeys = memoize((target) => {
		return Object.keys(target);
	});

	const filterTagList = memoize((tags) => {
		return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
	});

	const sortAlphabetically = memoize((strings) =>
		(strings || []).sort((b, a) => b.localeCompare(a))
	);

	eleventyConfig.addFilter("readableDate", readableDate);
	eleventyConfig.addFilter("limit", limit);
	eleventyConfig.addFilter("htmlDateString", htmlDateString);
	eleventyConfig.addFilter("head", head);
	eleventyConfig.addFilter("min", min);
	eleventyConfig.addFilter("getKeys", getKeys);
	eleventyConfig.addFilter("filterTagList", filterTagList);
	eleventyConfig.addFilter("sortAlphabetically", sortAlphabetically);
};
