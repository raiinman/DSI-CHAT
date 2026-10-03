import { FEATURE_CSS } from "../features.mjs";
import { validateManifest } from "./runtime.mjs";

const definitions = [
    ["signal-theme", "Signal theme", "Charcoal Discord surfaces with orange highlights.", FEATURE_CSS["signal-theme"] + `
        :root { --text-normal: #eeeae3; --text-muted: #bfc4cd; --header-primary: #eeeae3; --header-secondary: #bfc4cd; }
        [role="main"] { color: #eeeae3 !important; }
        [role="main"] pre, [role="main"] code, [role="main"] time { color: #eeeae3 !important; }
        [role="main"] a[href] { color: #f2a461 !important; }
    `],
    ["compact-messages", "Compact messages", "Reduce vertical spacing between visible messages.", FEATURE_CSS["compact-messages"]],
    ["reduced-motion", "Reduced motion", "Suppress animations, transitions and smooth scrolling.", FEATURE_CSS["reduced-motion"]],
    ["keyboard-focus", "Keyboard focus", "Make keyboard focus rings easier to see.", "*:focus-visible { outline: 3px solid #f2a461 !important; outline-offset: 3px !important; }"],
    ["readable-code", "Readable code", "Wrap long code lines and use clear, spacious code text.", "[role=\"main\"] pre, [role=\"main\"] code { font-family: ui-monospace, Consolas, monospace !important; line-height: 1.6 !important; tab-size: 4 !important; } [role=\"main\"] pre { white-space: pre-wrap !important; overflow-wrap: anywhere !important; }"],
    ["larger-text", "Larger message text", "Choose readable message text from 14 to 28 pixels without changing stored messages.", settings => `[id^="chat-messages-"] [class*="messageContent"], [role="log"] [data-message-content] { font-size: ${settings.size}px !important; line-height: 1.65 !important; }`],
    ["clear-links", "Clear links", "Underline visible message links and give them a clearer focus target.", "[role=\"main\"] a[href] { text-decoration: underline !important; text-underline-offset: 3px !important; }"],
    ["media-fit", "Fit large media", "Keep visible images and videos within their conversation width.", "[role=\"log\"] img, [role=\"log\"] video, [id^=\"chat-messages-\"] video { max-width: 100% !important; max-height: 60vh !important; object-fit: contain !important; }"],
    ["calm-typing", "Hide typing indicator", "Hide the visible typing indicator locally.", "[data-typing-indicator], [class*=\"typingDots\"], [class*=\"typing_\"] { display: none !important; }"],
    ["wide-scrollbars", "Wider scrollbars", "Make scrollable regions easier to grab with a pointer.", "* { scrollbar-width: auto !important; } ::-webkit-scrollbar { width: 14px !important; height: 14px !important; } ::-webkit-scrollbar-thumb { border: 3px solid transparent; background-clip: padding-box; border-radius: 8px; }"],
    ["full-timestamps", "Full timestamps", "Show full local date/time in the tooltip of visible timestamp elements.", null],
    ["link-destinations", "Link destinations", "Show the actual destination URL in visible link tooltips.", null]
];
export const BUILTIN_MANIFESTS = Object.freeze(definitions.map(([id, name, description, css]) => validateManifest({
    id, name, description, version: "0.2.0", apiVersion: 1, platforms: ["browser", "windows"],
    capabilities: css ? ["styles"] : ["dom", "events"], dependencies: [], conflicts: [],
    settings: id === "larger-text" ? {size: {type:"number",default:18,min:14,max:28,step:1,label:"Text size (px)"}} : {}
})));
function tooltips(document, scope, selector, titleFor) {
    const changes = new Map();
    const restore = (element, value) => {
        if (element.getAttribute("title") !== value.owned) return;
        if (value.previous === null) element.removeAttribute("title");
        else element.setAttribute("title", value.previous);
    };
    const update = () => {
        for (const [element, value] of changes) {
            if (!element.isConnected || !element.matches(selector) || !titleFor(element)) {
                restore(element, value); changes.delete(element);
            }
        }
        for (const element of document.querySelectorAll(selector)) {
            const title = titleFor(element);
            if (!title) continue;
            const previous = changes.get(element);
            if (previous?.owned === title && element.getAttribute("title") === title) continue;
            if (!previous) changes.set(element, { previous: element.getAttribute("title"), owned: title });
            else previous.owned = title;
            element.setAttribute("title", title);
        }
    };
    scope.own(() => {
        for (const [element, value] of changes) {
            restore(element, value);
        }
        changes.clear();
    });
    update();
    const Observer = document.defaultView?.MutationObserver;
    if (!Observer) throw new Error("DOM observer unavailable");
    const observer = new Observer(update);
    observer.observe(document.body, { childList: true, subtree: true,
        attributes: true, attributeFilter: ["href", "datetime"] });
    scope.own(() => observer.disconnect());
}
export function createBuiltinPlugins(document) {
    return definitions.map(([id, , , css], index) => ({
        manifest: BUILTIN_MANIFESTS[index],
        start({ scope, settings }) {
            if (css) return scope.style(document, id, typeof css === "function" ? css(settings) : css);
            if (id === "full-timestamps") tooltips(document, scope, "time[datetime]", element => {
                const date = new Date(element.getAttribute("datetime"));
                return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
            });
            if (id === "link-destinations") tooltips(document, scope, "[role=\"main\"] a[href]", element => {
                try {
                    const url = new URL(element.getAttribute("href"), document.baseURI);
                    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
                } catch { return null; }
            });
        }
    }));
}
