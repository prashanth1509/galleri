import { Component } from 'preact';

import Gallery from './Gallery';
import {BookMarker, addPolyfills} from './Utils';

export default class App extends Component {

	constructor(props) {
		super(props);

		addPolyfills();

		this.state = {
			list: [],
			startIndex: BookMarker.get()
		};
	}

	componentDidMount() {

		// list of images to be loaded
		fetch('/assets/images-v1.json').then((response) => response.json()).then((data) => {
			this.setState({
				list: data.images
			});
		}).catch((error) => {
			console.log('error', error);
			if( confirm('Error! Retry again?') )
				window.location.reload();
		});

	}

	render() {
		return <Gallery items={this.state.list} currentIndex={this.state.startIndex} enableKeyboard={true}/>;
	}
}
