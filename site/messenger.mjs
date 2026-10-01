export const CONTACTS = [
    { id: "operator", name: "DSI Operator", initials: "DS", presence: "on", note: "Signal is clear" },
    { id: "avery", name: "Avery", initials: "AV", presence: "on", note: "At the control desk" },
    { id: "morgan", name: "Morgan", initials: "MO", presence: "away", note: "Back in a few" },
    { id: "crew", name: "Night Shift", initials: "NS", presence: "on", note: "The crew is on air" }
];
export function createMessenger() {
    const conversations = new Map(CONTACTS.map(contact => [contact.id, []]));
    conversations.get("operator").push(
        { author: "DSI Operator", text: "Welcome back. Buddy list on the left, conversations over here.", time: "00:01", self: false },
        { author: "RAiiNMAN", text: "That's more my speed. Give this station its own personality.", time: "00:02", self: true },
        { author: "DSI Operator", text: "Open a contact, switch tabs, or send a local test message. Appearance controls are in Preferences.", time: "00:03", self: false }
    );
    conversations.get("crew").push({ author: "Night Shift", text: "This is the local crew room. No network is connected.", time: "00:01", self: false });
    const state = { open: ["operator", "crew"], active: "operator" };
    function open(id) { if (!conversations.has(id)) return false; if (!state.open.includes(id)) state.open.push(id); state.active = id; return true; }
    function close(id) {
        const index = state.open.indexOf(id);
        if (index < 0 || state.open.length === 1) return false;
        state.open.splice(index, 1);
        if (state.active === id) state.active = state.open[Math.min(index, state.open.length - 1)];
        return true;
    }
    function send(text, time) {
        const trimmed = String(text).trim();
        if (!trimmed || trimmed.length > 2000) return false;
        conversations.get(state.active).push({ author: "RAiiNMAN", text: trimmed, time, self: true }); return true;
    }
    return { state, conversations, open, close, send };
}
