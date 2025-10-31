import { useEffect, useRef } from "react";

// Global ref count so multiple overlays can coexist
let scrollLockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";
let previousPosition = "";
let previousTop = "";
let previousWidth = "";
let savedScrollY = 0;

function getScrollbarWidth(): number {
    if (typeof window === "undefined") return 0;
    return window.innerWidth - document.documentElement.clientWidth;
}

function isIOS(): boolean {
    if (typeof navigator === "undefined") return false;
    return /iP(ad|hone|od)/.test(navigator.platform)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

function lockScrollInternal() {
    if (typeof document === "undefined") return;
    const body = document.body;
    const docEl = document.documentElement;

    if (scrollLockCount === 0) {
        // save
        previousOverflow = body.style.overflow;
        previousPaddingRight = body.style.paddingRight;
        previousPosition = body.style.position;
        previousTop = body.style.top;
        previousWidth = body.style.width;

        const scrollbarW = getScrollbarWidth();
        if (scrollbarW > 0) {
            body.style.paddingRight = `${scrollbarW}px`;
        }

        // For most browsers overflow hidden is enough
        body.style.overflow = "hidden";

        // iOS fix: use position fixed to truly lock
        if (isIOS()) {
            savedScrollY = window.scrollY || docEl.scrollTop;
            body.style.position = "fixed";
            body.style.top = `-${savedScrollY}px`;
            body.style.width = "100%";
        }

        // Prevent scroll chaining
        (docEl.style as CSSStyleDeclaration & { overscrollBehavior?: string }).overscrollBehavior = "none";
    }
    scrollLockCount += 1;
}

function unlockScrollInternal() {
    if (typeof document === "undefined") return;
    const body = document.body;
    const docEl = document.documentElement;

    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
        // restore
        body.style.overflow = previousOverflow;
        body.style.paddingRight = previousPaddingRight;
        (docEl.style as CSSStyleDeclaration & { overscrollBehavior?: string }).overscrollBehavior = "";

        if (isIOS()) {
            body.style.position = previousPosition;
            body.style.top = previousTop;
            body.style.width = previousWidth;
            // restore scroll
            window.scrollTo(0, savedScrollY);
        }
    }
}

/**
 * React hook to lock page scroll while active is true.
 * iOS-safe, prevents layout shift via scrollbar compensation, SSR-safe.
 */
export function useScrollLock(active: boolean) {
    const wasActive = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (active && !wasActive.current) {
            lockScrollInternal();
            wasActive.current = true;
        } else if (!active && wasActive.current) {
            unlockScrollInternal();
            wasActive.current = false;
        }

        return () => {
            if (wasActive.current) {
                unlockScrollInternal();
                wasActive.current = false;
            }
        };
    }, [active]);
}

export default useScrollLock;


