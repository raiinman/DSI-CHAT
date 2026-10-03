import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectDiscordCompatibility } from '../src/plugins/compatibility.mjs';

test('compatibility probes reject lookalike origins and non-channel routes before accessing the DOM', () => {
  const document = {get documentElement(){throw Error('MUST_NOT_READ');}, querySelector(){throw Error('MUST_NOT_READ');}};
  for (const url of ['https://discord.com.evil.invalid/channels/@me', 'http://discord.com/channels/@me',
    'https://discord.com:8443/channels/@me', 'https://discord.com/login', 'https://user:secret@discord.com/channels/@me', null, {}]) {
    const report = inspectDiscordCompatibility({document,url});
    assert.equal(report.host,'unsupported');assert.deepEqual(report.observations,{});
    assert.ok(report.plugins.every(plugin=>plugin.target==='outside-supported-route'));
    assert.equal(JSON.stringify(report).includes('secret'),false);
  }
});

test('DOM presence distinguishes context from effects without reading or returning private content', () => {
  const privateValue='PRIVATE_ACCOUNT_CHANNEL_MESSAGE_SENTINEL';
  const element={get textContent(){throw Error(privateValue);},getAttribute(){throw Error(privateValue);}};
  const document={documentElement:element,querySelector:selector=>selector.includes('contenteditable')||selector.includes('pre')?null:element};
  const report=inspectDiscordCompatibility({document,url:'https://discord.com/channels/123456789/987654321?private='+privateValue});
  assert.equal(report.state,'shell-structure-observed');
  assert.equal(report.plugins.find(plugin=>plugin.id==='readable-code').target,'not-found-in-current-context');
  assert.equal(report.plugins.find(plugin=>plugin.id==='larger-text').target,'matched');
  assert.ok(report.plugins.every(plugin=>plugin.effect==='unverified'));
  assert.equal(report.liveFeatureParity,'unverified');
  for(const secret of [privateValue,'123456789','987654321'])assert.equal(JSON.stringify(report).includes(secret),false);
  document.querySelector=()=>element;
  assert.equal(inspectDiscordCompatibility({document,url:'https://discord.com/channels/@me'}).state,'conversation-structure-observed');
});

test('missing or throwing DOM probes remain unavailable without echoing exception details', () => {
  const report=inspectDiscordCompatibility({document:{get documentElement(){throw Error('SECRET');},querySelector(){throw Error('SECRET');}},url:'https://discord.com/channels/@me'});
  assert.equal(report.state,'structure-not-observed');
  assert.ok(report.plugins.every(plugin=>plugin.target==='probe-unavailable'));
  assert.equal(JSON.stringify(report).includes('SECRET'),false);
});
