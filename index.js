import { Component } from 'preact';

import Gallery from './Gallery';
import {BookMarker} from './Utils';

class Loader extends Component {
	render() {
		return (
			<ul className={'gallery-list-container column-grid'}>
				{('   '.split('').map(() => <li className={'gallery-list-item shimmer'}></li>))}
			</ul>
		);
	}
}

export default class App extends Component {

	constructor(props) {
		super(props);
		this.state = {
			list: [],
			loading: true,
			startIndex: BookMarker.get()
		};
	}

	componentDidMount() {

		// fetch list of images
		fetch('/assets/images-v1.json').then((response) => response.json()).then((data) => {
			this.setState({
				loading: false,
				list: data.images
			});
		}).catch((error) => {
			console.log('error', error);
			if( confirm('Network Error. Retry again?') )
				window.location.reload();
		});

	}

	render() {

		let content = null;
		if(this.state.loading) {
			content = <Loader/>;
		}
		else {
			content = <Gallery items={this.state.list} currentIndex={this.state.startIndex} enableKeyboard={true}/>;
		}

		return (
			<div className={'container'}>
				<header><h2>{'Gallery'}</h2></header>
				{content}
			</div>
		);
	}
}
