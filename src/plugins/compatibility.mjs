import { BUILTIN_MANIFESTS } from './builtins.mjs';

// Presence probes only. Never read account identifiers, message text or credentials.
const probes = Object.freeze({
  appShell: '#app-mount',
  mainRegion: 'main, :is(main, [role="main"])',
  messageList: '[role="log"], [id^="chat-messages-"]',
  composer: '[role="textbox"][contenteditable="true"]',
  messageRows: '[id^="chat-messages-"]',
  messageText: '[id^="chat-messages-"] [class*="messageContent"], [role="log"] [data-message-content]',
  code: ':is(main, [role="main"]) pre, :is(main, [role="main"]) code',
  links: ':is(main, [role="main"]) a[href]',
  media: '[role="log"] img, [role="log"] video, [id^="chat-messages-"] video, [id^="chat-messages-"] img',
  typing: '[data-typing-indicator], [class*="typingDots"], [class*="typing_"]',
  timestamps: 'time[datetime]'
});
const targets = Object.freeze({
  'signal-theme': 'document', 'compact-messages': 'messageRows',
  'reduced-motion': 'document', 'keyboard-focus': 'document',
  'readable-code': 'code', 'larger-text': 'messageText',
  'clear-links': 'links', 'media-fit': 'media', 'calm-typing': 'typing',
  'wide-scrollbars': 'document', 'full-timestamps': 'timestamps',
  'link-destinations': 'links'
});

export function inspectDiscordCompatibility({document, url}) {
  let supported = false;
  try {
    const parsed = typeof url === 'string' ? new URL(url) : null;
    supported = !!parsed && parsed.origin === 'https://discord.com' &&
      !parsed.username && !parsed.password && parsed.pathname.startsWith('/channels/');
  } catch {}
  const observations = {};
  if (supported) {
    try { observations.document = !!document?.documentElement; }
    catch { observations.document = null; }
    for (const [name, selector] of Object.entries(probes)) {
      try { observations[name] = typeof document?.querySelector === 'function' ? !!document.querySelector(selector) : null; }
      catch { observations[name] = null; }
    }
  }
  return {
    host: supported ? 'discord-web-channels' : 'unsupported',
    evidence: 'dom-presence-only',
    state: !supported ? 'outside-supported-route' :
      observations.messageList && observations.composer ? 'conversation-structure-observed' :
      observations.appShell || observations.mainRegion ? 'shell-structure-observed' : 'structure-not-observed',
    observations,
    plugins: BUILTIN_MANIFESTS.map(({id}) => {
      const value = observations[targets[id]];
      return {id, target: !supported ? 'outside-supported-route' : value === true ? 'matched' :
        value === false ? 'not-found-in-current-context' : 'probe-unavailable', effect: 'unverified'};
    }),
    liveFeatureParity: 'unverified'
  };
}
