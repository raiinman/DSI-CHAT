import { FEATURES, FeatureRuntime, normalizeSettings } from "./src/core.mjs";
import { browserFeatures } from "./src/features.mjs";
import { CONTACTS, createMessenger } from "./messenger.mjs";
import { initContactTools } from "./contact-tools.mjs";
import { initWorkspaceTools } from "./workspace-tools.mjs";
const byId = id => document.getElementById(id);
const key = "dsiChat.site.preview.v1";
// The preview has complete themes; Discord's Signal CSS belongs to the extension.
const previewFeatures = FEATURES.filter(feature => feature.id !== "signal-theme");
const runtime = new FeatureRuntime(browserFeatures(document).filter(feature => feature.id !== "signal-theme"));
const model = createMessenger();
// Fictional sample conversation for reviewing the original concept's composition.
model.conversations.get("avery").push(
    {author:"RAiiNMAN",text:"Hey — you around?",time:"19:14",self:true},
    {author:"Avery",text:"Yeah, I'm here.\nJust wrapping up some assets. What's up?",time:"19:15",self:false},
    {author:"RAiiNMAN",text:"Wanted to check on the broadcast build.\nEverything still looking good for tonight?",time:"19:16",self:true},
    {author:"Avery",text:"Yep. All systems are green on my end.\nRunning a final pass now, then we should be set.",time:"19:17",self:false},
    {author:"RAiiNMAN",text:"Perfect. Ping me if you need a hand.",time:"19:18",self:true},
    {author:"Avery",text:"Will do. 👍",time:"19:19",self:false}
);
let settings = normalizeSettings();
let theme = "day";
let signalPlaying = true;
let motionOverride = false;
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let persistent = true;
try {
    const stored = JSON.parse(localStorage.getItem(key));
    settings = normalizeSettings(stored);
    theme = ["dark", "day", "contrast"].includes(stored?.theme) ? stored.theme : settings.enabled["signal-theme"] ? "contrast" : "day";
    settings.enabled["signal-theme"] = false;
    signalPlaying = stored?.signalPlaying !== false;
    motionOverride = stored?.motionOverride === true;
} catch { persistent = false; }
function appearance() {
    byId("safe-mode").checked = settings.safeMode; byId("features").disabled = settings.safeMode;
    for (const feature of previewFeatures) byId(feature.id).checked = settings.enabled[feature.id];
    const result = runtime.reconcile(settings);
    document.documentElement.dataset.theme = theme;
    const signalActive = signalPlaying && !result.active.includes("reduced-motion") && (!motionPreference.matches || motionOverride);
    document.documentElement.dataset.signalPlaying = String(signalActive);
    byId("signal-toggle").textContent = signalActive ? "Pause" : "Play";
    byId("signal-toggle").setAttribute("aria-label", (signalActive ? "Pause" : "Play") + " signal animation");
    byId("signal-label").textContent = signalActive ? "Signal active" : "Signal paused";
    byId("workspace-theme").value = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === "day" ? "#eee4d4" : theme === "contrast" ? "#000000" : "#293a34";
    byId("active-count").textContent = result.active.length + " features active";
    byId("status").textContent = settings.safeMode ? "Safe mode active. Choices retained." : "Appearance applied to this workspace.";
    if (result.errors.length) byId("status").textContent = "A feature could not start. Try safe mode.";
    if (!persistent) byId("status").textContent += " Changes apply for this visit.";
}
function save() { try { localStorage.setItem(key, JSON.stringify({ ...settings, theme, signalPlaying, motionOverride })); persistent = true; } catch { persistent = false; } appearance(); }
byId("safe-mode").addEventListener("change", event => { settings.safeMode = event.target.checked; save(); });
for (const feature of previewFeatures) byId(feature.id).addEventListener("change", event => { settings.enabled[feature.id] = event.target.checked; save(); });
byId("workspace-theme").addEventListener("change", event => { theme = event.target.value; save(); });
byId("reset").addEventListener("click", () => { settings = normalizeSettings(); theme = "day"; signalPlaying = true; motionOverride = false; save(); });
byId("signal-toggle").addEventListener("click", () => {
    signalPlaying = document.documentElement.dataset.signalPlaying !== "true";
    if (signalPlaying) { settings.enabled["reduced-motion"] = false; motionOverride = motionPreference.matches; }
    else motionOverride = false;
    save();
});
motionPreference.addEventListener("change", appearance);

