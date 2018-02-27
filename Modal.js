import {Component} from 'preact';
import {getTranslate3dText, getZoomFactor} from './Utils';

const SWIPE_THRESHOLD_PERCENT = 40;
const TRANSITION_INTERVAL_MS = 200;
const KEYS = {LEFT: 37, RIGHT: 39, ESC: 27, TAB: 9};

/**
 * Modal component (Detail view of images)
 * @param pages {array} - array of image objects (src, title)
 * @param pageIndex {number} - current selection
 * @param show {boolean} - show/hide
 * @param onModalSwipe {function} - callback on modal item swipe
 * @param onClose {function} - callback on modal close
 */
export default class Modal extends Component {

	constructor(props) {
		super(props);

		if (!props.onClose)
			throw new Error('onClose is required!');

		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);

		this.startX = 0;
		this.currentX = 0;
		this.diff = 0;

		this.onKeyDown = this.onKeyDown.bind(this);

		this.state = {
			showControl: true
		};

	}

	componentDidUpdate() {
		if (this.props.show) {
			this.focus();
		}
	}

	// Handle touch start, setup trackers
	onTouchStart(event) {

		this.startX = event.touches[0].clientX;
		this.startTime = +(new Date());
		this.diff = 0;
	}

	// Handle touch move and transform the element accordingly
	onTouchMove(event) {

		if(event.touches.length > 1 || getZoomFactor() > 1) {
			return true;
		}

		event.preventDefault();

		let currentDifference = (event.touches[0].clientX - this.startX);
		let {pages, pageIndex} = this.props;

		// lock swipe for corners
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

	// Handle touch end, decide on partial movements
	onTouchEnd(event) {

		event.preventDefault();

		let maxWidth = this.baseEl.offsetWidth / Math.max(this.props.pages.length, 1);
		let distanceMovedPercent = Math.abs((this.diff / maxWidth) * 100);
		let elapsedTime = +new Date() - this.startTime;

		// if user had moved past a given threshold
		let shouldMove = distanceMovedPercent > SWIPE_THRESHOLD_PERCENT;

		// console.log(distanceMovedPercent, elapsedTime);

		// or if user is swiping too fast.
		if(distanceMovedPercent > 10 && elapsedTime < 120 ) {
			shouldMove = true;
		}

		let isFingerDirectionLeft = this.diff < 0;

		if (shouldMove) {
			this.currentX = this.currentX + (isFingerDirectionLeft ? -maxWidth : maxWidth);
		}
		else {
			this.setState((currentState) => ({showControl: !currentState.showControl}));
		}

		this.createTransition(this.currentX, () => {
			if (shouldMove && this.props.onModalSwipe) {
				this.props.onModalSwipe(isFingerDirectionLeft === false);
			}
		});

	}

	// Handle keyboard (mobile keyboard?) events and support tabbing
	onKeyDown(event) {

		let {pages, pageIndex, onClose} = this.props;
		let maxWidth = this.baseEl.offsetWidth / pages.length;

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
				let firstFocusableElement = this._firstCtrl, lastFocusableElement = this._lastCtrl;
				if (event.shiftKey && document.activeElement === firstFocusableElement) {
					lastFocusableElement.focus();
				}
				else if (document.activeElement === lastFocusableElement) {
					event.preventDefault();
					firstFocusableElement.focus();
				}
				break;
			case KEYS.ESC:
				this._tipsEl && this._tipsEl.hideTips();
				onClose();
				break;
		}

	}

	render() {

		let {pages, show, pageIndex, onClose} = this.props;

		return (
			<div className={'modal' + (show ? ' modal--visible' : '')} onKeyDown={this.onKeyDown} role={'dialog'}>
				<div className={'modal__control modal__control--top' + (this.state.showControl ? ' modal__control--visible' : '')}>
					<a ref={(el) => {this._firstCtrl = el}} className={'control__item'} href='javascript:void(0)' onClick={onClose} aria-label={'go back to list'}><img className={'control__item--icon'} src={'assets/arrow.png'} alt="close"/></a>
					<figcaption tabIndex="0" className={'control__item'} aria-label={'viewing ' + (pages[pageIndex] ? pages[pageIndex]['title'] : 'picture')}>{pages[pageIndex] && pages[pageIndex]['title']}</figcaption>
				</div>
				<div className={'modal__content'} onTouchStart={this.onTouchStart} onTouchMove={this.onTouchMove} onTouchEnd={this.onTouchEnd}>
					<div className={'content__wrapper'} ref={(el) => {this.baseEl = el}} style={{width: `${pages.length * 100}%`, transform: `${getTranslate3dText(this.getTranslateValue())}`}}>
						{(pages || []).map((item, index) => {
							let isCurrent = (index === pageIndex);
							return (
								<div className={'content__img__wrapper'}>
									<img ref={(el) => {if (isCurrent) {this.currentItem = el;}}} src={item ? item['src'] : ''} className={'content__img'}/>
								</div>
							);
						})}
					</div>
				</div>
				<Tips ref={(el) => (this._tipsEl = el)}/>
				<div className={'modal__control modal__control--bottom' + (this.state.showControl ? ' modal__control--visible' : '')}>
					<a className={'control__item'} aria-label={'add comment'} href='javascript:void(0)'><img className={'control__item--icon'} src={'assets/comment.png'} alt="comment"/></a>
					<a className={'control__item'} aria-label={'add plus-one'} href='javascript:void(0)' ref={(el) => {this._lastCtrl = el}}><img className={'control__item--icon'} src={'assets/plus.png'} alt="plus"/></a>
				</div>
			</div>
		);
	}

	// create a transition effect from one slide to other
	createTransition(to, onFinish) {

		window.requestAnimationFrame(() => {
			this.baseEl.style.transition = `transform ${TRANSITION_INTERVAL_MS / 1000}s ease-out`;
			this.baseEl.style.transform = getTranslate3dText(to);

			// disable transition after animation (ideally animation on finish)
			window.setTimeout(() => {
				this.baseEl.style.transition = 'none';
				onFinish && onFinish();
			}, TRANSITION_INTERVAL_MS);

		});

	}

	// returns current visible item in the modal
	getCurrentModalItem() {
		return this.currentItem;
	}

	// place focus on modal
	focus() {
		this._firstCtrl && this._firstCtrl.focus();
	}

	// get offset pixel based on pageIndex
	getTranslateValue() {

		let {pageIndex, show} = this.props;
		if (!show) {
			return 0;
		}

		let offset = 0;
		let baseWidth = (this._cachedWidth || document.body.offsetWidth);
		this._cachedWidth = baseWidth;

		for (let i = 0; i < pageIndex; i++)
			offset-= baseWidth;

		this.currentX = offset;
		return this.currentX;
	}

}

/**
 * Tips component (UI walkthrough)
 */
class Tips extends Component {
	constructor(props) {
		super(props);
		this.hideTips = this.hideTips.bind(this);
		this.state = {show: (window.localStorage ? (!localStorage.getItem('hideHelp')) : false)};
	}

	render() {
		if(this.state.show === false)
			return null;
		return (
			<div className={'tips'}>
				<ul>
					<li>{'TAP on top-left edge to "go back" to the list'}</li>
					<li className={'tips--center'}>{'SWIPE to "change" images'}</li>
					<li className={'tips--center'}>{'TAP on the image to "toggle" controls'}</li>
					<li><button tabIndex="0" aria-label={'close tips'} className={'tips--close'} onClick={this.hideTips}>{'CLOSE'}</button></li>
				</ul>
			</div>
		);
	}

	hideTips() {
		if(window.localStorage) {
			window.localStorage.setItem('hideHelp', true);
			this.setState({show: false});
		}
	}
}
