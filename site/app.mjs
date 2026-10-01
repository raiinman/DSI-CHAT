import { FEATURES, FeatureRuntime, normalizeSettings } from "./src/core.mjs";
import { browserFeatures } from "./src/features.mjs";
import { CONTACTS, createMessenger } from "./messenger.mjs";
const byId = id => document.getElementById(id);
const key = "dsiChat.site.preview.v1";
const runtime = new FeatureRuntime(browserFeatures(document));
const model = createMessenger();
let settings = normalizeSettings();
let persistent = true;
try { settings = normalizeSettings(JSON.parse(localStorage.getItem(key))); } catch { persistent = false; }
function appearance() {
    byId("safe-mode").checked = settings.safeMode; byId("features").disabled = settings.safeMode;
    for (const feature of FEATURES) byId(feature.id).checked = settings.enabled[feature.id];
    const result = runtime.reconcile(settings);
    document.documentElement.dataset.signal = String(result.active.includes("signal-theme"));
    byId("active-count").textContent = result.active.length + " features active";
    byId("status").textContent = settings.safeMode ? "Safe mode active. Choices retained." : "Appearance applied to this workspace.";
    if (result.errors.length) byId("status").textContent = "A feature could not start. Try safe mode.";
    if (!persistent) byId("status").textContent += " Changes apply for this visit.";
}
function save() { try { localStorage.setItem(key, JSON.stringify(settings)); persistent = true; } catch { persistent = false; } appearance(); }
byId("safe-mode").addEventListener("change", event => { settings.safeMode = event.target.checked; save(); });
for (const feature of FEATURES) byId(feature.id).addEventListener("change", event => { settings.enabled[feature.id] = event.target.checked; save(); });
byId("reset").addEventListener("click", () => { settings = normalizeSettings(); save(); });

let preferencesTrigger = byId("preferences-open");
for (const id of ["preferences-open", "preferences-buddy", "preferences-chat"]) byId(id).addEventListener("click", event => {
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
function contacts() {
    const query = byId("contact-search").value.trim().toLowerCase(); const container = byId("contacts"); container.replaceChildren(); let count = 0;
    for (const contact of CONTACTS.filter(c => c.id !== "crew" && c.name.toLowerCase().includes(query))) {
        count++; const button = document.createElement("button"); button.type = "button"; button.className = "contact" + (contact.id === model.state.active ? " selected" : "");
        const avatar = document.createElement("span"); avatar.className = "avatar"; avatar.textContent = contact.initials;
        const info = document.createElement("span"), name = document.createElement("strong"), note = document.createElement("small");
        name.textContent = contact.name; note.textContent = contact.note; info.append(name, note);
        const orb = document.createElement("i"); orb.className = "orb " + contact.presence; orb.setAttribute("aria-label", contact.presence === "away" ? "Away" : "Available");
        button.append(avatar, info, orb); button.addEventListener("click", () => { switchConversation(contact.id); }); container.append(button);
    }
    byId("crew-contact").hidden = !"night shift".includes(query);
    if (query) for (const group of document.querySelectorAll(".contact-scroll details")) group.open = true; byId("crew-contact").classList.toggle("selected", model.state.active === "crew");
    byId("empty-search").hidden = count > 0 || !byId("crew-contact").hidden;
}
function render() {
    contacts(); byId("message-input").value = model.getDraft(); updateSendState(); const contact = CONTACTS.find(c => c.id === model.state.active);
    byId("window-title").textContent = contact.name + " — Conversation"; byId("conversation-name").textContent = contact.name; byId("conversation-avatar").textContent = contact.initials;
    byId("conversation-status").textContent = (contact.presence === "away" ? "Away" : "Available") + " · " + contact.note;
    byId("tabs").replaceChildren();
    for (const id of model.state.open) {
        const person = CONTACTS.find(c => c.id === id), wrapper = document.createElement("div");
        wrapper.className = "tab-wrap" + (id === model.state.active ? " active" : "");
        const tab = document.createElement("button"); tab.type = "button"; tab.className = "tab"; tab.textContent = person.name; tab.id = "tab-" + id;
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
    const selectedTab = byId("tab-" + model.state.active);
    const strip = byId("tabs");
    const tabBounds = selectedTab.getBoundingClientRect(), stripBounds = strip.getBoundingClientRect();
    if (tabBounds.left < stripBounds.left) strip.scrollLeft += tabBounds.left - stripBounds.left - 8;
    else if (tabBounds.right > stripBounds.right) strip.scrollLeft += tabBounds.right - stripBounds.right + 8;
    byId("conversation-panel").setAttribute("aria-labelledby", "tab-" + model.state.active); byId("messages").replaceChildren();
    const entries = model.conversations.get(model.state.active);
    if (!entries.length) { const empty = document.createElement("p"); empty.className = "empty-conversation"; empty.textContent = "No messages yet. Write a local test message below."; byId("messages").append(empty); }
    for (const [index, entry] of entries.entries()) {
        const row = document.createElement("article"); row.id = "chat-messages-" + model.state.active + "-" + index; row.className = "message" + (entry.self ? " self" : "");
        const heading = document.createElement("div"); heading.className = "message-heading"; heading.append(document.createTextNode(entry.author + " says:"));
        const time = document.createElement("time"); time.textContent = entry.time; heading.append(time);
        const body = document.createElement("p"); body.textContent = entry.text; row.append(heading, body); byId("messages").append(row);
    }
    byId("history-count").textContent = entries.length + " messages in " + contact.name + ".";
    const paper = document.querySelector(".chat-paper"); paper.scrollTop = paper.scrollHeight;
}
byId("contact-search").addEventListener("input", contacts);
byId("crew-contact").addEventListener("click", () => { switchConversation("crew"); });
byId("history-toggle").addEventListener("click", () => { byId("history").hidden = !byId("history").hidden; byId("history-toggle").setAttribute("aria-expanded", String(!byId("history").hidden)); });
byId("compose").addEventListener("submit", event => {
    event.preventDefault(); const input = byId("message-input");
    if (!model.send(input.value, new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))) return;
    model.setDraft(""); input.value = ""; render(); input.focus(); byId("send-status").textContent = "Added locally. Nothing sent to Discord.";
});
byId("message-input").addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); byId("compose").requestSubmit(); } });
byId("emoji").addEventListener("click", () => { const input = byId("message-input"); input.setRangeText(" ☺ ", input.selectionStart, input.selectionEnd, "end"); model.setDraft(input.value); updateSendState(); input.focus(); });
byId("message-input").addEventListener("input", event => { model.setDraft(event.target.value); updateSendState(); });
byId("contacts-jump").addEventListener("click", () => { document.querySelector(".buddy-window").scrollIntoView({ behavior: "instant", block: "start" }); byId("contact-search").focus({ preventScroll: true }); });
appearance(); render();
