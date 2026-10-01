import { defineCorePlugin } from "@core/plugins";
import { before } from "@lib/api/patcher";
import { cleanUrl } from "@lib/dsi/cleanUrl";
import { Linking } from "react-native";

export const preenabled = false;
let unpatch: (() => void) | undefined;

export default defineCorePlugin({
    manifest: {
        id: "dsi.cleanLinks",
        spec: 3,
        type: "plugin",
        version: "0.1.0",
        main: "builtin",
        display: {
            name: "DSI Clean Links",
            description: "Remove tracking parameters when opening links. Signed links remain unchanged.",
            authors: [{ name: "Dead Signal Interactive" }]
        }
    },
    start() {
        unpatch = before("openURL", Linking, args => {
            if (typeof args[0] === "string") args[0] = cleanUrl(args[0]);
        });
    },
    stop() {
        unpatch?.();
        unpatch = undefined;
    }
});
