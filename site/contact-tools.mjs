import { CONTACTS } from "./messenger.mjs";
import { createContactBook } from "./contact-book.mjs";

export function initContactTools({model, switchConversation}) {
    const byId = id => document.getElementById(id), key = "dsiChat.contactBook.v1";
    let saved; try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Use defaults. */ }
    const book = createContactBook(saved);
    let favoritesOnly = false, selected = null, returnFocus = null;
    const collapsed = new Set();
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="organize-contact" class="tool-dialog window" aria-labelledby="organize-title">
        <div class="titlebar"><h2 id="organize-title">Contact actions</h2><button data-contact-dismiss aria-label="Close contact actions">×</button></div>
        <form id="organize-form" class="tool-body"><div class="card-heading"><span id="organize-portrait" class="card-portrait portrait" aria-hidden="true"></span><div><h3 id="organize-name"></h3><p class="tool-note">Organize this sample contact on your browser.</p></div></div>
          <label class="favorite-choice"><input id="contact-favorite" type="checkbox"> Favorite contact</label>
          <label class="tool-field">Local group<select id="contact-group"></select></label>
          <div class="tool-actions"><button id="organize-compose" type="button">Write a message</button><button type="submit">Save contact</button></div>
        </form></dialog>
      <dialog id="groups-dialog" class="tool-dialog window" aria-labelledby="groups-title">
        <div class="titlebar"><h2 id="groups-title">Local contact groups</h2><button data-contact-dismiss aria-label="Close groups">×</button></div>
        <div class="tool-body"><p class="tool-note">Rename groups or create your own. Removing a custom group moves its contacts to the first group; conversations and drafts stay intact.</p>
          <div id="group-editor"></div><form id="new-group-form" class="new-group"><label class="tool-field">New group<input id="new-group-name" required maxlength="32" placeholder="e.g. Broadcast crew"></label><button type="submit">Add group</button></form>
          <p id="group-status" class="tool-note" role="status"></p></div></dialog>`);
    const status = text => { byId("contact-book-status").textContent = text; };
    function save() {
        try { localStorage.setItem(key,JSON.stringify(book.state)); status("Contact organization saved on this browser."); }
        catch { status("Changes apply for this visit; browser storage is unavailable."); }
        render();
    }
    function show(id, focus) { returnFocus = focus; byId(id).showModal(); }
    for (const id of ["organize-contact","groups-dialog"]) {
        const dialog = byId(id);
        dialog.querySelector("[data-contact-dismiss]").addEventListener("click",() => dialog.close());
        dialog.addEventListener("close",() => {
            const target = typeof returnFocus === "string" ? byId(returnFocus) : returnFocus;
            (target?.isConnected ? target : byId("contact-search")).focus({preventScroll:true});
        });
    }
    function actions(contact) {
        selected = contact.id;
        byId("organize-name").textContent = contact.name; byId("organize-portrait").dataset.portrait = contact.id;
        byId("contact-favorite").checked = book.state.contacts[contact.id].favorite;
        byId("contact-group").replaceChildren();
        for (const group of book.state.groups) { const option = document.createElement("option"); option.value=group.id;option.textContent=group.name;byId("contact-group").append(option); }
        byId("contact-group").value = book.state.contacts[contact.id].group;
        show("organize-contact","actions-"+contact.id);
    }
    byId("organize-form").addEventListener("submit",event => {
        event.preventDefault();book.assign(selected,byId("contact-group").value,byId("contact-favorite").checked); save(); byId("organize-contact").close();
    });
    byId("organize-compose").addEventListener("click",() => {
        switchConversation(selected);returnFocus="message-input";byId("organize-contact").close();
    });
    function groupEditor() {
        byId("group-editor").replaceChildren();
        for (const group of book.state.groups) {
            const row=document.createElement("form");row.className="group-editor-row";
            const input=document.createElement("input");input.value=group.name;input.required=true;input.maxLength=32;input.setAttribute("aria-label","Name for "+group.name);
            input.addEventListener("input",()=>input.setCustomValidity(""));
            const rename=document.createElement("button");rename.type="submit";rename.textContent="Rename";
            row.append(input,rename);
            row.addEventListener("submit",event=>{event.preventDefault();if(!book.rename(group.id,input.value)){input.setCustomValidity("Use a unique name with 1–32 characters.");input.reportValidity();return;}save();input.value=group.name;input.setAttribute("aria-label","Name for "+group.name);byId("group-status").textContent="Group renamed.";});
            if (!["contacts","stations"].includes(group.id)) {
                const remove=document.createElement("button");remove.type="button";remove.textContent="Remove";remove.setAttribute("aria-label","Remove "+group.name);
                remove.addEventListener("click",()=>{book.remove(group.id);save();groupEditor();byId("new-group-name").focus();byId("group-status").textContent="Group removed. Contacts moved to "+book.state.groups.find(g=>g.id==="contacts").name+".";});row.append(remove);
            }
            byId("group-editor").append(row);
        }
    }
    byId("groups-open").addEventListener("click",()=>{groupEditor();byId("group-status").textContent="Saved locally · up to 12 groups.";show("groups-dialog",byId("groups-open"));});
    byId("new-group-name").addEventListener("input",()=>byId("new-group-name").setCustomValidity(""));
    byId("new-group-form").addEventListener("submit",event=>{
        event.preventDefault();const input=byId("new-group-name");
        if(!book.add(input.value)){input.setCustomValidity("Use a unique name with 1–32 characters, up to 12 groups.");input.reportValidity();return;}
        save();groupEditor();input.value="";input.focus();byId("group-status").textContent="Group added. Use a contact’s actions to move it here.";
    });
    function render() {
        const query=byId("contact-search").value.trim(), matches=book.matches(query,favoritesOnly);
        const container=byId("contacts");container.replaceChildren();
        for(const group of book.state.groups) {
            const members=matches.filter(c=>book.state.contacts[c.id].group===group.id);
            if((query || favoritesOnly) && !members.length) continue;
            const details=document.createElement("details");details.open=Boolean(query || favoritesOnly) || !collapsed.has(group.id);
            const summary=document.createElement("summary"),title=document.createElement("span"),count=document.createElement("small");title.textContent=group.name;count.textContent=String(members.length);summary.append(title,count);details.append(summary);
            details.addEventListener("toggle",()=>{if(query || favoritesOnly || !details.isConnected)return;if(details.open)collapsed.delete(group.id);else collapsed.add(group.id);});
            for(const contact of members) {
                const row=document.createElement("div");row.className="contact-row";
                const button=document.createElement("button");button.type="button";button.className="contact"+(contact.id===model.state.active?" selected":"");button.dataset.contact=contact.id;if(contact.id==="crew")button.id="crew-contact";
                const avatar=document.createElement("span");avatar.className="avatar portrait";avatar.dataset.portrait=contact.id;avatar.setAttribute("aria-hidden","true");
                const info=document.createElement("span"),name=document.createElement("strong"),note=document.createElement("small");name.textContent=contact.name;note.textContent=contact.note;info.append(name,note);
                if(book.state.contacts[contact.id].favorite){const star=document.createElement("span");star.className="favorite-mark";star.textContent=" ★";star.setAttribute("aria-label","Favorite");name.append(star);}
                const orb=document.createElement("i");orb.className="orb "+contact.presence;orb.setAttribute("aria-label",contact.presence==="away"?"Away":"Available");
                button.append(avatar,info,orb);button.addEventListener("click",()=>switchConversation(contact.id));
                const action=document.createElement("button");action.type="button";action.id="actions-"+contact.id;action.className="contact-actions";action.textContent="⋯";action.setAttribute("aria-label","Actions for "+contact.name);action.addEventListener("click",()=>actions(contact));
                row.append(button,action);details.append(row);
            }
            if(!members.length){const empty=document.createElement("p");empty.className="group-empty";empty.textContent="No contacts in this group. Move one here using ⋯.";details.append(empty);}
            container.append(details);
        }
        byId("empty-search").hidden=matches.length>0;
        byId("empty-search-title").textContent=query?"No matching contacts":"No favorites yet";
        byId("empty-search-note").textContent=query?"Try a name, status note or group. Clear search to return to your list.":"Open a contact’s ⋯ actions to mark a favorite.";
        byId("clear-contact-filters").textContent=query?"Clear search and filters":"Show all contacts";
        byId("contact-results").textContent=(query || favoritesOnly)?matches.length+" of "+CONTACTS.length+" contacts":"";
        byId("favorites-only").setAttribute("aria-pressed",String(favoritesOnly));
    }
    byId("contact-search").addEventListener("input",render);
    byId("favorites-only").addEventListener("click",()=>{favoritesOnly=!favoritesOnly;render();});
    byId("clear-contact-filters").addEventListener("click",()=>{favoritesOnly=false;byId("contact-search").value="";render();byId("contact-search").focus();});
    return {render};
}
