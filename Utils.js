/**
 * Adds few polyfills (animations, requestAnimationFrame, promises)
 */
function addPolyfills() {

	// web animations
	if(typeof document.body.animate === "undefined") {
		let script = document.createElement('script');
		script.src = "//cdn.jsdelivr.net/web-animations/latest/web-animations.min.js";
		document.body.appendChild(script);
	}

	// rAF
	(function() {
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
			window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
				|| window[vendors[x]+'CancelRequestAnimationFrame'];
		}

		if (!window.requestAnimationFrame)
			window.requestAnimationFrame = function(callback, element) {
				var currTime = new Date().getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				var id = window.setTimeout(function() { callback(currTime + timeToCall); },
					timeToCall);
				lastTime = currTime + timeToCall;
				return id;
			};

		if (!window.cancelAnimationFrame)
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
	}());


	// promises
	(function () {
		if(!window.Promise) {
			let script = document.createElement('script');
			script.src = "//cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.js";
			document.body.appendChild(script);
		}
	})();

}

/**
 * Helps manage history, navigation
 */
const BookMarker = {
	historySupported: !!(window.history && window.history.pushState),
	get(fallback = -1) {
		let query;
		if(this.historySupported) {
			query = window.location.href.split("id=").pop();
		}
		else {
			query = window.location.hash.slice(1);
		}
		if(query!=='')
			query = parseInt(query);
		return query > -1 ? query : fallback;
	},
	set(value = "", replace = false) {
		if(this.historySupported) {
			if(replace)
				history.replaceState(null, null, '?id='+value);
			else
				history.pushState(null, null, '?id='+value);
		}
		else {
			window.location.hash = value;
		}
	},
	clear() {
		this.set(undefined, true);
	},
	subscribe(fn) {
		if(this.historySupported)
			window.addEventListener('popstate', fn);
		else
			window.addEventListener('hashchange', fn);
	},
	unsubscribe(fn) {
		if(this.historySupported)
			window.removeEventListener('popstate', fn);
		else
			window.removeEventListener('hashchange', fn);
	}
};

/**
 * Returns css translate 3d string
 * @param x
 * @param y
 * @param z
 * @returns {string}
 */
function getTranslate3dText(x = 0, y = 0, z = 0) {
	return `translate3d(${x}px, ${y}px, ${z}px)`;
}

/**
 * Returns css translate string
 * @param x
 * @param y
 * @param z
 * @returns {string}
 */
function getTranslate2dText(x = 0, y = 0, z = 0) {
	return `translateX(${x}px) translateY(${y}px)`;
}

/**
 * Returns the current scale of webpage
 * @returns {number}
 */
function getZoomFactor() {
	try {
		let deviceWidth, landscape = Math.abs(window.orientation) === 90;
		if (window.screen.width == 320)
			deviceWidth = landscape ? 480 : 320;
		else
			deviceWidth = window.screen[landscape ? "height" : "width"];
		return deviceWidth / window.innerWidth;
	}
	catch (e) {
		return 1;
	}
}

/**
 * Animates position of element
 * Inspiration from https://aerotwist.com/blog/flip-your-animations/
 * @param firstItem
 * @param lastItem
 */
function animateFLIP(firstItem, lastItem) {

	if(!firstItem || !lastItem)
		return;

	let firstRect = firstItem.getBoundingClientRect();
	let lastRect = lastItem.getBoundingClientRect();

	// Still painting and user had clicked. Don't animate but just show stuff.
	if(!lastRect.width)
		return;

	let from = `${getTranslate2dText(firstRect.left - lastRect.left, firstRect.top - lastRect.top)} scale(${firstRect.width / lastRect.width})`;
	let to = `${getTranslate2dText()} scale(1)`;

	lastItem.animate([
		{transform: from},
		{transform: to}
	], {
		duration: 500,
		easing: 'cubic-bezier(0.2, 0, 0.2, 1)'
	});

}

/**
 * Lazy load images (only when they are in viewport)
 * Depends on intersection observer
 * --todo Use scroll based loader as fallback for intersection observer
 * @param images
 * @param options
 * @returns {{disconnect: disconnect}}
 */