const serviceDescriptions = {
    discord: "Discord: not connected.",
    relay: "Relay: not connected.",
    local: "Local: preview ready."
};
for (const button of document.querySelectorAll(".service-button")) button.addEventListener("click", () => {
    for (const other of document.querySelectorAll(".service-button")) other.setAttribute("aria-pressed", String(other === button));
    byId("service-status").textContent = serviceDescriptions[button.dataset.service];
});

let preferencesTrigger = byId("preferences-open");
for (const id of ["preferences-open", "preferences-buddy"]) byId(id).addEventListener("click", event => {
    preferencesTrigger = event.currentTarget;
    byId("preferences").showModal();
    byId("preferences-close").focus();
});
byId("preferences-close").addEventListener("click", () => byId("preferences").close());
byId("preferences").addEventListener("close", () => preferencesTrigger.focus());
byId("preferences").addEventListener("click", event => {
    if (event.target !== byId("preferences")) return;
    const bounds = byId("preferences").getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) byId("preferences").close();
});
function updateSendState() { document.querySelector(".send").disabled = !byId("message-input").value.trim(); }
function switchConversation(id, focusComposer = true) {
    model.setDraft(byId("message-input").value);
    model.open(id);
    byId("send-status").textContent = "Local preview. Nothing is sent to Discord.";
    render();
    if (focusComposer) {
        byId("message-input").focus({ preventScroll: true });
        if (matchMedia("(max-width:680px)").matches) document.querySelector(".chat-window").scrollIntoView({ behavior: "instant", block: "start" });
    }
}
byId("presence").addEventListener("change", event => { byId("self-orb").className = "orb " + event.target.value; });
let contactTools;
function contacts() { contactTools?.render(); }
function revealActiveTab() {
    const selectedTab = byId("tab-" + model.state.active);
    const strip = byId("tabs");
    const tabBounds = selectedTab.getBoundingClientRect(), stripBounds = strip.getBoundingClientRect();
    if (tabBounds.left < stripBounds.left) strip.scrollLeft += tabBounds.left - stripBounds.left - 8;
    else if (tabBounds.right > stripBounds.right) strip.scrollLeft += tabBounds.right - stripBounds.right + 8;
}
function render() {
    contacts(); byId("message-input").value = model.getDraft(); updateSendState(); const contact = CONTACTS.find(c => c.id === model.state.active);
    byId("window-title").textContent = "DSI CHAT"; byId("conversation-name").textContent = contact.name; byId("conversation-avatar").textContent = ""; byId("conversation-avatar").className = "large-avatar portrait"; byId("conversation-avatar").dataset.portrait = contact.id; byId("conversation-avatar").setAttribute("aria-hidden", "true");
    byId("sidebar-name").textContent = contact.name; byId("sidebar-note").textContent = contact.note; byId("sidebar-avatar").dataset.portrait = contact.id;
    byId("conversation-status").textContent = (contact.presence === "away" ? "Away" : "Available") + " · " + contact.note;
    byId("tabs").replaceChildren();
    for (const id of model.state.open) {
        const person = CONTACTS.find(c => c.id === id), wrapper = document.createElement("div");
        wrapper.className = "tab-wrap" + (id === model.state.active ? " active" : "");
        const tab = document.createElement("button"); tab.type = "button"; tab.className = "tab"; const thumbnail = document.createElement("span"); thumbnail.className = "tab-portrait portrait"; thumbnail.dataset.portrait = id; thumbnail.setAttribute("aria-hidden", "true"); tab.append(thumbnail, document.createTextNode(person.name)); tab.id = "tab-" + id;
        tab.setAttribute("role", "tab"); tab.setAttribute("aria-selected", String(id === model.state.active)); tab.setAttribute("aria-controls", "conversation-panel"); tab.tabIndex = id === model.state.active ? 0 : -1;
        tab.addEventListener("click", () => { switchConversation(id, false); byId("tab-" + id).focus(); });
        tab.addEventListener("keydown", event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault();
            const index = model.state.open.indexOf(id), length = model.state.open.length;
            const next = event.key === "Home" ? 0 : event.key === "End" ? length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + length) % length;
            switchConversation(model.state.open[next], false); byId("tab-" + model.state.active).focus();
        });
        wrapper.append(tab);
        if (model.state.open.length > 1) {
            const close = document.createElement("button"); close.type = "button"; close.className = "tab-close"; close.textContent = "×"; close.setAttribute("aria-label", "Close " + person.name);
            close.addEventListener("click", () => { model.close(id); render(); byId("tab-" + model.state.active).focus(); }); wrapper.append(close);
        }
        byId("tabs").append(wrapper);
    }
    revealActiveTab();
    byId("conversation-panel").setAttribute("aria-labelledby", "tab-" + model.state.active); byId("messages").replaceChildren();
    const entries = model.conversations.get(model.state.active);
    if (!entries.length) { const empty = document.createElement("p"); empty.className = "empty-conversation"; empty.textContent = "No messages yet. Write a local test message below."; byId("messages").append(empty); }
    for (const [index, entry] of entries.entries()) {
        const row = document.createElement("article"); row.id = "chat-messages-" + model.state.active + "-" + index; row.className = "message" + (entry.self ? " self" : "");
        const heading = document.createElement("div"); heading.className = "message-heading"; const author = document.createElement("strong"); author.className = "message-author"; author.textContent = entry.author; heading.append(author);
        const time = document.createElement("time"); time.textContent = entry.time; heading.append(time);
        const body = document.createElement("p"); body.textContent = entry.text; row.append(heading, body); byId("messages").append(row);
    }
    byId("history-count").textContent = entries.length + " messages in " + contact.name + ".";
    const paper = document.querySelector(".chat-paper"); paper.scrollTop = paper.scrollHeight;
}

