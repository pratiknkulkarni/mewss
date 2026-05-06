import {useEffect, useRef} from "react";
// this one works in dev
import {tinykeys} from "tinykeys";

// this is required because of an issue in the library - ref -> https://github.com/jamiebuilds/tinykeys/issues/191#issuecomment-2796301360
// this one works in build smh :(
// import {tinykeys} from "../../node_modules/tinykeys/dist/tinykeys.js";

type ShortcutMap = Record<string, (event: KeyboardEvent) => void>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
    const shortcutsRef = useRef<ShortcutMap>(shortcuts);

    useEffect(() => {
        shortcutsRef.current = shortcuts;
    });

    useEffect(() => {
        if (!enabled) return;

        const wrappedShortcuts = Object.keys(shortcutsRef.current).reduce((acc, key) => {
            acc[key] = (e: KeyboardEvent) => {
                const target = e.target as HTMLElement;

                // stopping keybindings if the user is typing
                if (
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable
                ) {
                    return;
                }

                e.preventDefault();
                shortcutsRef.current[key](e);
            };
            return acc;
        }, {} as ShortcutMap);

        const unsubscribe = tinykeys(window, wrappedShortcuts);

        return () => {
            unsubscribe();
        };
    }, [enabled]);
}
