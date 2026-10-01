import test from "node:test";
import assert from "node:assert/strict";
import { createMessenger } from "../site/messenger.mjs";
test("drafts remain isolated and survive closing and reopening a conversation", () => {
    const chat = createMessenger();
    chat.setDraft("Unsent operator message");
    chat.open("avery"); assert.equal(chat.getDraft(), "");
    chat.setDraft("Unsent Avery message");
    chat.close("avery"); chat.open("operator"); assert.equal(chat.getDraft(), "Unsent operator message");
    chat.open("avery"); assert.equal(chat.getDraft(), "Unsent Avery message");
    chat.setDraft(""); assert.equal(chat.getDraft(), "");
});
test("switching contacts retains history and avoids duplicate tabs", () => {
    const chat = createMessenger(); assert.equal(chat.open("missing"), false);
    chat.open("avery"); chat.send("Test signal", "12:00"); chat.open("crew"); chat.open("avery");
    assert.equal(chat.state.open.filter(id => id === "avery").length, 1);
    assert.equal(chat.conversations.get("avery")[0].text, "Test signal");
    assert.equal(chat.conversations.get("crew").length, 1);
});
test("closing active tabs selects a remaining conversation and preserves history", () => {
    const chat = createMessenger(); chat.close("operator");
    assert.equal(chat.state.active, "crew"); assert.equal(chat.close("crew"), false);
    chat.open("operator"); assert.equal(chat.conversations.get("operator").length, 3);
});
test("composer rejects empty and oversized messages and preserves literal text", () => {
    const chat = createMessenger();
    assert.equal(chat.send("   ", "12:00"), false); assert.equal(chat.send("x".repeat(2001), "12:00"), false);
    assert.equal(chat.send("<img onerror=alert(1)>", "12:00"), true);
    assert.equal(chat.conversations.get("operator").at(-1).text, "<img onerror=alert(1)>");
});

test("profile changes affect new messages and preserve earlier author identity", () => {
    const chat=createMessenger();chat.send("Before rename","12:00");
    assert.equal(chat.setIdentity("   "),false);assert.equal(chat.setIdentity("x".repeat(33)),false);assert.equal(chat.setIdentity(null),false);
    assert.equal(chat.setIdentity(" Night Operator "),true);chat.send("After rename","12:01");
    assert.equal(chat.conversations.get("operator").at(-2).author,"RAiiNMAN");
    assert.equal(chat.conversations.get("operator").at(-1).author,"Night Operator");
});
