declare module 'canvas-confetti' {
	export interface ConfettiOptions {
		particleCount?: number;
		angle?: number;
		spread?: number;
		startVelocity?: number;
		decay?: number;
		gravity?: number;
		drift?: number;
		ticks?: number;
		origin?: {
			x?: number;
			y?: number;
		};
		colors?: string[];
		shapes?: Array<'square' | 'circle' | 'star' | object>;
		scalar?: number;
		zIndex?: number;
		disableForReducedMotion?: boolean;
		flat?: boolean;
	}

	export interface CreateConfettiOptions {
		resize?: boolean;
		useWorker?: boolean;
		disableForReducedMotion?: boolean;
	}

	export interface ConfettiFunction {
		(options?: ConfettiOptions): Promise<null> | null;
		reset(): void;
		create(
			canvas: HTMLCanvasElement,
			options?: CreateConfettiOptions,
		): ConfettiFunction;
		Promise: PromiseConstructor;
		shapeFromPath(options: { path: string; matrix?: number[] }): object;
		shapeFromText(options: {
			text: string;
			scalar?: number;
			color?: string;
			fontFamily?: string;
		}): object;
	}

	const confetti: ConfettiFunction;
	export default confetti;
}
