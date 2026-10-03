import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "../.cache/browser-qa/node_modules/playwright/index.mjs";

const root = resolve("dist/site");
const server = createServer(async (request, response) => {
    try {
        const file = resolve(root, "." + decodeURIComponent(new URL(request.url, "http://localhost").pathname), request.url === "/" ? "index.html" : "");
        if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
        const types = { ".html": "text/html", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };
        response.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
        response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
await mkdir(".cache/screenshots", { recursive: true });
const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "day", "New visitors start in Copperlight Afternoon");
    for (const [opener, dialog] of [["nav-settings","preferences"],["sidebar-card","contact-dialog"],["sidebar-history","archive-dialog"]]) {
        await page.locator("#"+opener).click();
        assert.equal(await page.locator("#"+dialog).evaluate(el=>el.open),true);
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#"+opener).evaluate(el=>el===document.activeElement),true,"New shortcut returns focus");
    }
    await page.locator("#nav-contacts").click();
    assert.equal(await page.locator("#contact-search").evaluate(el=>el===document.activeElement),true);
    await page.locator("#nav-chat").click();
    assert.equal(await page.locator("#message-input").evaluate(el=>el===document.activeElement),true);
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).waitFor();
    await page.screenshot({ path: ".cache/screenshots/desktop-default.png", fullPage: true });
    for (const asset of ["station-background.png", "contact-portraits.png", "amber-glass.png", "quiet-receiver.png", "copperlight-valley.png"]) {
        const response = await page.request.get(base + "/assets/" + asset);
        assert.equal(response.status(), 200, "Concept artwork loads: " + asset);
    }
    assert.ok((await page.locator(".compose").boundingBox()).height < 130, "Desktop composer stays compact");
    assert.equal(await page.locator(".titlebar").first().evaluate(el => getComputedStyle(el).position), "relative", "Gloss stays inside its title bar");
    const portraitPositions = await page.locator(".contact .portrait").evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundPosition));
    assert.equal(new Set(portraitPositions).size, 4, "Contacts use four distinct artwork tiles");
    await page.locator("#contacts .contact").filter({hasText:"Avery"}).click();
    await page.evaluate(() => { document.activeElement.blur(); document.querySelector(".chat-paper").scrollTop = 0; });
    await page.screenshot({path:".cache/screenshots/concept-desktop.png",fullPage:true});
    await page.reload();
    assert.equal(await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).animationName), "signal");
    const initialSignalTransform = await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).transform);
    await page.waitForFunction(initial => getComputedStyle(document.querySelector(".transmission i")).transform !== initial, initialSignalTransform);
    await page.getByRole("button", {name:"Pause signal animation",exact:true}).click();
    await page.reload();
    assert.equal(await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).animationName), "none", "Signal pause persists");
    await page.getByRole("button", {name:"Play signal animation",exact:true}).click();
    assert.equal(await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).animationName), "signal");
    await page.getByRole("button", { name: "Discord", exact: true }).click();
    assert.match(await page.locator("#service-status").innerText(), /not connected/);
    await page.getByRole("button", { name: "Local", exact: true }).click();
    assert.equal(await page.locator(".local-service").getAttribute("aria-pressed"), "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(await page.locator(".identity-center img").evaluate(el => getComputedStyle(el).animationName), "none");
    await page.getByRole("button", {name:"Play signal animation",exact:true}).click();
    assert.equal(await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).animationName), "signal", "Explicit Play restores signal under system reduced motion");
    await page.getByRole("button", {name:"Pause signal animation",exact:true}).click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", {name:"Play signal animation",exact:true}).click();
    for (const theme of ["day", "contrast", "dark"]) {
        assert.equal(await page.locator("#preferences-chat").count(), 0, "Conversation Appearance shortcut removed");
    await page.locator("#preferences-open").click();
        await page.locator("#workspace-theme").selectOption(theme);
        await page.keyboard.press("Escape");
        await page.reload();
        assert.equal(await page.locator("html").getAttribute("data-theme"), theme, "Theme persists after reload");
        assert.equal(await page.locator(".tabs").evaluate(el => getComputedStyle(el).backgroundImage), await page.locator(".chat-toolbar").evaluate(el => getComputedStyle(el).backgroundImage), "Tabs use the selected theme");
        if (theme === "contrast") {
            for (const selector of ["body", ".titlebar", ".tabs", ".identity-deck", ".chat-paper", ".compose"])
                assert.equal(await page.locator(selector).first().evaluate(el => getComputedStyle(el).backgroundImage), "none", "High contrast has no decorative gradient: " + selector);
        }
        const contrasts = await page.evaluate(() => {
            function luminance(color) {
                const channels = color.match(/[\d.]+/g).slice(0,3).map(Number).map(n => n/255).map(n => n <= .04045 ? n/12.92 : ((n+.055)/1.055)**2.4);
                return channels[0]*.2126 + channels[1]*.7152 + channels[2]*.0722;
            }
            return [[".message p", ".chat-paper"], ["#contacts .contact:not(.selected) small", ".contact-scroll"], [".identity-center strong", ".identity-deck"], ["#service-status", ".identity-deck"], ["#message-input", "#message-input"], [".option small", ".preferences-body"], ["#workspace-theme", "#workspace-theme"]].map(([text, background]) => {
                const a = luminance(getComputedStyle(document.querySelector(text)).color);
                const b = luminance(getComputedStyle(document.querySelector(background)).backgroundColor);
                return { text, ratio: (Math.max(a,b)+.05)/(Math.min(a,b)+.05) };
            });
        });
        for (const check of contrasts) assert.ok(check.ratio >= (theme === "contrast" ? 7 : 4.5), theme + " text contrast " + check.text + ": " + check.ratio);
        await page.screenshot({ path: ".cache/screenshots/theme-" + theme + ".png", fullPage: true });
        await page.locator("#actions-avery").click();
        await page.screenshot({path:".cache/screenshots/contact-actions-"+theme+".png",fullPage:true});
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#actions-avery").evaluate(el=>el===document.activeElement),true);
        await page.locator("#groups-open").click();
        await page.screenshot({path:".cache/screenshots/contact-groups-"+theme+".png",fullPage:true});
        await page.keyboard.press("Escape");
        await page.locator("#favorites-only").click();
        assert.equal(await page.locator("#empty-search").isVisible(),true);
        await page.screenshot({path:".cache/screenshots/no-favorites-"+theme+".png",fullPage:true});
        await page.locator("#clear-contact-filters").click();
        await page.locator("#preferences-open").click();
        await page.screenshot({path:".cache/screenshots/preferences-"+theme+".png",fullPage:true});
        await page.keyboard.press("Escape");
        for (const [opener, dialog, capture] of [["history-toggle","archive-dialog","archive"],["contact-info","contact-dialog","contact-card"],["profile-open","profile-dialog","profile"],["emoji","emoji-dialog","emoji-picker"]]) {
            await page.locator("#"+opener).click();
            assert.equal(await page.locator("#"+dialog).evaluate(el=>el.open),true);
            await page.screenshot({path:".cache/screenshots/"+capture+"-"+theme+".png",fullPage:true});
            await page.keyboard.press("Escape");
        }
        for (const width of [390, 768]) {
            await page.setViewportSize({width, height:844});
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, theme + " overflow at " + width);
            assert.equal(await page.locator(".send").isVisible(), true);
            const sendBounds = await page.locator(".send").boundingBox(), composerBounds = await page.locator(".compose").boundingBox();
            assert.ok(sendBounds.x >= composerBounds.x && sendBounds.x + sendBounds.width <= composerBounds.x + composerBounds.width, "Send stays inside composer at " + width);
            await page.locator(".send").scrollIntoViewIfNeeded();
            assert.equal(await page.locator(".send").evaluate(el => {
                const bounds=el.getBoundingClientRect();
                return document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2)===el;
            }),true,"Send is unobstructed at "+width);
            await page.screenshot({path:".cache/screenshots/composer-"+theme+"-"+width+".png"});
            await page.locator("#message-input").fill("Ready to send.");
            assert.equal(await page.locator(".send").isDisabled(),false);
            await page.screenshot({path:".cache/screenshots/compose-ready-"+theme+"-"+width+".png"});
            await page.locator("#message-input").fill("");
            await page.screenshot({path:".cache/screenshots/"+theme+"-"+width+".png",fullPage:true});
        }
        await page.setViewportSize({width:1440,height:1050});
    }
    assert.equal(await page.locator(".send").isDisabled(), true);
    await page.locator("#message-input").fill("Operator draft");
    await page.locator("#contacts .contact").filter({ hasText: "Avery" }).click();
    assert.equal(await page.locator("#message-input").inputValue(), "");
    await page.locator("#message-input").fill("Avery draft");
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).click();
    assert.equal(await page.locator("#message-input").inputValue(), "Operator draft");
    await page.getByRole("tab", { name: "Avery", exact: true }).click();
    assert.equal(await page.locator("#message-input").inputValue(), "Avery draft");
    assert.equal(await page.locator("#sidebar-name").innerText(), "Avery", "Sidebar follows active contact");
    await page.locator("#message-input").press("Enter");
    assert.match(await page.locator("#messages").innerText(), /Avery draft/);
    assert.equal(await page.locator("#message-input").inputValue(), "");
    await page.locator("#message-input").fill("<img src=x onerror=alert(1)>");
    await page.locator(".send").click();
    assert.equal(await page.locator("#messages img").count(), 0);
    await page.locator("#contact-search").fill("nobody matches");
    assert.equal(await page.locator("#empty-search").isVisible(), true);
    await page.locator("#contact-search").fill("");
    await page.locator("#presence").selectOption("away");
    assert.match(await page.locator("#self-orb").getAttribute("class"), /away/);
    await page.locator("#preferences-open").click();
    assert.equal(await page.locator("#preferences").evaluate(el => el.open), true);
    await page.screenshot({ path: ".cache/screenshots/preferences.png", fullPage: true });
    await page.locator("#compact-messages").check();
    await page.locator("#reduced-motion").check();
    assert.equal(await page.locator(".transmission i").first().evaluate(el => getComputedStyle(el).animationName), "none");
    assert.equal(await page.locator(".identity-center img").evaluate(el => getComputedStyle(el).animationName), "none");
    await page.locator("#safe-mode").check();
    assert.equal(await page.locator("#compact-messages").isDisabled(), true);
    await page.locator("#workspace-theme").selectOption("day");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "day", "Safe mode retains theme controls");
    await page.locator("#workspace-theme").selectOption("dark");
    await page.locator("#safe-mode").uncheck();
    assert.equal(await page.locator("#compact-messages").isChecked(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#preferences").evaluate(el => el.open), false);
    assert.equal(await page.locator("#preferences-open").evaluate(el => el === document.activeElement), true);
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).click();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.getByRole("tab", { name: "Night Shift", exact: true }).getAttribute("aria-selected"), "true");
    await page.getByRole("button", { name: "Close Night Shift", exact: true }).click();
    assert.equal(await page.getByRole("tab", { name: "Night Shift", exact: true }).count(), 0);
    await page.getByRole("tab", { name: "DSI Operator", exact: true }).click();
    await page.screenshot({ path: ".cache/screenshots/desktop.png", fullPage: true });
    for (const width of [390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Horizontal overflow at " + width);
        await page.locator("#preferences-open").click();
        assert.equal(await page.locator("#preferences").isVisible(), true);
        const box = await page.locator("#preferences").boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
        await page.keyboard.press("Escape");
        if (width === 390) {
            await page.locator("#contacts-jump").click();
            assert.equal(await page.locator("#contact-search").evaluate(el => el === document.activeElement), true);
        }
        await page.screenshot({ path: ".cache/screenshots/" + width + ".png", fullPage: true });
    }
    await page.setViewportSize({width:1440,height:844});
    await page.reload();
    const chatBounds=await page.locator(".chat-window").boundingBox();
    assert.ok(chatBounds.y+chatBounds.height<=844,"Desktop window fits an ordinary-height display");
    const crewBounds=await page.locator("#crew-contact").boundingBox(),listBounds=await page.locator(".contact-scroll").boundingBox();
    assert.ok(crewBounds.y+crewBounds.height<=listBounds.y+listBounds.height,"All four contacts fit an ordinary-height desktop");
    await page.screenshot({path:".cache/screenshots/desktop-844.png",fullPage:true});
    await page.locator("#message-input").fill("Draft survives organization");
    await page.locator("#groups-open").click();
    await page.locator("#new-group-name").fill("Broadcast crew");
    await page.getByRole("button",{name:"Add group",exact:true}).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#groups-open").evaluate(el=>el===document.activeElement),true);
    await page.locator("#actions-avery").click();
    await page.locator("#contact-favorite").check();
    await page.locator("#contact-group").selectOption({label:"Broadcast crew"});
    await page.getByRole("button",{name:"Save contact",exact:true}).click();
    await page.waitForFunction(()=>document.activeElement.id==="actions-avery");
    assert.equal(await page.locator("#message-input").inputValue(),"Draft survives organization");
    await page.locator("#favorites-only").click();
    assert.equal(await page.locator("#contacts .contact").count(),1);
    assert.match(await page.locator("#contacts").innerText(),/Avery/);
    await page.locator("#actions-avery").click();
    await page.locator("#organize-compose").click();
    await page.waitForFunction(()=>document.activeElement.id==="message-input");
    await page.getByRole("tab",{name:"DSI Operator",exact:true}).click();
    assert.equal(await page.locator("#message-input").inputValue(),"Draft survives organization");
    await page.reload();
    await page.locator("#favorites-only").click();
    assert.equal(await page.locator("#contacts .contact").count(),1,"Favorite survives reload");
    assert.match(await page.locator("#contacts summary").innerText(),/Broadcast crew/i);
    await page.locator("#contact-search").fill("unknown frequency");
    assert.equal(await page.locator("#empty-search").isVisible(),true);
    await page.screenshot({path:".cache/screenshots/contact-no-results.png",fullPage:true});
    await page.locator("#clear-contact-filters").click();
    assert.equal(await page.locator("#contacts .contact").count(),4);
    assert.equal(await page.locator("#contact-search").evaluate(el=>el===document.activeElement),true);
    for(const width of [390,768]){
        await page.setViewportSize({width,height:844});
        for(const [opener,dialog] of [["groups-open","groups-dialog"],["actions-avery","organize-contact"]]){
            await page.locator("#"+opener).click();const box=await page.locator("#"+dialog).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);assert.ok(box.y>=0&&box.y+box.height<=845);
            await page.screenshot({path:".cache/screenshots/"+dialog+"-"+width+".png",fullPage:true});await page.keyboard.press("Escape");
        }
    }
    await page.setViewportSize({width:1440,height:844});
    await page.locator("#groups-open").click();
    const custom=page.locator(".group-editor-row").filter({has:page.getByRole('textbox',{name:'Name for Broadcast crew',exact:true})});
    await custom.locator("input").fill("<b>Late shift</b>");await custom.getByRole("button",{name:"Rename",exact:true}).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#contacts summary b").count(),0,"Group labels render literal text");
    await page.locator("#contact-search").fill("late shift");assert.equal(await page.locator("#contacts .contact").count(),1);
    await page.locator("#contact-search").fill("");
    await page.locator("#groups-open").click();await page.getByRole("button",{name:"Remove <b>Late shift</b>",exact:true}).click();await page.keyboard.press("Escape");
    await page.reload();
    assert.equal(await page.locator("#contacts .contact").count(),4,"Removing group preserves contacts");
    await page.locator("#favorites-only").click();assert.equal(await page.locator("#contacts .contact").count(),1,"Removing group preserves favorite");
    await page.locator("#actions-avery").click();await page.locator("#contact-favorite").uncheck();await page.getByRole("button",{name:"Save contact",exact:true}).click();
    await page.waitForFunction(()=>document.activeElement.id==="contact-search");
    await page.locator("#clear-contact-filters").click();
    await page.locator("#contacts details").first().locator("summary").click();
    await page.locator("#contact-search").fill("control desk");assert.equal(await page.locator("#contacts .contact").count(),1);assert.equal(await page.locator("#contacts details").evaluate(el=>el.open),true);
    await page.locator("#contact-search").fill("");
    await page.reload();
    await page.locator("#contact-info").click();
    assert.equal(await page.locator("#contact-card-name").innerText(),"DSI Operator");
    await page.locator("#card-compose").click();
    await page.waitForFunction(()=>document.activeElement.id==="message-input");
    await page.locator("#message-input").fill("Signal ");
    await page.locator("#emoji").click();
    await page.getByRole("button",{name:"Fox",exact:true}).click();
    await page.waitForFunction(()=>document.activeElement.id==="message-input");
    assert.equal(await page.locator("#message-input").inputValue(),"Signal 🦊");
    await page.locator(".send").click();
    await page.locator("#history-toggle").click();
    await page.locator("#archive-search").fill("Signal 🦊");
    assert.equal(await page.locator("#archive-results article").count(),1);
    await page.locator("#archive-search").fill("no-such-archive-text");
    assert.match(await page.locator("#archive-results").innerText(),/No messages match/);
    const downloadPromise=page.waitForEvent("download");
    await page.locator("#archive-export").click();
    const download=await downloadPromise;
    assert.equal(download.suggestedFilename(),"dsi-chat-operator.txt");
    assert.match(await readFile(await download.path(),"utf8"),/Signal 🦊/);
    await page.keyboard.press("Escape");
    await page.locator("#profile-open").click();
    await page.locator("#profile-name").fill("Night Operator");
    await page.locator("#profile-note").fill("On the late frequency");
    await page.getByRole("button",{name:"Save profile",exact:true}).click();
    await page.reload();
    assert.equal(await page.locator(".identity-center strong").innerText(),"Night Operator");
    assert.equal(await page.locator("#profile-note-display").innerText(),"On the late frequency");
    await page.locator("#message-input").fill("Profile test");await page.locator(".send").click();
    assert.equal(await page.locator("#messages .message-author").last().innerText(),"Night Operator");
    await page.locator("#profile-open").click();await page.locator("#profile-name").fill("RAiiNMAN");await page.getByRole("button",{name:"Save profile",exact:true}).click();
    for (const width of [390,768]) {
        await page.setViewportSize({width,height:844});
        for(const [opener,dialog] of [["history-toggle","archive-dialog"],["profile-open","profile-dialog"],["emoji","emoji-dialog"]]){
            await page.locator("#"+opener).click();const box=await page.locator("#"+dialog).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);await page.screenshot({path:".cache/screenshots/"+dialog+"-"+width+".png",fullPage:true});await page.keyboard.press("Escape");
        }
    }
    const review = await browser.newPage({viewport:{width:1440,height:844}});
    review.on("pageerror", error => errors.push(error.message));
    await review.goto(base);
    await review.locator('.contact[data-contact="avery"]').click();
    await review.evaluate(() => {document.activeElement.blur();document.querySelector(".chat-paper").scrollTop=0;});
    await review.screenshot({path:".cache/screenshots/copperlight-desktop.png",fullPage:true});
    await review.locator("#preferences-open").click();
    await review.locator("#workspace-theme").selectOption("dark");
    await review.keyboard.press("Escape");
    await review.screenshot({path:".cache/screenshots/copperlight-night.png",fullPage:true});
    await review.locator("#preferences-open").click();
    await review.locator("#workspace-theme").selectOption("day");
    await review.keyboard.press("Escape");
    await review.setViewportSize({width:390,height:844});
    await review.screenshot({path:".cache/screenshots/copperlight-phone.png",fullPage:true});
    await review.close();
    assert.deepEqual(errors, []);
    console.log("Browser QA passed: three persistent themes, text contrast, service status, animation preferences, drafts, conversations, composition, literal text, search, presence, modal focus, safe mode and 390/768/1440 layouts.");
} finally { await browser.close(); server.close(); }
