package interactive.deadsignal.dsi.devhost;

import android.app.Activity;
import android.animation.ObjectAnimator;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import org.json.*;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Native adapter fixture. It intentionally has no WebView or network permission. */
public final class MainActivity extends Activity {
    private SharedPreferences storage;
    private PluginEngine engine;
    private final Set<String> enabled=new HashSet<>();
    private boolean safeMode, changing;
    private TextView diagnostic, message, pulse;
    private CheckBox safe;
    private LinearLayout sample;
    private ObjectAnimator animator;
    private String report;
    private int dp(int value) { return Math.round(value*getResources().getDisplayMetrics().density); }
    private TextView label(String text,int size) {
        TextView view=new TextView(this); view.setText(text); view.setTextSize(size); view.setTextColor(Color.rgb(37,49,45)); view.setPadding(0,dp(6),0,dp(6)); return view;
    }
    private void ownEffect(PluginEngine.ResourceScope scope,Runnable apply,Runnable restore) { scope.own(()->restore.run()); apply.run(); }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        storage=getSharedPreferences("dsi.native.settings.v1",MODE_PRIVATE);
        boolean recovering=false;
        try {
            recovering=storage.getBoolean("launchIncomplete",false);
            safeMode=storage.getBoolean("safeMode",false)||recovering;
            enabled.addAll(storage.getStringSet("enabled",Collections.emptySet()));
            enabled.retainAll(new HashSet<>(Arrays.asList("native-readable-text","native-compact-layout","native-reduced-motion")));
        } catch(ClassCastException invalid) { safeMode=true; recovering=true; enabled.clear(); }
        save(); storage.edit().putBoolean("launchIncomplete",true).commit();
        ScrollView scroll=new ScrollView(this);
        LinearLayout page=new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setPadding(dp(20),dp(32),dp(20),dp(24)); page.setBackgroundColor(Color.rgb(244,245,241)); scroll.addView(page);
        page.addView(label("DSI Native Lab",28));
        page.addView(label("Original Android adapter • API 1",14));
        page.addView(label("Native development host. Discord Android attachment is unavailable. These controls change the local fixture below.",16));
        if(recovering) page.addView(label("Recovery: previous active session did not stop cleanly. Safe mode retained your saved plugin choices.",16));
        safe=new CheckBox(this); safe.setText("Safe mode — stop all plugins"); safe.setChecked(safeMode); page.addView(safe);
        page.addView(label("Reviewed native plugins",20));
        sample=new LinearLayout(this); sample.setOrientation(LinearLayout.VERTICAL); sample.setBackgroundColor(Color.WHITE); sample.setPadding(dp(16),dp(16),dp(16),dp(16));
        pulse=label("● Native activity indicator",14); pulse.setContentDescription("Decorative native activity indicator"); sample.addView(pulse);
        message=label("Fixture message\nPlugins run against these native Android views. Nothing is sent to Discord.",18); sample.addView(message);
        engine=new PluginEngine(new HashSet<>(Arrays.asList("storage","native.views","diagnostics")));
        engine.register(plugin("native-readable-text",scope->ownEffect(scope,()->message.setTextSize(22),()->message.setTextSize(18))));
        engine.register(plugin("native-compact-layout",scope->ownEffect(scope,()->sample.setPadding(dp(8),dp(4),dp(8),dp(4)),()->sample.setPadding(dp(16),dp(16),dp(16),dp(16)))));
        engine.register(plugin("native-reduced-motion",scope->ownEffect(scope,()->{ stopPulse(); pulse.setAlpha(1f); },()->startPulse())));
        addPlugin(page,"native-readable-text","Readable text","Enlarges the native fixture text.");
        addPlugin(page,"native-compact-layout","Compact native layout","Reduces the fixture container padding.");
        addPlugin(page,"native-reduced-motion","Reduced native motion","Stops the decorative Android indicator pulse.");
        page.addView(label("Local native fixture",20)); page.addView(sample);
        page.addView(label("Capability diagnostics",20)); diagnostic=label("",14); diagnostic.setTextIsSelectable(true); page.addView(diagnostic);
        Button export=new Button(this); export.setText("Export diagnostics"); export.setOnClickListener(view->{ report=diagnostics().toString(); Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT); intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("application/json"); intent.putExtra(Intent.EXTRA_TITLE,"dsi-native-diagnostics.json"); startActivityForResult(intent,7); }); page.addView(export);
        Button stop=new Button(this); stop.setText("Stop native host"); stop.setOnClickListener(view->finish()); page.addView(stop);
        safe.setOnCheckedChangeListener((button,checked)->{ if(changing)return; safeMode=checked; save(); reconcile(); });
        setContentView(scroll);
        // Insets keep controls clear of Android 15 edge-to-edge system bars.
        scroll.setOnApplyWindowInsetsListener((view,insets)->{ page.setPadding(dp(20),dp(20)+insets.getSystemWindowInsetTop(),dp(20),dp(20)+insets.getSystemWindowInsetBottom()); return insets; });
        startPulse(); reconcile();
    }
    private PluginEngine.Plugin plugin(String id,PluginEngine.Starter start) { return new PluginEngine.Plugin(id,1,Arrays.asList("native.views"),Collections.emptyList(),Collections.emptyList(),start); }
    private void addPlugin(LinearLayout page,String id,String name,String description) {
        CheckBox box=new CheckBox(this); box.setText(name); box.setChecked(enabled.contains(id)); page.addView(box); page.addView(label(description,14));
        box.setOnCheckedChangeListener((button,checked)->{ if(checked)enabled.add(id);else enabled.remove(id); save(); reconcile(); });
    }
    private void save() { storage.edit().putInt("schemaVersion",1).putBoolean("safeMode",safeMode).putStringSet("enabled",new HashSet<>(enabled)).apply(); }
    private void reconcile() { engine.reconcile(enabled,safeMode); diagnostic.setText("Available: storage, native.views, diagnostics\nUnavailable: discord.runtime, browser.styles\n\n"+statesText()); android.util.Log.i("DSI_NATIVE",diagnostics().toString()); }
    private String statesText() { StringBuilder text=new StringBuilder(); for(Map.Entry<String,String> item:engine.states().entrySet())text.append(item.getKey()).append(": ").append(item.getValue()).append('\n'); for(String error:engine.errors())text.append(error).append('\n'); return text.toString(); }
    private JSONObject diagnostics() {
        JSONObject data=new JSONObject(); try { data.put("schemaVersion",1); data.put("apiVersion",1); data.put("platform","android"); data.put("host","native-development-fixture"); data.put("discordAttached",false); data.put("safeMode",safeMode); data.put("capabilities",new JSONArray(Arrays.asList("storage","native.views","diagnostics"))); data.put("unsupported",new JSONArray(Arrays.asList("discord.runtime","browser.styles"))); data.put("states",new JSONObject(engine.states())); data.put("errors",new JSONArray(engine.errors())); }catch(JSONException impossible){throw new IllegalStateException(impossible);} return data;
    }
    private void startPulse() { stopPulse(); if(pulse==null)return; animator=ObjectAnimator.ofFloat(pulse,"alpha",1f,.45f,1f); animator.setDuration(2000); animator.setRepeatCount(ObjectAnimator.INFINITE); animator.start(); }
    private void stopPulse() { if(animator!=null){animator.cancel(); animator=null;} if(pulse!=null)pulse.setAlpha(1f); }
    @Override protected void onActivityResult(int request,int result,Intent data) { super.onActivityResult(request,result,data); if(request==7&&result==RESULT_OK&&data!=null&&data.getData()!=null){ try(OutputStream output=getContentResolver().openOutputStream(data.getData())){ if(output==null)throw new IllegalStateException("Document unavailable"); output.write(report.getBytes(StandardCharsets.UTF_8)); Toast.makeText(this,"Diagnostics exported",Toast.LENGTH_SHORT).show(); }catch(Exception error){Toast.makeText(this,"Export failed: "+error.getMessage(),Toast.LENGTH_LONG).show();} } }
    @Override protected void onStop(){ super.onStop(); storage.edit().putBoolean("launchIncomplete",false).apply(); stopPulse(); }
    @Override protected void onRestart(){ super.onRestart(); storage.edit().putBoolean("launchIncomplete",true).apply(); startPulse(); if(engine.states().getOrDefault("native-reduced-motion","").equals("active"))stopPulse(); }
    @Override protected void onDestroy(){ if(engine!=null)engine.close(); stopPulse(); super.onDestroy(); }
}
