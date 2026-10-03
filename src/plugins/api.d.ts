/** Original DSI API 1 authoring types. Runtime validation remains authoritative. */
export type SettingValue = boolean | number | string;
export type Cleanup = () => void | Promise<void>;
interface SettingLabel { readonly label?: string; }
export type SettingSchema = SettingLabel & (
    {readonly type:'boolean'; readonly default:boolean} |
    {readonly type:'string'; readonly default:string} |
    {readonly type:'number'; readonly default:number; readonly min?:number; readonly max?:number; readonly step?:number} |
    {readonly type:'enum'; readonly default:SettingValue; readonly values:readonly SettingValue[]}
);
export interface PluginManifest {
    readonly id:string;
    readonly name?:string;
    readonly description?:string;
    readonly version:string;
    readonly apiVersion:1;
    readonly platforms:readonly string[];
    readonly capabilities?:readonly string[];
    readonly dependencies?:readonly string[];
    readonly conflicts?:readonly string[];
    readonly settings?:Readonly<Record<string,SettingSchema>>;
}
export interface ResourceScope {
    readonly signal:AbortSignal;
    own(cleanup:Cleanup):Cleanup;
    listen(target:EventTarget,type:string,listener:EventListenerOrEventListenerObject,options?:boolean|AddEventListenerOptions):Cleanup;
    style(document:Document,id:string,css:string):Cleanup;
    timer(callback:()=>void,milliseconds:number):Cleanup;
}
export interface PluginContext<Values extends Record<string,SettingValue> = Record<string,SettingValue>> {
    readonly platform:string;
    readonly settings:Readonly<Values>;
    readonly services:Readonly<Record<string,unknown>>;
    readonly scope:ResourceScope;
    readonly signal:AbortSignal;
}
export interface DSIPlugin<Values extends Record<string,SettingValue> = Record<string,SettingValue>> {
    readonly manifest:PluginManifest;
    start(context:PluginContext<Values>):void|Cleanup|Promise<void|Cleanup>;
}
