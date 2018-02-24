import './style';
import { Component } from 'preact';

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

class Gallery extends Component {

	constructor(props) {
		super(props);

		this.state = {
			items: props.items,
			currentIndex: props.currentIndex
		};

		this.onModalClose = this.onModalClose.bind(this);
		this.onModalSwipe = this.onModalSwipe.bind(this);
		this.onHashChange = this.onHashChange.bind(this);
	}

	componentDidMount() {

		// to support web animations and css columns
		addPolyfills();

		// we are supporting IE 9+ so no attachEvent.
		window.addEventListener('hashchange', this.onHashChange);
	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this.onHashChange);
	}

	onHashChange() {
		let changedIndex = BookMarker.get();
		if(changedIndex !== this.state.currentIndex) {
			if(changedIndex === "" || changedIndex === -1)
				this.onModalClose();
			else
				this.setState({currentIndex: changedIndex});
		}
	}

	imageItemClick(event, index) {
		this.setState({currentIndex: index}, () => {
			animateFLIP(event.target, this.modal.getCurrentModalItem());
		});
	}

	render() {

		let {items, currentIndex} = this.state;

		// pagination items for modal
		let pages = [], current = 0;
		if(currentIndex > 0) {
			pages.push(items[currentIndex - 1]);
			current = 1;
		}
		pages.push(items[currentIndex]);
		if(currentIndex < items.length - 1) {
			pages.push(items[currentIndex + 1]);
		}

		return (
			<div>
				<header>
					<h3>Photos</h3>
				</header>
				<ul ref={(el) => {this.baseEl = el}} className="img-list-container">
					{
						items.map((item, index) => {
							return (
								<li key={index} className="img-list-item">
									<a href={`#${index}`}>
										<img src={item} onClick={(event) => this.imageItemClick(event, index)}/>
									</a>
								</li>
							);
						})
					}
				</ul>
				<Modal ref={(el) => {this.modal = el}} show={currentIndex > -1}
					   pages={pages}
					   pageIndex={current}
					   onModalSwipe={this.onModalSwipe}
					   onClose={this.onModalClose}/>
			</div>
		);
	}

	onModalClose() {

		let lastIndex = this.state.currentIndex;

		this.setState({currentIndex: -1}, () => {

			BookMarker.clear();

			// scroll to corresponding element in the list
			if(this.baseEl && this.baseEl.childNodes[lastIndex]) {
				let currentElement = this.baseEl.childNodes[lastIndex];
				let positionTop = (currentElement.getBoundingClientRect()).top + window.scrollY;
				window.scrollTo(0, positionTop);
				currentElement.focus();
			}

		});
	}

	onModalSwipe(isLeft) {
		this.setState((currentState) => ({currentIndex: currentState.currentIndex + (isLeft ? -1 : 1) }), () => {
			BookMarker.set(this.state.currentIndex);
		});
	}

}

class Modal extends Component {
	constructor(props) {
		super(props);

		if(!props.onClose)
			throw new Error('onClose is required!');

		// swipe handlers
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);

		// swipes trackers
		this.startX = 0;
		this.currentX = 0;
		this.diff = 0;

