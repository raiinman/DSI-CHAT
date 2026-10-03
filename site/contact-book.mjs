import { CONTACTS } from "./messenger.mjs";

const defaults = () => ({ groups: [{id:"contacts",name:"My contacts"},{id:"stations",name:"My stations"}], contacts: Object.fromEntries(CONTACTS.map(c => [c.id,{group:c.id === "crew" ? "stations" : "contacts",favorite:false}])) });
const validName = name => typeof name === "string" && name.trim().length > 0 && name.trim().length <= 32;
export function createContactBook(saved) {
    const state = defaults();
    if (Array.isArray(saved?.groups)) {
        const seen = new Set();
        const groups = saved.groups.filter(g => g && typeof g.id === "string" && /^[a-z0-9-]{1,48}$/.test(g.id) && validName(g.name) && !seen.has(g.id) && seen.add(g.id)).slice(0,12).map(g => ({id:g.id,name:g.name.trim()}));
        if (groups.some(g => g.id === "contacts") && groups.some(g => g.id === "stations")) state.groups = groups;
    }
    for (const contact of CONTACTS) {
        const savedContact = saved?.contacts?.[contact.id];
        if (state.groups.some(g => g.id === savedContact?.group)) state.contacts[contact.id].group = savedContact.group;
        state.contacts[contact.id].favorite = savedContact?.favorite === true;
    }
    const unique = (name, except) => !state.groups.some(g => g.id !== except && g.name.toLowerCase() === name.trim().toLowerCase());
    return {
        state,
        assign(id, group, favorite) {
            if (!Object.hasOwn(state.contacts,id) || !state.groups.some(g => g.id === group)) return false;
            state.contacts[id] = {group,favorite:favorite === true}; return true;
        },
        add(name) {
            if (!validName(name) || !unique(name) || state.groups.length >= 12) return false;
            let n = 1; while (state.groups.some(g => g.id === "group-"+n)) n++;
            state.groups.push({id:"group-"+n,name:name.trim()}); return true;
        },
        rename(id, name) {
            const group = state.groups.find(g => g.id === id);
            if (!group || !validName(name) || !unique(name,id)) return false;
            group.name = name.trim(); return true;
        },
        remove(id) {
            if (["contacts","stations"].includes(id) || !state.groups.some(g => g.id === id)) return false;
            for (const contact of Object.values(state.contacts)) if (contact.group === id) contact.group = "contacts";
            state.groups = state.groups.filter(g => g.id !== id); return true;
        },
        matches(query, favoritesOnly = false) {
            const needle = String(query).trim().toLowerCase();
            return CONTACTS.filter(c => (!favoritesOnly || state.contacts[c.id].favorite) && [c.name,c.note,state.groups.find(g => g.id === state.contacts[c.id].group).name].some(text => text.toLowerCase().includes(needle)));
        }
    };
}
