function addPolyfills() {

	// web animations support
	if(typeof document.body.animate === "undefined") {
		let script = document.createElement('script');
		script.src = "//cdn.jsdelivr.net/web-animations/latest/web-animations.min.js";
		document.body.appendChild(script);
	}

	// css columns support
	// We could also use CSS.supports, but its still buggy.
	if(document.body.style.columns !== undefined) {
		Array.prototype.forEach.call(document.querySelectorAll('.img-list-container'), (item) => {
			item.className = item.className + ' column-grid';
		});
	}
	else if(document.body.style.flex !== undefined) {
		Array.prototype.forEach.call(document.querySelectorAll('.img-list-container'), (item) => {
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

function animateFLIP(firstItem, lastItem) {

	let firstRect = firstItem.getBoundingClientRect();
	let lastRect = lastItem.getBoundingClientRect();

	let from = `${getTranslate2dText(firstRect.left - lastRect.left, firstRect.top - lastRect.top)} scale(${firstRect.width / lastRect.width})`;
	let to = `${getTranslate2dText()} scale(1)`;

	lastItem.animate([
		{transform: from},
		{transform: to}
	], {
		duration: 600,
		easing: 'cubic-bezier(0.2, 0, 0.2, 1)'
	});

}

export {addPolyfills};
export {BookMarker};
export {getTranslate3dText};
export {getTranslate2dText};
export {animateFLIP};
