import { useCallback, useRef } from "react";

interface SwipeHandlers {
	onSwipeLeft?: (id: string) => void;
	onSwipeRight?: (id: string) => void;
}

const SWIPE_THRESHOLD = 60;

export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeHandlers) {
	const touchStartRef = useRef<{ x: number; id: string } | null>(null);
	const touchTranslateRef = useRef<Map<string, number>>(new Map());

	const onTouchStart = useCallback((e: React.TouchEvent, id: string) => {
		touchStartRef.current = { x: e.touches[0].clientX, id };
		const el = e.currentTarget as HTMLElement;
		el.style.transition = "none";
	}, []);

	const onTouchMove = useCallback((e: React.TouchEvent) => {
		if (!touchStartRef.current) return;
		const dx = e.touches[0].clientX - touchStartRef.current.x;
		const el = e.currentTarget as HTMLElement;
		if (dx < 0) {
			el.style.transform = `translateX(${Math.max(dx, -120)}px)`;
		} else {
			el.style.transform = `translateX(${Math.min(dx, 120)}px)`;
		}
		touchTranslateRef.current.set(touchStartRef.current.id, dx);
	}, []);

	const onTouchEnd = useCallback((e: React.TouchEvent) => {
		const start = touchStartRef.current;
		if (!start) return;
		const el = e.currentTarget as HTMLElement;
		el.style.transition = "transform 0.2s ease-out";
		const dx = touchTranslateRef.current.get(start.id) || 0;

		if (dx < -SWIPE_THRESHOLD) {
			el.style.transform = "translateX(-120%)";
			setTimeout(() => {
				onSwipeLeft?.(start.id);
				el.style.transform = "";
				el.style.transition = "";
			}, 200);
		} else if (dx > SWIPE_THRESHOLD) {
			el.style.transform = "translateX(120%)";
			setTimeout(() => {
				onSwipeRight?.(start.id);
				el.style.transform = "";
				el.style.transition = "";
			}, 200);
		} else {
			el.style.transform = "";
			setTimeout(() => { el.style.transition = ""; }, 200);
		}

		touchStartRef.current = null;
		touchTranslateRef.current.delete(start.id);
	}, [onSwipeLeft, onSwipeRight]);

	return { onTouchStart, onTouchMove, onTouchEnd };
}
