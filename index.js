import { Component } from 'preact';

import {BookMarker} from './src/Utils';
import Gallery from './src/Gallery';

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
