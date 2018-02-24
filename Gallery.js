import './reset.css';
import './gallery.css';

import {Component} from 'preact';
import {addAllPolyfills, getTranslate3dText, animateFLIP, BookMarker, lazyLoader} from './Utils';

export default class Gallery extends Component {

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

		// Support web animations and css columns, flex
		addAllPolyfills();

		// Listen for hash changes
		// we are supporting IE 9+ (no attachEvent)
		window.addEventListener('hashchange', this.onHashChange);

		// lazyloading
		lazyLoader(document.querySelectorAll('.gallery-list-item-img'), {imageLoadedClass: 'gallery-list-item-img-loaded'});
	}

	componentWillReceiveProps(newProps) {
		// lazyloading
		lazyLoader(document.querySelectorAll('.gallery-list-item-img'), {imageLoadedClass: 'gallery-list-item-img-loaded'});
	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this.onHashChange);
	}

	onHashChange() {

		let changedIndex = BookMarker.get();
		if (changedIndex !== this.state.currentIndex) {
			if (changedIndex === -1)
				this.onModalClose();
			else
				this.setState({currentIndex: changedIndex});
		}
	}

	listItemClick(event, index) {
		this.setState({currentIndex: index}, () => {
			animateFLIP(event.target, this.modal.getCurrentModalItem());
		});
	}

	render() {

		let {items, currentIndex} = this.state;

		// pagination items for modal
		let pages = [], current = 0;
		if (currentIndex > 0) {
			pages.push(items[currentIndex - 1]);
			current = 1;
		}
		pages.push(items[currentIndex]);
		if (currentIndex < items.length - 1) {
			pages.push(items[currentIndex + 1]);
		}

		return (
			<div className={'gallery-container'}>
				<header>
					<h2>{'Gallery'}</h2>
				</header>
				<ul ref={(el) => {this.baseEl = el}} className={'gallery-list-container gridify'}>
					{
						items.map((item, index) => {
							return (
								<li key={index} className={'gallery-list-item'} onClick={(event) => this.listItemClick(event, index)}>
									<a href={`#${index}`}>
										<img className={'gallery-list-item-img'} data-src={item} data-title={"Image"}/>
									</a>
								</li>
							);
						})
					}
				</ul>
				<Modal ref={(el) => {this.modal = el}}
					   show={currentIndex > -1}
					   pages={pages}
					   pageIndex={current}
					   onModalSwipe={this.onModalSwipe}
					   onClose={this.onModalClose}/>
			</div>
		);
	}

	onModalClose() {

		let lastIndex = this.state.currentIndex;

		animateFLIP(this.modal.getCurrentModalItem(), this.baseEl.childNodes[lastIndex]);

		this.setState({currentIndex: -1}, () => {

			BookMarker.clear();

			// scroll to corresponding element in the list
			if (this.baseEl && this.baseEl.childNodes[lastIndex] && this._swipeHappened) {
				let currentElement = this.baseEl.childNodes[lastIndex];
				let positionTop = (currentElement.getBoundingClientRect()).top + window.scrollY;
				currentElement.focus();
				this.base && this.base.scrollTo(0, positionTop);
			}
			this._swipeHappened = false;

		});
	}

	onModalSwipe(isLeft) {

		// to avoid auto scroll without any swipes
		this._swipeHappened = true;

		this.setState((currentState) => ({currentIndex: currentState.currentIndex + (isLeft ? -1 : 1)}), () => {
			BookMarker.set(this.state.currentIndex);
		});
	}

}

class Modal extends Component {

	constructor(props) {
		super(props);

		if (!props.onClose)
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
		if (this.props.show) {
			this.focus();
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
		if ((currentDifference > 0 && pageIndex < 1) || (currentDifference < 0 && pageIndex >= pages.length - 1)) {
			return;
		}
		else {
			this.diff = currentDifference;
		}

		window.requestAnimationFrame(() => {
			this.baseEl.style.transform = getTranslate3dText(this.currentX + this.diff)
		});
	}

	onTouchEnd(event) {

		event.preventDefault();

		const SWIPE_THRESHOLD = 40;
		let maxWidth = this.baseEl.offsetWidth;
		let shouldMove = Math.abs((this.diff / maxWidth) * 100) > SWIPE_THRESHOLD;
		let isFingerDirectionLeft = this.diff < 0;

		if (shouldMove) {
			this.currentX = this.currentX + (isFingerDirectionLeft ? -maxWidth : maxWidth);
		}

		this.createTransition(this.currentX, () => {
			if (shouldMove && this.props.onModalSwipe) {
				this.props.onModalSwipe(isFingerDirectionLeft === false);
			}
		});

	}


	onKeyDown(event) {

		event.preventDefault();

		let KEYS = {LEFT: 37, RIGHT: 39, ESC: 27, TAB: 9};
		let maxWidth = this.baseEl.offsetWidth;
		let {pages, pageIndex} = this.props;

		switch (event.keyCode) {
			case KEYS.LEFT:
				if (pageIndex > 0) {
					this.currentX = this.currentX + maxWidth;
					this.createTransition(this.currentX, () => {
						this.props.onModalSwipe && this.props.onModalSwipe(true);
					});
				}
				break;
			case KEYS.RIGHT:
				if (pageIndex < pages.length - 1) {
					this.currentX = this.currentX - maxWidth;
					this.createTransition(this.currentX, () => {
						this.props.onModalSwipe && this.props.onModalSwipe(false);
					});
				}
				break;
			case KEYS.TAB:
				let firstFocusableElement = this.controlsEl.firstChild, lastFocusableElement = this.controlsEl.lastChild;
				if (event.shiftKey && document.activeElement === firstFocusableElement) {
					lastFocusableElement.focus();
				}
				else if (document.activeElement === lastFocusableElement) {
					firstFocusableElement.focus();
				}
				break;
			case KEYS.ESC:
				this.props.onClose();
				break;
		}

	}

	// create a transition effect
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

	render() {

		let {pages, show, pageIndex, onClose} = this.props;

		return (
			<div className={'modal'} style={{display: show ? 'block' : 'none'}} onKeyDown={this.onKeyDown}>
				<div className={'modal-controls'} ref={(el) => {this.controlsEl = el}}>
					<a className={'modal-close'} href='javascript:void(0)' onClick={onClose}>Close</a>
				</div>
				<div className={'modal-content'} onTouchStart={this.onTouchStart} onTouchMove={this.onTouchMove} onTouchEnd={this.onTouchEnd}>
					<div className={'modal-wrapper'} ref={(el) => {this.baseEl = el}} style={{transform: `${getTranslate3dText(this.getTranslateValue())}`}}>
						{(pages || []).map((item, index) => {
							let isCurrent = (index === pageIndex);
							return (
								<div className={'modal-img-wrapper'}>
									<img ref={(el) => {if (isCurrent) {this.currentItem = el;}}} src={item} className={'modal-img'}/>
								</div>
							);
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

	// place focus on modal (first focusable)
	focus() {
		this.controlsEl && this.controlsEl.firstChild && this.controlsEl.firstChild.focus();
	}

	// get offset pixel based on pageIndex
	getTranslateValue() {

		let {pageIndex, show} = this.props;
		if (!show) {
			return 0;
		}

		let offset = 0;
		let baseWidth = document.body.offsetWidth;

		for (let i = 0; i < pageIndex; i++)
			offset -= baseWidth;

		this.currentX = offset;
		return this.currentX;
	}
}
