import assert from "node:assert/strict";
import test from "node:test";
import { cleanUrl } from "../apps/mobile/src/lib/dsi/cleanUrl.ts";

test("removes tracking while preserving search, repeated values and fragment", () => {
    const url = new URL(cleanUrl("https://example.com/search?q=fortnite&tag=a&tag=b&utm_source=discord&fbclid=abc#results"));
    assert.equal(url.searchParams.get("q"), "fortnite");
    assert.deepEqual(url.searchParams.getAll("tag"), ["a", "b"]);
    assert.equal(url.hash, "#results");
    assert.equal(url.searchParams.has("utm_source"), false);
    assert.equal(url.searchParams.has("fbclid"), false);
});
test("does not rewrite a URL with no tracking parameters", () => {
    const input = "https://example.com/a?q=hello%20world&ref=guide";
    assert.equal(cleanUrl(input), input);
});
test("preserves signed, authentication and OAuth URLs byte for byte", () => {
    for (const key of ["X-Amz-Signature", "signature", "sig", "token", "access_token", "code", "state"]) {
        const input = `https://example.com/a?${key}=secret&utm_source=mail`;
        assert.equal(cleanUrl(input), input);
    }
});
test("accepts malformed input and non-web deep links without changes", () => {
    for (const input of ["bad url", "discord://channels/1/2?utm_source=app", "mailto:user@example.com", "javascript:alert(1)"]) {
        assert.equal(cleanUrl(input), input);
    }
});
test("removes repeated and mixed case tracking keys", () => {
    const output = new URL(cleanUrl("https://example.com/?UTM_SOURCE=a&utm_source=b&GCLID=c&id=42"));
    assert.equal(output.search, "?id=42");
});
