function addPolyfills() {

	// web animations support
	if(typeof document.body.animate === "undefined") {
		let script = document.createElement('script');
		script.src = "//cdn.jsdelivr.net/web-animations/latest/web-animations.min.js";
		document.body.appendChild(script);
	}

}

function gridify() {

	// css columns support
	// We could also use CSS.supports, but its still buggy.
	if(document.body.style.columns !== undefined) {
		Array.prototype.forEach.call(document.querySelectorAll('.gridify'), (item) => {
			item.className = item.className + ' column-grid';
		});
	}
	else if(document.body.style.flex !== undefined) {
		Array.prototype.forEach.call(document.querySelectorAll('gridify'), (item) => {
			item.className = item.className + ' flex-grid';
		});
	}
	else {
		// todo
		// linear-partition algorithm
	}

}

const BookMarker = {
	get(fallback = -1) {
		return parseInt(window.location.hash.slice(1) || fallback);
	},
	set(value = "") {
		window.location.hash = value;
	},
	clear() {
		this.set();
	}
};

function getTranslate3dText(x = 0, y = 0, z = 0) {
	return `translate3d(${x}px, ${y}px, ${z}px)`;
}

function getTranslate2dText(x = 0, y = 0, z = 0) {
	return `translateX(${x}px) translateY(${y}px)`;
}

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

function animateFLIP(firstItem, lastItem) {

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
		// todo or use scroll based loader?
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


export {addPolyfills};
export {BookMarker};
export {getTranslate3dText};
export {getTranslate2dText};
export {animateFLIP};
export {lazyLoader};
export {getZoomFactor};
export {gridify};