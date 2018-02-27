import {Component} from 'preact';
import {getTranslate3dText,getZoomFactor} from './Utils';
import Shake from './shake';

const SWIPE_THRESHOLD_PERCENT = 40;
const TRANSITION_INTERVAL_MS = 200;
const KEYS = {LEFT: 37, RIGHT: 39, ESC: 27, TAB: 9};

export default class Modal extends Component {

	enableShakeDetection() {
		this._shakeListener = new Shake({
			threshold: 5,
			timeout: 500
		});
		this._shakeListener.start();
	}

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

		this.state = {
			showControl: true
		};

		//shake handlers
		this.enableShakeDetection();
		this.onShake = this.onShake.bind(this);

	}

	componentDidUpdate() {
		if (this.props.show) {
			this.focus();
		}
	}

	componentWillMount() {
		window.addEventListener('shake', this.onShake, false);
	}

	componentWillUnmount() {
		window.removeEventListener('shake', this.onShake, false);
		this._shakeListener.stop();
	}

	onTouchStart(event) {

		if(event.touches.length > 1 || getZoomFactor() > 1) {
			return true;
		}

		event.preventDefault();

		this.startX = event.touches[0].clientX;
		this.diff = 0;
		this.baseEl.style['willChange'] = 'transform';

	}

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

	onTouchEnd(event) {

		if(event.touches.length > 1 || getZoomFactor() > 1) {
			return true;
		}

		event.preventDefault();

		let maxWidth = this.baseEl.offsetWidth / Math.max(this.props.pages.length, 1);
		let shouldMove = Math.abs((this.diff / maxWidth) * 100) > SWIPE_THRESHOLD_PERCENT;
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


	onKeyDown(event) {

		let {pages, pageIndex} = this.props;
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
				this.props.onClose();
				break;
		}

	}

	// create a transition effect
	createTransition(to, onFinish) {

		this.baseEl.style.transition = `transform ${TRANSITION_INTERVAL_MS / 1000}s ease-out`;
		this.baseEl.style.transform = getTranslate3dText(to);
		window.setTimeout(() => {
			this.baseEl.style.transition = 'none';
			this.baseEl.style['willChange'] = 'auto';
			onFinish && onFinish();
		}, TRANSITION_INTERVAL_MS);
	}

	render() {

		let {pages, show, pageIndex} = this.props;

		return (
			<div className={'modal'} style={{display: show ? 'block' : 'none'}} onKeyDown={this.onKeyDown}>
				<div className={'modal__control modal__control--top'} style={{opacity: this.state.showControl ? 1 : 0}}>
					<a ref={(el) => {this._firstCtrl = el}} className={'control__item'} href='#'><img className={'control__item--icon'} src={'assets/close.png'} alt="close"/></a>
					<figcaption className={'control__item'}>{pages[pageIndex] && pages[pageIndex]['title']}</figcaption>
				</div>
				<div className={'modal__content'} onTouchStart={this.onTouchStart} onTouchMove={this.onTouchMove} onTouchEnd={this.onTouchEnd}>
					<div className={'content__wrapper'} ref={(el) => {this.baseEl = el}} style={{width: `${pages.length * 100}%`, transform: `${getTranslate3dText(this.getTranslateValue())}`}}>
						{(pages || []).map((item, index) => {
							let isCurrent = (index === pageIndex);
							return (
								<div className={'content__img__wrapper'}>
									<img ref={(el) => {if (isCurrent) {this.currentItem = el;}}} src={item['src']} className={'content__img'}/>
								</div>
							);
						})}
					</div>
				</div>
				<Tips ref={(el) => (this._tipsEl = el)}/>
				<div className={'modal__control modal__control--bottom'} style={{opacity: this.state.showControl ? 1 : 0}}>
					<a className={'control__item'} href='javascript:void(0)'><img className={'control__item--icon'} src={'assets/comment.png'} alt="comment"/></a>
					<a className={'control__item'} href='javascript:void(0)' ref={(el) => {this._lastCtrl = el}}><img className={'control__item--icon'} src={'assets/plus.png'} alt="plus"/></a>
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
		this._firstCtrl && this._firstCtrl.focus();
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

	onShake() {
		let {show, pageIndex, pages, onModalSwipe} = this.props;

		// todo handle direction of shake
		if(show && pageIndex < pages.length - 1) {
			this.currentX = this.currentX - (this.baseEl.offsetWidth / pages.length);
			this.createTransition(this.currentX, () => {
				onModalSwipe && onModalSwipe(false);
			});
		}
	}

}

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
			<div className={'tips'} tabIndex="0">
				<ul>
					<li>{'TAP on top-left edge to "close" slide'}</li>
					<li className={'tips--center'}>{'SWIPE/SHAKE to "change" images'}</li>
					<li className={'tips--center'}>{'TAP on the image to "toggle" controls'}</li>
					<li><button className={'tips--close'} onClick={this.hideTips}>{'CLOSE'}</button></li>
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