function lazyLoader(images, options) {

	let {imageLoadedClass, errorImageSrc, observerConfig} = Object.assign({}, {
		imageLoadedClass: 'lazy-loaded',
		errorImageSrc: 'assets/close.png',
		observerConfig: {
			threshold: 0.5
		}
	}, options);

	let imageCount = images.length;
	let observer;

	// If we don't have support for intersection observer, loads the images immediately
	if (!('IntersectionObserver' in window)) {
		loadImagesImmediately(images);
	} else {
		observer = new IntersectionObserver(onIntersection, observerConfig);

		// foreach() is not supported in IE
		for (let i = 0; i < images.length; i++) {
			let image = images[i];
			if (image.className.indexOf(imageLoadedClass) > -1) {
				continue;
			}

			observer.observe(image);
		}
	}

	/**
	 * Disconnect the observer
	 */
	function disconnect() {
		if (!observer) {
			return;
		}

		observer.disconnect();
	}

	/**
	 * Load all of the images immediately
	 * @param {array} images
	 */
	function loadImagesImmediately(images) {
		for (let i = 0; i < images.length; i++) {
			let image = images[i];
			preloadImage(image);
		}
	}

	/**
	 * On intersection
	 * @param {array} entries
	 */
	function onIntersection(entries) {
		// Disconnect if we've already loaded all of the images
		if (imageCount === 0) {
			observer.disconnect();
		}

		// Loop through the entries
		for (let i = 0; i < entries.length; i++) {
			let entry = entries[i];
			// Are we in viewport?
			if (entry.intersectionRatio > 0) {
				imageCount--;

				// Stop watching and load the image
				observer.unobserve(entry.target);
				preloadImage(entry.target);
			}
		}
	}

	/**
	 * Preloads the image
	 * @param {object} image
	 */
	function preloadImage(image) {
		const src = image.getAttribute('data-src');
		if (!src) {
			return;
		}

		return fetchImage(src).then(() => { applyImage(image, src); }, () => { applyImage(image, errorImageSrc, true); });
	}

	/**
	 * Fetchs the image for the given URL
	 * @param {string} url
	 */
	function fetchImage(url) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.src = url;
			image.onload = resolve;
			image.onerror = reject;
		});
	}

	/**
	 * Apply image
	 * @param img
	 * @param src
	 * @param isError
	 */
	function applyImage(img, src, isError = false) {
		if(isError === false) {
			img.className = img.className + ' ' + imageLoadedClass;
			img.removeAttribute('data-src');
		}
		img.src = src;
		img.setAttribute('title', img.getAttribute('data-title'));
		img.setAttribute('alt', img.getAttribute('data-title'));
		img.removeAttribute('data-title');
	}

	return {
		disconnect: disconnect
	};
}

/**
 * Linear partitioning implementation, partition sequence into k buckets such that they are equally distributed.
 * Explanation: http://www8.cs.umu.se/kurser/TDBAfl/VT06/algorithms/BOOK/BOOK2/NODE45.HTM
 * @param sequence
 * @param buckets
 */
function linearPartition(sequence, buckets) {

	var partition = function(seq, k) {
		if(k === 0) return [];
		if(k === 1) return [seq];
		if(k >= seq.length) {
			// return the lists of each single element in sequence, plus empty lists for any extra buckets.
			var repeated =  [];
			for(var q = 0; q < k - seq.length; ++q) repeated.push([])
			return seq.map(function(x) {return [x]}).concat(repeated);
		}

		var sequence = seq.slice(0);
		var dividers = [];
		var sums = prefixSums(sequence, k);
		var conds = boundaryConditions(sequence, k, sums);

		// evaluate main recurrence
		for(var i = 2; i <= sequence.length; ++i) {
			for(var j = 2; j <= k; ++j) {
				conds[i][j] = undefined;
				for(var x = 1; x < i; ++x) {
					var s = Math.max(conds[x][j-1], sums[i] - sums[x])
					dividers[i] = dividers[i] || [];
					// Continue to find the cost of the largest range in the optimal partition.
					if(conds[i][j] === undefined || conds[i][j] > s) {
						conds[i][j] = s
						dividers[i][j] = x
					}
				}
			}
		}
		return(reconstructPartition(sequence, dividers, k))
	};

	// Work our way back up through the dividers, referencing each divider that we
	// saved given a value for k and a length of seq, using each divider to make
	// the partitions.
	var reconstructPartition = function(seq, dividers, k) {
		var partitions = [];
		while (k > 1) {
			if(dividers[seq.length]) {
				var divider = dividers[seq.length][k];
				var part = seq.splice(divider);
				partitions.unshift(part)
			}
			k = k - 1
		}
		partitions.unshift(seq);
		return partitions
	};

	// Given a list of numbers of length n, loop through it with index 'i'
	// Make each element the sum of all the numbers from 0...i
	// For example, given [1,2,3,4,5]
	// The prefix sums are [1,3,6,10,15]
	var prefixSums = function(seq) {
		var sums = [0];
		for(var i = 1; i <= seq.length; ++i) {
			sums[i] = sums[i - 1] + seq[i - 1]
		}
		return sums;
	};

	// This matrix holds the maximum sums over all the ranges given the length of
	// seq and the number of buckets (k)
	var boundaryConditions = function(seq, k, sums) {
		var conds = [];
		for(var i = 1; i <= seq.length; ++i) {
			conds[i] = [];
			conds[i][1] = sums[i]
		}
		for(var j = 1; j <= k; ++j) conds[1][j] = seq[0]
		return conds;
	};

	return partition(sequence, buckets);

}

export {addPolyfills};
export {BookMarker};
export {getTranslate3dText};
export {getTranslate2dText};
export {animateFLIP};
export {lazyLoader};
export {getZoomFactor};
export {linearPartition};