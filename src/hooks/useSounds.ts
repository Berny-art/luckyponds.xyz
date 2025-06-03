'use client';

import { useEffect, useRef } from 'react';
import useSound from 'use-sound';
import { useAppStore } from '@/stores/appStore';

export const useSounds = () => {
	const { isSoundEnabled, hasFirstClicked, setFirstClicked, setSoundEnabled } = useAppStore();
	const ambienceRef = useRef<{ sound: { pause: () => void; play: () => void } } | null>(null);

	// Initialize sounds
	const [playDrip] = useSound('/sounds/drip.mp3', {
		volume: 0.3,
		soundEnabled: isSoundEnabled,
	});

	const [playAmbience, { stop: stopAmbience }] = useSound('/sounds/bg-ambience.mp3', {
		volume: 0.3,
		loop: true,
		soundEnabled: isSoundEnabled,
	});

	const [playPartyHorn] = useSound('/sounds/party-horn.mp3', {
		volume: 0.4,
		soundEnabled: isSoundEnabled,
	});

	// Store ambience controls for later use
	useEffect(() => {
		ambienceRef.current = { sound: { pause: stopAmbience, play: playAmbience } };
	}, [playAmbience, stopAmbience]);

	// Handle global click events
	useEffect(() => {
		const handleGlobalClick = () => {
			if (!hasFirstClicked) {
				// First click: enable sound and set flag
				setFirstClicked();
				setSoundEnabled(true);
				// Start background ambience after first click
				setTimeout(() => {
					playAmbience();
				}, 100);
			} else if (isSoundEnabled) {
				// Subsequent clicks: play drip sound
				playDrip();
			}
		};

		if (typeof window !== 'undefined') {
			document.addEventListener('click', handleGlobalClick);
			return () => document.removeEventListener('click', handleGlobalClick);
		}
	}, [isSoundEnabled, hasFirstClicked, playDrip, playAmbience, setFirstClicked, setSoundEnabled]);

	// Control background ambience based on sound settings
	useEffect(() => {
		if (hasFirstClicked) {
			if (isSoundEnabled) {
				playAmbience();
			} else {
				stopAmbience();
			}
		}
	}, [isSoundEnabled, hasFirstClicked, playAmbience, stopAmbience]);

	return {
		playDrip,
		playAmbience,
		stopAmbience,
		playPartyHorn,
		isSoundEnabled,
		setSoundEnabled,
	};
};
