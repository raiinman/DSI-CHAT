import { CONTACTS } from "./messenger.mjs";

export function initWorkspaceTools({model, updateSendState}) {
    const byId = id => document.getElementById(id);
    const profileKey = "dsiChat.localProfile.v1";
    let profile = {name:"RAiiNMAN", note:"Your station. Your signal."};
    try {
        const saved = JSON.parse(localStorage.getItem(profileKey));
        if (model.setIdentity(saved?.name)) profile.name = model.state.selfName;
        if (typeof saved?.note === "string") profile.note = saved.note.slice(0,80);
    } catch { /* Local profile remains usable when storage is unavailable. */ }
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="archive-dialog" class="tool-dialog window" aria-labelledby="archive-title">
        <div class="titlebar"><h2 id="archive-title">Conversation archive</h2><button data-dismiss aria-label="Close archive">×</button></div>
        <div class="tool-body"><p class="tool-note">Messages from this tab. Refresh clears the archive.</p>
          <label class="tool-field">Search this conversation<input id="archive-search" type="search" placeholder="Search messages or authors…"></label>
          <p id="archive-summary" class="tool-note" role="status"></p><div id="archive-results" class="archive-results"></div>
          <div class="tool-actions"><button id="archive-export" type="button">Export conversation .txt</button></div>
        </div></dialog>
      <dialog id="contact-dialog" class="tool-dialog window" aria-labelledby="contact-card-name">
        <div class="titlebar"><h2>Contact card</h2><button data-dismiss aria-label="Close contact card">×</button></div>
        <div class="tool-body"><div class="card-heading"><span id="card-portrait" class="card-portrait portrait" aria-hidden="true"></span><div><h3 id="contact-card-name"></h3><p id="card-presence"></p></div></div>
        <dl class="card-details"><dt>Station</dt><dd>DSI local workspace</dd><dt>Status</dt><dd id="card-note"></dd><dt>Connection</dt><dd>Sample contact · no network connected</dd></dl>
        <div class="tool-actions"><button id="card-compose" type="button">Write a message</button></div></div></dialog>
      <dialog id="profile-dialog" class="tool-dialog window" aria-labelledby="profile-title">
        <div class="titlebar"><h2 id="profile-title">Your station profile</h2><button data-dismiss aria-label="Close profile">×</button></div>
        <form id="profile-form" class="tool-body"><div class="card-heading"><img class="profile-portrait" src="assets/dsi-fox.png" width="84" height="84" alt="DSI nine-tailed fox"><div><h3>Make it yours</h3><p class="tool-note">Saved on this browser. No account is created.</p></div></div>
        <label class="tool-field">Display name<input id="profile-name" required maxlength="32" autocomplete="nickname"></label>
        <label class="tool-field">Station note<input id="profile-note" maxlength="80" placeholder="What’s on your frequency?"></label>
        <div class="connection-list"><span>Discord <b>Not connected</b></span><span>Relay <b>Not connected</b></span><span>Local <b>Preview ready</b></span></div>
        <p id="profile-save-status" class="tool-note" role="status"></p><div class="tool-actions"><button type="submit">Save profile</button></div></form></dialog>
      <dialog id="emoji-dialog" class="tool-dialog emoji-dialog window" aria-labelledby="emoji-title">
        <div class="titlebar"><h2 id="emoji-title">Add a reaction</h2><button data-dismiss aria-label="Close emoji picker">×</button></div>
        <div class="tool-body"><p class="tool-note">Insert an emoji into your message.</p><div id="emoji-grid" class="emoji-grid"></div></div></dialog>`);
    let trigger = null;
    const show = (id, opener) => { trigger = opener; byId(id).showModal(); };
    for (const dialog of document.querySelectorAll(".tool-dialog")) {
        dialog.querySelector("[data-dismiss]").addEventListener("click", () => dialog.close());
        dialog.addEventListener("close", () => {
            byId("history-toggle").setAttribute("aria-expanded", "false");
            if (trigger?.isConnected) trigger.focus({preventScroll:true});
        });
        dialog.addEventListener("click", event => {
            if (event.target !== dialog) return;
            const box=dialog.getBoundingClientRect();
            if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) dialog.close();
        });
    }
    const profileButton=document.createElement("button");
    profileButton.type="button";profileButton.id="profile-open";profileButton.className="profile-edit";profileButton.setAttribute("aria-label","Edit your station profile");profileButton.textContent="Edit profile";
    document.querySelector(".identity-deck").append(profileButton);
    const noteDisplay=document.createElement("p");noteDisplay.id="profile-note-display";document.querySelector(".identity-deck").append(noteDisplay);
    function applyProfile() {
        document.querySelector(".identity-center strong").textContent=profile.name;
        profileButton.title=profile.note;
        noteDisplay.textContent=profile.note;noteDisplay.title=profile.note;
    }
    applyProfile();
    profileButton.addEventListener("click",()=>{
        byId("profile-name").value=profile.name;byId("profile-note").value=profile.note;
        byId("profile-save-status").textContent="Changes affect your local display name and new messages.";
        show("profile-dialog",profileButton);
    });
    byId("profile-form").addEventListener("submit",event=>{
        event.preventDefault();
        if(!model.setIdentity(byId("profile-name").value)) {byId("profile-name").setCustomValidity("Enter a name with 1–32 characters.");byId("profile-name").reportValidity();return;}
        profile={name:model.state.selfName,note:byId("profile-note").value.trim().slice(0,80)};
        try{localStorage.setItem(profileKey,JSON.stringify(profile));}catch{byId("send-status").textContent="Profile changed for this visit; browser storage is unavailable.";}
        applyProfile();byId("profile-dialog").close();
    });
    byId("profile-name").addEventListener("input",()=>byId("profile-name").setCustomValidity(""));
    const cardButton=document.createElement("button");cardButton.type="button";cardButton.id="contact-info";cardButton.textContent="Contact card";
    document.querySelector(".chat-toolbar").insertBefore(cardButton,byId("preferences-chat"));
    cardButton.addEventListener("click",()=>{
        const contact=CONTACTS.find(c=>c.id===model.state.active);
        byId("card-portrait").dataset.portrait=contact.id;byId("contact-card-name").textContent=contact.name;
        byId("card-presence").textContent=contact.presence==="away"?"Away":"Available";byId("card-note").textContent=contact.note;
        show("contact-dialog",cardButton);
    });
    byId("card-compose").addEventListener("click",()=>{trigger=byId("message-input");byId("contact-dialog").close();});
    function archive() {
        const query=byId("archive-search").value.toLowerCase().trim();
        const entries=model.conversations.get(model.state.active);
        const matches=entries.filter(e=>(e.author+" "+e.text).toLowerCase().includes(query));
        byId("archive-summary").textContent=matches.length+" of "+entries.length+" messages · "+CONTACTS.find(c=>c.id===model.state.active).name;
        const results=byId("archive-results");results.replaceChildren();
        for(const entry of matches) {
            const row=document.createElement("article"),heading=document.createElement("strong"),body=document.createElement("p");
            heading.textContent=entry.time+" · "+entry.author;body.textContent=entry.text;row.append(heading,body);results.append(row);
        }
        if(!matches.length){const empty=document.createElement("p");empty.className="archive-empty";empty.textContent=query?"No messages match your search.":"No messages in this conversation yet.";results.append(empty);}
        byId("archive-export").disabled=entries.length===0;
    }
    byId("history-toggle").addEventListener("click",()=>{
        byId("archive-search").value="";archive();byId("history-toggle").setAttribute("aria-expanded","true");show("archive-dialog",byId("history-toggle"));
    });
    byId("archive-search").addEventListener("input",archive);
    byId("archive-export").addEventListener("click",()=>{
        const id=model.state.active,contact=CONTACTS.find(c=>c.id===id);
        const text="DSI CHAT — local conversation with "+contact.name+"\n\n"+model.conversations.get(id).map(e=>e.time+" "+e.author+"\n"+e.text).join("\n\n");
        const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));
        const link=document.createElement("a");link.href=url;link.download="dsi-chat-"+id+".txt";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const emojis=[["🙂","Smile"],["👍","Thumbs up"],["🔥","Fire"],["🦊","Fox"],["📡","Signal"],["🎮","Game"],["🛠️","Tools"],["☕","Coffee"],["🌙","Night"],["⚡","Power"],["✅","Check"],["🧡","Orange heart"],["🎧","Headphones"],["🚀","Launch"],["👀","Eyes"],["💬","Chat"]];
    let selection={start:0,end:0};
    byId("emoji").addEventListener("click",()=>{const input=byId("message-input");selection={start:input.selectionStart,end:input.selectionEnd};show("emoji-dialog",byId("emoji"));});
    for(const [symbol,label] of emojis){
        const button=document.createElement("button");button.type="button";button.textContent=symbol;button.setAttribute("aria-label",label);button.title=label;
        button.addEventListener("click",()=>{const input=byId("message-input");const next=input.value.slice(0,selection.start)+symbol+input.value.slice(selection.end);if(next.length>2000)return;input.setRangeText(symbol,selection.start,selection.end,"end");model.setDraft(input.value);updateSendState();trigger=input;byId("emoji-dialog").close();});
        byId("emoji-grid").append(button);
    }
}
