'use client';

import useSound from 'use-sound';
import { useAppStore } from '@/stores/appStore';

export const usePartyHorn = () => {
	const { isSoundEnabled } = useAppStore();

	const [playPartyHorn] = useSound('/sounds/party-horn.mp3', {
		volume: 0.4,
		soundEnabled: isSoundEnabled,
	});

	const triggerPartyHorn = () => {
		if (isSoundEnabled) {
			playPartyHorn();
		}
	};

	return triggerPartyHorn;
};
