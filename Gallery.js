import './gallery.css';

import {Component} from 'preact';
import Loader from './Loader';
import Modal from './Modal';
import {animateFLIP, BookMarker, linearPartition} from './Utils';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const DELAY_MODAL = window.navigator.userAgent.toLowerCase().indexOf('crios') > -1;

export default class Gallery extends Component {

	preSetup() {
		this.partitionItems(true);
	}

	constructor(props) {
		super(props);

		this.state = {
			items: props.items,
			online: (typeof navigator.onLine === 'boolean') ? navigator.onLine : true,
			currentIndex: props.currentIndex
		};

		this.onModalClose = this.onModalClose.bind(this);
		this.onModalSwipe = this.onModalSwipe.bind(this);
		this.onHashChange = this.onHashChange.bind(this);
		this.onNetworkChange = this.onNetworkChange.bind(this);
		this.onResize = this.onResize.bind(this);
	}

	componentWillReceiveProps(newProps) {
		if(this.state.items.length !== newProps.items.length) {
			this.setState({items: newProps.items, currentIndex: newProps.currentIndex}, () => {
				this.preSetup();
			});
		}
	}

	componentWillMount() {
		window.addEventListener('hashchange', this.onHashChange);
		window.addEventListener('resize', this.onResize);
		window.addEventListener('online',  this.onNetworkChange);
		window.addEventListener('offline', this.onNetworkChange);
	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this.onHashChange);
		window.removeEventListener('resize', this.onResize);
		window.removeEventListener('online',  this.onNetworkChange);
		window.removeEventListener('offline', this.onNetworkChange);
	}

	componentDidMount() {
		this.preSetup();
	}

	partitionItems(firstLoad = false, idealWidth = window.innerWidth, idealHeight = parseInt(window.innerHeight / 4)) {

		if(this.state.items.length < 1)
			return;

		let currentItems = (this._origList || this.state.items);
		this._origList = JSON.parse(JSON.stringify(currentItems));
		currentItems = firstLoad ? currentItems.slice(0, 8) : currentItems;

		let imageObjectPopulator = currentItems.map((item, index) => {
			return new Promise((resolve, reject) => {
				if(index >= 0) {
					let image = new Image();
					image.src = item.src;
					image.onload = function () {
						resolve(Object.assign(item, {width: image.width, height: image.height}));
					};
					image.onerror = function () {
						resolve(Object.assign(item, {src: FALLBACK_IMAGE, width: 1, height: 1}));
					};
				}
			});
		});

		Promise.all(imageObjectPopulator).then((imageObjectList) => {
			let totalWidth = 0;

			let widthSequence = imageObjectList.map((obj) => {
				let value = parseInt(obj.width * (idealHeight / obj.height));
				// also calculate total width on the way
				totalWidth+=value;
				return value;
			});

			let totalRowsRequired = Math.round(totalWidth / idealWidth);

			let partitions = linearPartition(widthSequence, totalRowsRequired), correspondingIndex = 0;

			partitions.forEach((currentRow) => {
				let correspondingObjects = imageObjectList.slice(correspondingIndex, correspondingIndex + currentRow.length);
				let totalParts = currentRow.reduce((acc, v) => acc + v);
				currentRow.forEach((value, index) => {
					let ratio = value / totalParts;
					let assignedWidth = parseInt(idealWidth * ratio);
					let currentAspectRation = correspondingObjects[index].width / correspondingObjects[index].height;
					let assignedHeight = parseInt(assignedWidth / currentAspectRation);
					correspondingObjects[index] = Object.assign(correspondingObjects[index], {width: assignedWidth, height: assignedHeight});
				});
				correspondingIndex = correspondingIndex + currentRow.length;
			});

			this.setState({items: imageObjectList}, () => {
				if(firstLoad)
					window.requestAnimationFrame(() => this.partitionItems());
			});

		});

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

	onResize() {
		// chrome toggles address bar now and then and triggers resize often.
		if ( Math.abs( parseInt(this._lastHeight || 0) - (window.innerHeight / 4) ) < 100 )
			return;
		this._lastHeight = window.innerHeight / 4;
		this.partitionItems();
	}

	listItemClick(event, index) {
		this._lastScrollPos = window.scrollY;
		this._lastActive = document.activeElement;

		this.setState({currentIndex: index}, () => {
			animateFLIP(event.target, this.modal.getCurrentModalItem());

			// fix chrome address bar popping up immediately
			if( DELAY_MODAL && this._lastScrollPos > 0 )
				setTimeout(() => BookMarker.set(this.state.currentIndex), 500);
			else
				BookMarker.set(this.state.currentIndex);

		});
	}

	onNetworkChange() {
		this.setState({online: window.navigator.onLine});
	}

	render() {

		let {items, currentIndex, online} = this.state;

		// pagination items for modal
		let pages = [], current = 0;

		if(items.length) {
			if (currentIndex > 0) {
				pages.push(items[currentIndex - 1]);
				current = 1;
			}
			if(currentIndex > -1)
				pages.push(items[currentIndex]);
			if (currentIndex < items.length - 1) {
				pages.push(items[currentIndex + 1]);
			}
		}

		return (
			<main className={`container ${online === false ? 'container--offline' : ''}`}>
				<header className={'header'}><h2>{'Gallery'}</h2></header>
				{
					items.length ? <ul ref={(el) => {this.baseEl = el}} className={'gallery'}>
						{
							items.map((item, index) => {
								return (
									<li tabIndex={0} key={index} className={`gallery__item ${!item['width'] && 'gallery__item--loading'}`} onClick={(event) => this.listItemClick(event, index)}>
										<img src={item['width'] ? item['src'] : FALLBACK_IMAGE} title={item['title']} alt={item['title']} style={{width: item['width'], height: item['height']}}/>
									</li>
								);
							})
						}
					</ul> : <Loader/>
				}
				<Modal ref={(el) => {this.modal = el}}
					   show={currentIndex > -1}
					   pages={pages}
					   pageIndex={current}
					   onModalSwipe={this.onModalSwipe}
					   onClose={this.onModalClose}/>
			</main>
		);
	}

	onModalClose() {

		let lastIndex = this.state.currentIndex;

		// scroll to corresponding element
		if (this.baseEl && this.baseEl.childNodes[lastIndex]) {
			let currentElement = this.baseEl.childNodes[lastIndex];
			let positionTop = this._swiped ? (currentElement.getBoundingClientRect()).top + window.scrollY : (this._lastScrollPos || 0);
			this._swiped ? currentElement.focus() : this._lastActive && this._lastActive.focus();
			window.scrollTo && window.scrollTo(0, positionTop);
			this._swiped = false;
		}

		// reverse the animation
		animateFLIP(this.modal.getCurrentModalItem(), this.baseEl.childNodes[lastIndex]);

		// clear state
		this.setState({currentIndex: -1}, () => {
			BookMarker.clear();
		});

	}

	onModalSwipe(isLeft) {

		this._swiped = true;

		this.setState((currentState) => ({currentIndex: currentState.currentIndex + (isLeft ? -1 : 1)}), () => {
			BookMarker.set(this.state.currentIndex);
		});
	}

}

