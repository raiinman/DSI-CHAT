# Architecture

DSI CHAT is one product with two runtimes and three build targets.

`apps/mobile` vendors the pinned Revenge source. It executes in Discord Android's Metro/React Native environment through a compatible loader. It retains Bunny and Vendetta plugin APIs, loader keys and storage identities. DSI Clean Links is an original built-in mobile plugin, selectable through the normal plugin manager.

`apps/desktop` vendors the pinned Equicord source, including its Vencord-derived runtime and both plugin collections. Desktop builds include native helpers; browser builds omit plugins tagged for incompatible targets. Public Vencord globals, existing settings route identifiers and storage names remain compatible. DSI branding changes the visible settings section, browser manifests, userscript and build metadata.

The root scripts build and package both engines without installing anything into a live Discord session. Upstream automatic binary updates are disabled. Revisions are pinned in upstream.lock.json; future updates require a source diff, DSI patch reapplication and build validation.

The feature catalog describes source availability and required ports. Inclusion is not proof that a Discord patch matches the current live client. Runtime acceptance requires testing on the actual platform.

No cross-platform account-token store is added. Settings and accounts retain each engine's current storage model. No bridge transfers messages, credentials or sessions between platforms.
