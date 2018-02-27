import {Component} from 'preact';

/**
 * Loader component
 */
export default class Loader extends Component {
	render() {
		return (
			<ul className={'gallery'}>
				{('   '.split('').map(() => <li className={'gallery__item gallery__item--loading'} />))}
			</ul>
		);
	}
}