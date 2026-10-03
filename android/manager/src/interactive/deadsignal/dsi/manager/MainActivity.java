package interactive.deadsignal.dsi.manager;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.content.res.ColorStateList;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Original native guided setup. This development build installs only DSI's sample app. */
public final class MainActivity extends Activity {
    private static final int CREAM=Color.rgb(245,239,226), INK=Color.rgb(39,53,45), TEAL=Color.rgb(39,103,105), SAGE=Color.rgb(103,119,97), CLAY=Color.rgb(153,82,51);
    private final Handler ui=new Handler();
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private ManagerInstaller installer;
    private ManagerUpdater updater;
    private TextView updateStatus, updateDetail;
    private Button updateButton, updateCancel;
    private ProgressBar updateProgress;
    private boolean updateBusy, continueUpdateAfterPermission;
    private int updateGeneration;
    private LinearLayout page, steps;
    private TextView status, detail, device;
    private Button primary, cancel;
    private ProgressBar progress;
    private boolean busy, alive, resumed, continueAfterPermission;
    private String last="";
    private final Runnable poll=new Runnable(){public void run(){if(!resumed)return;refresh();if(installer!=null&&installer.state().awaitingApproval){try{installer.continueApproval(MainActivity.this);}catch(Exception e){showError(e);}}if(updater!=null&&updater.state().awaitingApproval){try{updater.continueApproval(MainActivity.this);}catch(Exception e){showError(e);}}ui.postDelayed(this,500);}};
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private GradientDrawable surface(int color,int radius,int border){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));if(border!=0)d.setStroke(dp(1),border);return d;}
    private TextView text(String value,int size,int color){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(color);v.setPadding(0,dp(5),0,dp(5));return v;}
    private LinearLayout card(){LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);c.setPadding(dp(20),dp(18),dp(20),dp(18));c.setBackground(surface(Color.rgb(255,251,243),18,Color.rgb(211,205,186)));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);lp.setMargins(0,dp(12),0,dp(6));page.addView(c,lp);return c;}
    private Button button(String value, boolean filled){Button b=new Button(this);b.setText(value);b.setAllCaps(false);b.setTextSize(17);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);b.setTextColor(filled?Color.WHITE:TEAL);b.setMinHeight(dp(56));b.setPadding(dp(16),dp(12),dp(16),dp(12));b.setBackground(new RippleDrawable(ColorStateList.valueOf(filled?Color.argb(65,255,255,255):Color.argb(40,39,103,105)),surface(filled?TEAL:Color.TRANSPARENT,14,filled?0:Color.rgb(184,197,180)),surface(Color.WHITE,14,0)));return b;}
    @Override public void onCreate(Bundle state){
        super.onCreate(state);alive=true;installer=new ManagerInstaller(this);updater=new ManagerUpdater(this);
        if(state!=null){continueAfterPermission=state.getBoolean("continueAfterPermission",false);continueUpdateAfterPermission=state.getBoolean("continueUpdateAfterPermission",false);}
        getWindow().setStatusBarColor(CREAM);getWindow().setNavigationBarColor(CREAM);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(CREAM);
        if(Build.VERSION.SDK_INT>=30){getWindow().setDecorFitsSystemWindows(false);root.setOnApplyWindowInsetsListener((v,insets)->{android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);return insets;});getWindow().getInsetsController().setSystemBarsAppearance(WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);}else root.setFitsSystemWindows(true);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);root.addView(scroll,new LinearLayout.LayoutParams(-1,-1));
        page=new LinearLayout(this);page.setOrientation(LinearLayout.VERTICAL);page.setPadding(dp(22),dp(18),dp(22),dp(24));scroll.addView(page);
        TextView brand=text("DSI  /  MANAGER",13,SAGE);brand.setLetterSpacing(.12f);brand.setTypeface(Typeface.DEFAULT,Typeface.BOLD);page.addView(brand);
        TextView title=text("A simpler start.",32,INK);title.setTypeface(Typeface.DEFAULT,Typeface.BOLD);page.addView(title);
        page.addView(text("One guided setup. Everything stays on your phone.",16,INK));
        LinearLayout compatibility=card();TextView label=text("Your phone",17,INK);label.setTypeface(Typeface.DEFAULT,Typeface.BOLD);compatibility.addView(label);
        device=text("Android "+Build.VERSION.RELEASE+" · No root needed",14,TEAL);compatibility.addView(device);
        compatibility.addView(text("Discord setup is still in development. This preview lets you try the complete installer with DSI's own sample app.",14,INK));
        LinearLayout setup=card();TextView heading=text("Try guided setup",20,INK);heading.setTypeface(Typeface.DEFAULT,Typeface.BOLD);setup.addView(heading);
        setup.addView(text("The sample app is included. No downloads, file picking or computer required.",14,INK));
        steps=new LinearLayout(this);steps.setOrientation(LinearLayout.VERTICAL);setup.addView(steps);
        status=text("Ready when you are",18,INK);status.setTypeface(Typeface.DEFAULT,Typeface.BOLD);status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);setup.addView(status);
        detail=text("We check the app, then Android asks you to confirm installation.",14,INK);setup.addView(detail);
        progress=new ProgressBar(this);progress.setIndeterminate(true);progress.setVisibility(View.GONE);setup.addView(progress,new LinearLayout.LayoutParams(dp(28),dp(28)));
        primary=button("Start guided setup",true);primary.setContentDescription("Start guided setup");LinearLayout.LayoutParams action=new LinearLayout.LayoutParams(-1,-2);action.setMargins(0,dp(16),0,dp(8));setup.addView(primary,action);primary.setOnClickListener(v->startOrContinue());
        cancel=button("Cancel setup",false);cancel.setContentDescription("Cancel setup");setup.addView(cancel,new LinearLayout.LayoutParams(-1,-2));cancel.setOnClickListener(v->cancelSetup());
        setup.removeView(primary);setup.addView(primary,2,action);page.removeView(compatibility);page.addView(compatibility);
        LinearLayout updates=card();TextView updateHeading=text("Keep DSI up to date",20,INK);updateHeading.setTypeface(Typeface.DEFAULT,Typeface.BOLD);updates.addView(updateHeading);
        updateStatus=text("Updates on your terms",16,INK);updateStatus.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);updates.addView(updateStatus);
        updateDetail=text("Check DSI releases. Downloads are verified before Android asks you to install an update.",14,INK);updates.addView(updateDetail);
        updateProgress=new ProgressBar(this);updateProgress.setVisibility(View.GONE);updates.addView(updateProgress,new LinearLayout.LayoutParams(dp(28),dp(28)));
        updateButton=button("Check for updates",true);updateButton.setContentDescription("Check for updates");LinearLayout.LayoutParams updateLp=new LinearLayout.LayoutParams(-1,-2);updateLp.setMargins(0,dp(12),0,dp(8));updates.addView(updateButton,updateLp);updateButton.setOnClickListener(v->updateAction());
        updateCancel=button("Cancel update",false);updateCancel.setContentDescription("Cancel update");updateCancel.setVisibility(View.GONE);updates.addView(updateCancel,new LinearLayout.LayoutParams(-1,-2));updateCancel.setOnClickListener(v->{continueUpdateAfterPermission=false;updateGeneration++;updater.cancel();updateBusy=false;last="";refresh();});
        Button help=button("About this preview",false);help.setContentDescription("About this preview");LinearLayout.LayoutParams helpLp=new LinearLayout.LayoutParams(-1,-2);helpLp.setMargins(0,dp(18),0,0);page.addView(help,helpLp);help.setOnClickListener(v->new AlertDialog.Builder(this).setTitle("Made for a simpler setup").setMessage("This is DSI's original installer preview. It installs only the included native sample app.\n\nDiscord integration and plugin management are not available in this build. The built-in updater checks only DSI releases and verifies each update before asking Android to install it. Your existing Discord app and its data are left alone.\n\nAndroid will ask you to allow installations from DSI Manager and confirm the install. You can cancel at any point. This is a development-signed build.").setPositiveButton("Got it",null).show());
        page.addView(text("Offline setup  ·  Verified DSI updates",11,SAGE));setContentView(root);root.requestApplyInsets();refresh();
    }
    private void step(String label,boolean complete,boolean active){TextView v=text((complete?"✓  ":active?"•  ":"○  ")+label,15,complete?TEAL:active?INK:SAGE);v.setPadding(0,dp(7),0,dp(7));steps.addView(v);}
    private void refresh(){
        if(!alive)return;
        ManagerInstaller.State s=installer.state();ManagerUpdater.UpdateState u=updater.state();String key=u.phase+"|"+u.message+"|"+u.versionCode+"|"+updateBusy+"|"+s.phase+"|"+s.message+"|"+s.installed+"|"+s.prepared+"|"+busy+"|"+getPackageManager().canRequestPackageInstalls();if(key.equals(last))return;last=key;
        steps.removeAllViews();boolean permission=getPackageManager().canRequestPackageInstalls();
        step("Check the included app",s.prepared||s.installed,busy);
        step("Allow Android installation",permission||s.installed,s.prepared&&!permission);
        step("Confirm and open",s.installed,s.prepared&&permission&&!s.installed);
        progress.setVisibility(busy?View.VISIBLE:View.GONE);primary.setEnabled(!busy);primary.setAlpha(busy?.65f:1);
        cancel.setVisibility(!s.installed&&(busy||s.prepared||s.sessionId>=0)?View.VISIBLE:View.GONE);cancel.setEnabled(!busy);
        if(s.installed){status.setText("Sample app ready");detail.setText("Setup is complete. Open your sample app to try DSI's native controls. Discord integration is still in development.");primary.setText("Open sample app");primary.setContentDescription("Open sample app");}
        else if(busy){status.setText("Checking your sample app…");detail.setText("Verifying the included app before installation.");primary.setText("Preparing…");}
        else if(s.signerConflict){status.setText("Existing app needs attention");detail.setText(s.message);primary.setText("Check again");primary.setContentDescription("Retry setup");}
        else if("ERROR".equals(s.phase)||"CANCELLED".equals(s.phase)){status.setText("CANCELLED".equals(s.phase)?"Setup paused":"Let's try again");detail.setText(s.message);primary.setText("Retry setup");primary.setContentDescription("Retry setup");}
        else if(s.prepared&&!permission){status.setText("One Android permission");detail.setText("Allow installations from DSI Manager on the next screen, then return here. It only permits this app to request an install; Android still asks you to confirm.");primary.setText("Continue setup");primary.setContentDescription("Continue setup");}
        else if(s.sessionId>=0){status.setText("Waiting for Android");detail.setText(s.message);primary.setText("Continue setup");primary.setContentDescription("Continue setup");}
        else {status.setText("Ready when you are");detail.setText("We check the app, then Android asks you to confirm installation.");primary.setText(s.prepared?"Continue setup":"Start guided setup");primary.setContentDescription(s.prepared?"Continue setup":"Start guided setup");}
        updateProgress.setVisibility(updateBusy?View.VISIBLE:View.GONE);updateButton.setEnabled(!updateBusy);updateButton.setAlpha(updateBusy?.65f:1);
        updateCancel.setVisibility(updateBusy||u.prepared||u.sessionId>=0?View.VISIBLE:View.GONE);
        updateDetail.setText(u.message==null||u.message.isEmpty()?"Checks only DSI releases. Your settings stay in place.":u.message);
        if(updateBusy){updateStatus.setText("DOWNLOADING".equals(u.phase)?"Downloading verified update…":"Checking DSI releases…");updateButton.setText("Please wait…");}
        else if(u.prepared||u.sessionId>=0){updateStatus.setText(u.sessionId>=0?"Waiting for Android":"Update verified");updateButton.setText(u.sessionId>=0?"Continue update":"Install update");updateButton.setContentDescription("Update DSI Manager");}
        else if(u.updateAvailable){updateStatus.setText("DSI Manager "+u.versionName+" is available");updateButton.setText("Update DSI Manager");updateButton.setContentDescription("Update DSI Manager");}
        else {updateStatus.setText("UP_TO_DATE".equals(u.phase)||"INSTALLED".equals(u.phase)?"You are up to date":"ERROR".equals(u.phase)?"Update check needs attention":"CANCELLED".equals(u.phase)?"Update paused":"Updates on your terms");updateButton.setText("Check for updates");updateButton.setContentDescription("Check for updates");}
    }
    private void updateAction(){
        if(updateBusy)return;ManagerUpdater.UpdateState u=updater.state();if(u.prepared||u.sessionId>=0){requestUpdate();return;}
        boolean downloading=u.updateAvailable;final int generation=++updateGeneration;updateBusy=true;last="";refresh();worker.execute(()->{try{if(downloading)updater.download();else updater.check();ui.post(()->{if(!alive||generation!=updateGeneration)return;updateBusy=false;last="";refresh();if(downloading&&updater.state().prepared)requestUpdate();});}catch(Exception e){ui.post(()->{if(!alive)return;updateBusy=false;if("CANCELLED".equals(updater.state().phase)){last="";refresh();}else showError(e);});}});
    }
    private void requestUpdate(){try{if(!getPackageManager().canRequestPackageInstalls()){continueUpdateAfterPermission=true;installer.requestInstallPermission(this);}else updater.requestUpdate(this);last="";refresh();}catch(Exception e){showError(e);}}
    private void startOrContinue(){
        if(busy)return;ManagerInstaller.State s=installer.state();if(s.installed){try{installer.openInstalled(this);}catch(Exception e){showError(e);}return;}
        if(s.prepared&&!s.signerConflict){continueInstall();return;}
        busy=true;last="";refresh();worker.execute(()->{try{installer.prepare();ui.post(()->{if(!alive)return;busy=false;last="";refresh();if(installer.state().prepared&&!installer.state().signerConflict)continueInstall();});}catch(Exception e){ui.post(()->{if(!alive)return;busy=false;showError(e);});}});
    }
    private void continueInstall(){try{if(!getPackageManager().canRequestPackageInstalls()){continueAfterPermission=true;installer.requestInstallPermission(this);}else installer.install(this);last="";refresh();}catch(Exception e){showError(e);}}
    private void cancelSetup(){try{continueAfterPermission=false;installer.cancel();last="";refresh();}catch(Exception e){showError(e);}}
    private void showError(Exception e){last="";refresh();new AlertDialog.Builder(this).setTitle("Setup needs attention").setMessage(e.getMessage()==null?"Please try again.":e.getMessage()).setPositiveButton("OK",null).show();}
    @Override protected void onResume(){super.onResume();resumed=true;ui.removeCallbacks(poll);ui.post(poll);if(installer!=null&&continueAfterPermission&&getPackageManager().canRequestPackageInstalls()){continueAfterPermission=false;continueInstall();}if(updater!=null&&continueUpdateAfterPermission&&getPackageManager().canRequestPackageInstalls()){continueUpdateAfterPermission=false;requestUpdate();}}
    @Override protected void onPause(){resumed=false;ui.removeCallbacks(poll);super.onPause();}
    @Override protected void onSaveInstanceState(Bundle out){out.putBoolean("continueAfterPermission",continueAfterPermission);out.putBoolean("continueUpdateAfterPermission",continueUpdateAfterPermission);super.onSaveInstanceState(out);}
    @Override protected void onDestroy(){alive=false;resumed=false;ui.removeCallbacksAndMessages(null);worker.shutdown();if(installer!=null)installer.close();if(updater!=null)updater.close();super.onDestroy();}
}
