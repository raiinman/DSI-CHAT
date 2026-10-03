import { test } from "node:test";
import assert from "node:assert/strict";
import { createContactBook } from "../site/contact-book.mjs";

test("contact organization survives serialization and repairs invalid persisted references", () => {
    const book=createContactBook();book.add("Broadcast crew");book.assign("avery","group-1",true);
    const restored=createContactBook(JSON.parse(JSON.stringify(book.state)));
    assert.deepEqual(restored.state,book.state);
    assert.equal(restored.matches("broadcast",true)[0].id,"avery");
    const damaged=createContactBook({groups:[null,{id:"contacts",name:"Friends"},{id:"contacts",name:"duplicate"},{id:"stations",name:"Stations"}],contacts:{avery:{group:"missing",favorite:"true"},crew:{group:"stations",favorite:true}}});
    assert.equal(damaged.state.groups.length,2);assert.deepEqual(damaged.state.contacts.avery,{group:"contacts",favorite:false});
    assert.equal(damaged.matches("",true)[0].id,"crew");
});
test("group edits validate names and removal preserves contacts and favorites", () => {
    const book=createContactBook();assert.equal(book.add("  "),false);assert.equal(book.add("my CONTACTS"),false);
    book.add("Crew");book.assign("avery","group-1",true);
    assert.equal(book.rename("group-1","My stations"),false);assert.equal(book.rename("group-1","Late shift"),true);
    assert.equal(book.matches("late shift")[0].id,"avery");assert.equal(book.remove("contacts"),false);
    assert.equal(book.remove("group-1"),true);assert.deepEqual(book.state.contacts.avery,{group:"contacts",favorite:true});
    assert.equal(book.assign("unknown","contacts",true),false);assert.equal(book.assign("avery","unknown",true),false);
    assert.equal(book.matches("back in a few")[0].id,"morgan");
});