		// keyboard handlers
		this.onKeyDown = this.onKeyDown.bind(this);

	}

	componentDidUpdate() {
		if(this.props.show) {
			this.focus();
			/*
			if( document.body.webkitRequestFullScreen )
				document.documentElement.webkitRequestFullScreen();
			else if( document.body.requestFullscreen )
				document.documentElement.requestFullscreen();
			*/
		}
	}

	onKeyDown(event) {

		event.preventDefault();

		let KEYS = {LEFT: 37, RIGHT: 39, ESC: 27, TAB: 9};
		let maxWidth = this.baseEl.offsetWidth;
		let {pages, pageIndex} = this.props;

		switch (event.keyCode) {
			case KEYS.LEFT:
				if(pageIndex > 0) {
					this.currentX = this.currentX + maxWidth;
					this.createTransition(this.currentX, () => {
						this.props.onModalSwipe && this.props.onModalSwipe(true);
					});
				}
				break;
			case KEYS.RIGHT:
				if(pageIndex < pages.length - 1) {
					this.currentX = this.currentX - maxWidth;
					this.createTransition(this.currentX, () => {
						this.props.onModalSwipe && this.props.onModalSwipe(false);
					});
				}
				break;
			/*
			case KEYS.TAB:
				let firstFocusableElement = this.controlsEl.firstChild, lastFocusableElement = this.controlsEl.lastChild;
				if (event.shiftKey && document.activeElement === firstFocusableElement) {
					lastFocusableElement.focus();
				}
				else if (document.activeElement === lastFocusableElement) {
					firstFocusableElement.focus();
				}
				break;
			*/
			case KEYS.ESC:
				this.props.onClose();
				break;
		}

	}

	onTouchStart(event) {

		event.preventDefault();

		this.startX = event.touches[0].clientX;
		this.diff = 0;
		this.baseEl.style['willChange'] = 'transform';

	}

	onTouchMove(event) {

		event.preventDefault();

		let currentDifference = (event.touches[0].clientX - this.startX);
		let {pages, pageIndex} = this.props;

		// lock swipe for ends
		if( (currentDifference > 0 && pageIndex < 1) || (currentDifference < 0 && pageIndex >= pages.length - 1) ) {
			return;
		}
		else {
			this.diff = currentDifference;
		}

		window.requestAnimationFrame(() => {this.baseEl.style.transform = getTranslate3dText(this.currentX + this.diff)});
	}

	onTouchEnd(event) {

		event.preventDefault();

		const SWIPE_THRESHOLD = 40;
		let maxWidth = this.baseEl.offsetWidth;
		let shouldMove = Math.abs( (this.diff/maxWidth) * 100 ) > SWIPE_THRESHOLD;
		let isFingerDirectionLeft = this.diff < 0;

		if(shouldMove) {
			this.currentX = this.currentX + (isFingerDirectionLeft ? -maxWidth : maxWidth);
		}

		this.createTransition(this.currentX, () => {
			if( shouldMove && this.props.onModalSwipe ) {
				this.props.onModalSwipe(isFingerDirectionLeft === false);
			}
		});

	}

	createTransition(to, onFinish) {

		let INTERVAL_MS = 200;

		this.baseEl.style.transition = `transform ${INTERVAL_MS / 1000}s ease-out`;
		this.baseEl.style.transform = getTranslate3dText(to);
		window.setTimeout(() => {
			this.baseEl.style.transition = 'none';
			this.baseEl.style['willChange'] = 'auto';
			onFinish && onFinish();
		}, INTERVAL_MS);

	}

	getTranslateValue() {

		let { pageIndex, show } = this.props;

		if(!show) {
			return 0;
		}

		let offset = 0;
		let baseWidth = document.body.offsetWidth;

		for(let i = 0; i < pageIndex; i++)
			offset-=baseWidth;

		this.currentX = offset;

		return offset;
	}

	render() {

		let {pages, show, pageIndex, onClose} = this.props;

		return (
			<div className="modal" style={{display: show ? 'block' : 'none'}} onKeyDown={this.onKeyDown}>
				<div className="modal-controls" ref={(el) => {this.controlsEl = el} }>
					<a className="modal-close" href="javascript:void(0)" onClick={onClose}>Close</a>
				</div>
				<div className="modal-content" onTouchStart={this.onTouchStart} onTouchMove={this.onTouchMove} onTouchEnd={this.onTouchEnd}>
					<div className="modal-wrapper" ref={(el) => {this.baseEl = el}} style={{transform: `${getTranslate3dText(this.getTranslateValue())}`}}>
						{(pages || []).map((item, index) => {
							let isCurrent = index === pageIndex;
							return <div className="img-wrapper"><img ref={(el) => { if(isCurrent) {this.currentItem = el;} } } src={item} className="img"/></div>;
						})}
					</div>
				</div>
			</div>
		);
	}

	// returns current visible item in the modal
	getCurrentModalItem() {
		return this.currentItem;
	}

	focus() {
		this.controlsEl && this.controlsEl.firstChild && this.controlsEl.firstChild.focus();
	}
}


export default class App extends Component {

	constructor(props) {
		super(props);
		this.state = {
			list: [
				"http://img0.chromatic.io/20b47a31-1ded-ec7d-a08d-7cd605189536/small.jpg",
				"http://img0.chromatic.io/7a9f09ad-f19b-95e7-9538-bc049810ec5a/small.jpg",
				"http://img0.chromatic.io/f30bed2b-1888-6f88-20c4-d3870a2a9d62/small.jpg",
				"http://img0.chromatic.io/d8fb8ca6-3b46-d763-9dbf-fd8388402d1d/small.jpg",
				"http://img1.chromatic.io/cb744883-f13a-bf5b-ab9d-5edeafadccc7/small.jpg",
				"http://img2.chromatic.io/cc10fccc-7cf9-04c3-1794-d8ba489d1119/small.jpg",
				"http://img0.chromatic.io/fc5fdcc8-64f1-de56-74bc-e0518edeae5f/small.jpg",
				"http://img0.chromatic.io/0161d247-b64e-16f5-b4f9-27c33ad6451c/small.jpg",
				"http://img2.chromatic.io/3c1618ba-bddb-a51e-4fed-86c549eeb539/small.jpg",
				"http://img3.chromatic.io/1192ce85-5675-46f0-ddfc-6c49b5ccbb44/small.jpg",
				"http://img3.chromatic.io/b25db2e6-c7f8-a5a2-a3da-ab0601458676/small.jpg"
			],
			startIndex: BookMarker.get()
		};
	}

	render() {
		return <Gallery items={this.state.list} currentIndex={this.state.startIndex}/>
	}
}
