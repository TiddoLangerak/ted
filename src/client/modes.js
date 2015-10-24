import { draw } from './screen';
import normalMode from './modes/normal';
import commandMode from './modes/command';
import insertMode from './modes/command';

export default function Modes({ window, contentManager }) {
	let currentMode = 'normal';
	function changeMode(name) {
		currentMode = name;
		draw();
		return bindings[name];
	}
	const state = { window, changeMode, contentManager };
	const bindings = {
		normal : normalMode(state),
		command : commandMode(state),
		insert : insertMode(state)
	};

	return {
		getCurrentMode() {
			return bindings[currentMode];
		},
		getCurrentModeName() {
			return currentMode;
		}
	};
}
