package interactive.deadsignal.dsi.bootstrap;

import android.app.*;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.*;
import android.widget.*;
import java.util.*;

/** Original non-root bootstrap; inserted only into an explicitly selected local APK. */
public final class Bootstrap implements Application.ActivityLifecycleCallbacks {
    private static Bootstrap instance;
    private final SharedPreferences storage;
    private final PluginEngine engine;
    private final Set<String> enabled=new HashSet<>();
    private final Set<Activity> activities=Collections.newSetFromMap(new WeakHashMap<Activity,Boolean>());
    private final Map<TextView,Float> textSizes=new WeakHashMap<>();
    private final Map<TextView,float[]> lineSpacing=new WeakHashMap<>();
    private final Map<Window,Integer> windowAnimations=new WeakHashMap<>();
    private final Map<Activity,ViewTreeObserver.OnGlobalLayoutListener> listeners=new WeakHashMap<>();
    private boolean safeMode,readable,compact,motion;
    public static synchronized void install(Application app) {
        if(instance!=null)return;
        try { instance=new Bootstrap(app);app.registerActivityLifecycleCallbacks(instance);android.util.Log.i("DSI_BOOTSTRAP","Original DSI native bootstrap installed; generic native views only"); }
        catch(Exception error){android.util.Log.e("DSI_BOOTSTRAP","Bootstrap failed; host continues",error);}
    }
    private Bootstrap(Application app) {
        storage=app.getSharedPreferences("dsi.injected.settings.v1",0);
        try{safeMode=storage.getBoolean("safeMode",false);enabled.addAll(storage.getStringSet("enabled",Collections.emptySet()));}catch(ClassCastException corrupt){safeMode=true;enabled.clear();}
        enabled.retainAll(new HashSet<>(Arrays.asList("native-readable-text","native-compact-layout","native-reduced-motion")));
        engine=new PluginEngine(new HashSet<>(Arrays.asList("storage","native.views","diagnostics")));
        engine.register(plugin("native-readable-text",scope->{scope.own(()->{readable=false;restoreText();});readable=true;refresh();}));
        engine.register(plugin("native-compact-layout",scope->{scope.own(()->{compact=false;restoreSpacing();});compact=true;refresh();}));
        engine.register(plugin("native-reduced-motion",scope->{scope.own(()->{motion=false;restoreWindows();});motion=true;refresh();}));
        reconcile();
    }
    private PluginEngine.Plugin plugin(String id,PluginEngine.Starter start){return new PluginEngine.Plugin(id,1,Arrays.asList("native.views"),Collections.emptyList(),Collections.emptyList(),start);}
    private void reconcile(){engine.reconcile(enabled,safeMode);storage.edit().putInt("schemaVersion",1).putBoolean("safeMode",safeMode).putStringSet("enabled",new HashSet<>(enabled)).apply();android.util.Log.i("DSI_BOOTSTRAP","states="+engine.states()+"; safeMode="+safeMode);}
    private void refresh(){for(Activity activity:new ArrayList<>(activities))apply(activity);}
    private void apply(Activity activity){
        if(activity.isFinishing()||safeMode)return;
        try { applyViews(activity); }
        catch(RuntimeException error){
            safeMode=true;
            android.util.Log.e("DSI_BOOTSTRAP","Native view adapter failed; entering safe mode",error);
            activity.getWindow().getDecorView().post(()->reconcile());
        }
    }
    private void applyViews(Activity activity){
        if(motion){Window window=activity.getWindow();if(!windowAnimations.containsKey(window))windowAnimations.put(window,window.getAttributes().windowAnimations);if(window.getAttributes().windowAnimations!=0)window.setWindowAnimations(0);}
        walk(activity.getWindow().getDecorView());
    }
    private void walk(View view){
        if("dsi-bootstrap".equals(view.getTag()))return;
        if(view instanceof TextView){TextView text=(TextView)view;
            if(readable){Float original=textSizes.get(text);if(original==null){original=text.getTextSize();textSizes.put(text,original);}float desired=original*1.15f;if(Math.abs(text.getTextSize()-desired)>.1f)text.setTextSize(TypedValue.COMPLEX_UNIT_PX,desired);}
            if(compact){if(!lineSpacing.containsKey(text))lineSpacing.put(text,new float[]{text.getLineSpacingExtra(),text.getLineSpacingMultiplier()});if(text.getLineSpacingExtra()!=0)text.setLineSpacing(0,text.getLineSpacingMultiplier());}
        }
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)walk(group.getChildAt(i));}
    }
    private void restoreText(){for(Map.Entry<TextView,Float>entry:new ArrayList<>(textSizes.entrySet()))if(entry.getKey()!=null&&Math.abs(entry.getKey().getTextSize()-entry.getValue()*1.15f)<.1f)entry.getKey().setTextSize(TypedValue.COMPLEX_UNIT_PX,entry.getValue());textSizes.clear();}
    private void restoreSpacing(){for(Map.Entry<TextView,float[]>entry:new ArrayList<>(lineSpacing.entrySet()))if(entry.getKey()!=null&&entry.getKey().getLineSpacingExtra()==0&&entry.getKey().getLineSpacingMultiplier()==entry.getValue()[1])entry.getKey().setLineSpacing(entry.getValue()[0],entry.getValue()[1]);lineSpacing.clear();}
    private void restoreWindows(){for(Map.Entry<Window,Integer>entry:new ArrayList<>(windowAnimations.entrySet()))if(entry.getKey()!=null&&entry.getKey().getAttributes().windowAnimations==0)entry.getKey().setWindowAnimations(entry.getValue());windowAnimations.clear();}
    private void showSettings(Activity activity){
        LinearLayout box=new LinearLayout(activity);box.setTag("dsi-bootstrap");box.setOrientation(LinearLayout.VERTICAL);int pad=Math.round(16*activity.getResources().getDisplayMetrics().density);box.setPadding(pad,pad,pad,pad);
        TextView limit=new TextView(activity);limit.setText("Native view adapter only. Discord private runtime/React Native module access is unavailable. No account, message or token access.");box.addView(limit);
        CheckBox safe=new CheckBox(activity);safe.setText("Safe mode");safe.setChecked(safeMode);box.addView(safe);
        TextView status=new TextView(activity);status.setText(engine.states().toString());
        safe.setOnCheckedChangeListener((button,checked)->{safeMode=checked;reconcile();status.setText(engine.states().toString());});
        String[]ids={"native-readable-text","native-compact-layout","native-reduced-motion"};String[]names={"Readable native text (+15%)","Compact native line spacing","Reduce native window motion"};
        for(int i=0;i<ids.length;i++){final String id=ids[i];CheckBox option=new CheckBox(activity);option.setText(names[i]);option.setChecked(enabled.contains(id));option.setOnCheckedChangeListener((button,checked)->{if(checked)enabled.add(id);else enabled.remove(id);reconcile();status.setText(engine.states().toString());});box.addView(option);}
        box.addView(status);
        ScrollView scroll=new ScrollView(activity);scroll.setTag("dsi-bootstrap");scroll.addView(box);
        new AlertDialog.Builder(activity).setTitle("DSI CHAT • Native plugins").setView(scroll).setPositiveButton("Done",null).show();
    }
    @Override public void onActivityCreated(Activity activity,Bundle state){activities.add(activity);}
    @Override public void onActivityResumed(Activity activity){
        activities.add(activity);
        activity.getWindow().getDecorView().post(()->{
            if(activity.isFinishing())return;
            View content=activity.findViewById(android.R.id.content);
            if(content instanceof FrameLayout){FrameLayout frame=(FrameLayout)content;
                if(frame.findViewWithTag("dsi-bootstrap")==null){Button button=new Button(activity);button.setTag("dsi-bootstrap");button.setText("DSI");button.setContentDescription("Open DSI native plugin settings");button.setOnClickListener(view->showSettings(activity));FrameLayout.LayoutParams params=new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,ViewGroup.LayoutParams.WRAP_CONTENT,Gravity.END|Gravity.BOTTOM);params.setMargins(12,12,12,12);frame.addView(button,params);}
            }
            if(!listeners.containsKey(activity)){ViewTreeObserver.OnGlobalLayoutListener listener=()->apply(activity);listeners.put(activity,listener);activity.getWindow().getDecorView().getViewTreeObserver().addOnGlobalLayoutListener(listener);}
            apply(activity);
        });
    }
    @Override public void onActivityDestroyed(Activity activity){activities.remove(activity);ViewTreeObserver.OnGlobalLayoutListener listener=listeners.remove(activity);if(listener!=null&&activity.getWindow().getDecorView().getViewTreeObserver().isAlive())activity.getWindow().getDecorView().getViewTreeObserver().removeOnGlobalLayoutListener(listener);}
    @Override public void onActivityStarted(Activity activity){}
    @Override public void onActivityPaused(Activity activity){}
    @Override public void onActivityStopped(Activity activity){}
    @Override public void onActivitySaveInstanceState(Activity activity,Bundle state){}
}