byId("compose").addEventListener("submit", event => {
    event.preventDefault(); const input = byId("message-input");
    if (!model.send(input.value, new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))) return;
    model.setDraft(""); input.value = ""; render(); input.focus(); byId("send-status").textContent = "Added locally. Nothing sent to Discord.";
});
byId("message-input").addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); byId("compose").requestSubmit(); } });
byId("message-input").addEventListener("input", event => { model.setDraft(event.target.value); updateSendState(); });
byId("contacts-jump").addEventListener("click", () => { document.querySelector(".buddy-window").scrollIntoView({ behavior: "instant", block: "start" }); byId("contact-search").focus({ preventScroll: true }); });
initWorkspaceTools({ model, updateSendState });
contactTools = initContactTools({ model, switchConversation });
for (const [id, target, dialog] of [["nav-settings","preferences-open","preferences"],["sidebar-card","contact-info","contact-dialog"],["sidebar-history","history-toggle","archive-dialog"]]) byId(id).addEventListener("click", () => {
    byId(target).click();
    byId(dialog).addEventListener("close", () => byId(id).focus({preventScroll:true}), {once:true});
});
byId("nav-contacts").addEventListener("click", () => { document.querySelector(".buddy-window").scrollIntoView({block:"nearest"}); byId("contact-search").focus({preventScroll:true}); });
byId("nav-chat").addEventListener("click", () => { byId("message-input").scrollIntoView({block:"nearest"}); byId("message-input").focus({preventScroll:true}); });
appearance(); render();
new ResizeObserver(revealActiveTab).observe(byId("tabs"));
