import { FEATURES } from "./core.mjs";
export const FEATURE_CSS = {
    "signal-theme": `
        :root {
            --brand-experiment: #ed7421;
            --brand-500: #ed7421;
            --background-primary: #17191d;
            --background-secondary: #111317;
            --background-tertiary: #0c0e11;
            --background-base-low: #17191d;
            --background-base-lower: #111317;
            --background-base-lowest: #0c0e11;
        }
        [role="main"] { background-color: #17191d !important; }
    `,
    "compact-messages": `
        [id^="chat-messages-"] { padding-top: 2px !important; padding-bottom: 2px !important; }
    `,
    "reduced-motion": `
        *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }
    `
};

export function browserFeatures(document) {
    return FEATURES.map(feature => ({
        ...feature,
        start() {
            const style = document.createElement("style");
            style.dataset.dsiFeature = feature.id;
            style.textContent = FEATURE_CSS[feature.id];
            document.head.append(style);
            return () => style.remove();
        }
    }));
}
