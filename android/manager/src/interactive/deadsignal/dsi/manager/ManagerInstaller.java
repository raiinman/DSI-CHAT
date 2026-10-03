package interactive.deadsignal.dsi.manager;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import org.json.*;
import java.io.*;
import java.security.MessageDigest;
import java.util.concurrent.*;

/** Original offline PackageInstaller bridge for a reviewed DSI demonstration payload. */
public final class ManagerInstaller {
    static final String STORE="dsi.manager.install.v1";
    static final String ACTION_RESULT="interactive.deadsignal.dsi.manager.INSTALL_RESULT";
    public static final String DEMO_PACKAGE="interactive.deadsignal.dsi.managerdemo";
    public interface Listener { void onState(State state); }
    public static final class State {
        public final String phase,stage,message,payloadName,packageName,versionName,installedVersion;
        public final boolean prepared,canInstall,needsPermission,awaitingApproval,installed,signerConflict;
        public final int sessionId;
        public final long installedVersionCode;
        State(String phase,String message,boolean prepared,boolean permission,boolean installed,String installedVersion,long installedVersionCode,boolean conflict,int sessionId,boolean approval,String versionName){
            this.phase=phase;this.stage=phase;this.message=message;this.prepared=prepared;this.canInstall=permission&&!conflict;this.needsPermission=!permission;this.awaitingApproval=approval;this.installed=installed;this.installedVersion=installedVersion;this.installedVersionCode=installedVersionCode;this.signerConflict=conflict;this.sessionId=sessionId;this.payloadName="DSI Native Demo";this.packageName=DEMO_PACKAGE;this.versionName=versionName;
        }
    }
    private final Context context;
    private final SharedPreferences journal;
    private final JSONObject payload;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final Handler main=new Handler(Looper.getMainLooper());
    private volatile Listener listener;
    private volatile boolean cancelled;
    private boolean queued;
    private volatile boolean preparing;
    public ManagerInstaller(Context context){this(context,null);}
    public ManagerInstaller(Context context,Listener listener){
        this.context=context.getApplicationContext();this.listener=listener;this.journal=this.context.getSharedPreferences(STORE,Context.MODE_PRIVATE);
        try(InputStream input=this.context.getAssets().open("payload.json")){ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] buffer=new byte[4096];int read;while((read=input.read(buffer))!=-1){if(bytes.size()+read>32768)throw new IOException("Payload metadata exceeds limit");bytes.write(buffer,0,read);}payload=new JSONObject(bytes.toString("UTF-8"));if(payload.getInt("schemaVersion")!=1||!DEMO_PACKAGE.equals(payload.getString("package"))||!"native-demo.apk".equals(payload.getString("asset")))throw new IOException("Unsupported bundled payload");}
        catch(Exception error){throw new IllegalStateException("Bundled demo metadata is unavailable or invalid",error);}
        recover(true);
        if(journal.contains("approval"))journal.edit().putBoolean("approvalPresented",false).commit();
    }
    private static long version(PackageInfo info){return Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;}
    private int signatureFlags(){return Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;}
    private String certificate(PackageInfo info)throws Exception{
        Signature[] signatures;
        if(Build.VERSION.SDK_INT>=28){if(info.signingInfo==null||info.signingInfo.hasMultipleSigners())throw new IOException("Unsupported signer layout");signatures=info.signingInfo.getApkContentsSigners();}else signatures=info.signatures;
        if(signatures==null||signatures.length!=1)throw new IOException("Expected one payload signer");return hex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()));
    }
    private static String hex(byte[] value){StringBuilder result=new StringBuilder();for(byte item:value)result.append(String.format(java.util.Locale.ROOT,"%02x",item&255));return result.toString();}
    private File directory()throws IOException{File root=new File(context.getFilesDir(),"verified-demo").getCanonicalFile();if(!root.getParentFile().equals(context.getFilesDir().getCanonicalFile()))throw new IOException("Invalid private staging directory");if(!root.exists()&&!root.mkdir())throw new IOException("Private staging unavailable");return root;}
    private File staged()throws IOException{return new File(directory(),"native-demo.apk");}
    private void cleanup(){try{File folder=directory();for(String name:new String[]{"native-demo.apk","native-demo.apk.part"}){File item=new File(folder,name);if(item.exists()&&!item.delete())android.util.Log.w("DSI_MANAGER","Could not remove owned staging file");}}catch(IOException error){android.util.Log.w("DSI_MANAGER","Staging cleanup failed",error);}journal.edit().putBoolean("prepared",false).commit();}
    private void transition(String phase,String message){journal.edit().putString("phase",phase).putString("message",message).commit();android.util.Log.i("DSI_MANAGER","phase="+phase+"; "+message);emit();}
    private void emit(){Listener current=listener;if(current!=null)main.post(()->{Listener active=listener;if(active!=null)active.onState(state());});}
    private boolean permission(){return context.getPackageManager().canRequestPackageInstalls();}
    private PackageInfo installedInfo(){try{return context.getPackageManager().getPackageInfo(DEMO_PACKAGE,signatureFlags());}catch(PackageManager.NameNotFoundException absent){return null;}}
    private boolean sameSigner(PackageInfo info){try{return payload.getString("certificateSha256").equals(certificate(info));}catch(Exception unsupported){return false;}}
    private void recover(boolean interrupted){
        int id=journal.getInt("sessionId",-1);
        PackageInfo installed=installedInfo();
        if(installed!=null&&sameSigner(installed)&&version(installed)>=payload.optLong("versionCode",1)){journal.edit().putInt("sessionId",-1).remove("approval").putString("phase","INSTALLED").putString("message","The original DSI sample app is installed.").commit();cleanup();return;}
        if(id>=0){PackageInstaller.SessionInfo info=context.getPackageManager().getPackageInstaller().getSessionInfo(id);if(info==null){journal.edit().putInt("sessionId",-1).remove("approval").putString("phase","ERROR").putString("message","The previous setup session ended. Retry the guided setup.").commit();cleanup();}}
        else if(interrupted&&"PREPARING".equals(journal.getString("phase","CHECKING"))){journal.edit().putString("phase","ERROR").putString("message","Preparation was interrupted. Retry setup.").putBoolean("prepared",false).commit();cleanup();}
    }
    public State state(){
        boolean allowed=permission();PackageInfo info=installedInfo();boolean conflict=info!=null&&!sameSigner(info);boolean installed=info!=null&&!conflict&&version(info)>=payload.optLong("versionCode",1);
        String phase=journal.getString("phase","CHECKING"),message=journal.getString("message","Ready to check the bundled DSI sample app.");
        int session=journal.getInt("sessionId",-1);boolean approval=journal.contains("approval")&&session>=0&&!journal.getBoolean("approvalPresented",false);
        boolean prepared=journal.getBoolean("prepared",false);
        if(conflict){phase="ERROR";message="A different-signed sample app is already installed. Its data is preserved; automatic replacement is unavailable.";}
        else if(installed){phase="INSTALLED";message="The original DSI sample app is installed.";}
        else if(prepared&&session<0&&!"CANCELLED".equals(phase)&&!"ERROR".equals(phase)){phase=allowed?"READY":"NEEDS_PERMISSION";message=allowed?"Verified sample app is ready. Continue to Android's installation approval.":"Allow this Manager to request installation, then return here.";}
        if(Build.VERSION.SDK_INT<payload.optInt("minSdk",26)){phase="ERROR";message="This sample requires a newer Android version.";}
        return new State(phase,message,prepared,allowed&&Build.VERSION.SDK_INT>=payload.optInt("minSdk",26),installed,info==null?"":String.valueOf(info.versionName),info==null?0:version(info),conflict,session,approval,payload.optString("versionName","0.1.0"));
    }
    public void refresh(){recover(false);emit();}
    private void verify(File file)throws Exception{
        long expected=payload.getLong("bytes");if(expected<=0||expected>64L*1024*1024||file.length()!=expected)throw new IOException("Bundled APK size does not match its reviewed metadata");
        MessageDigest digest=MessageDigest.getInstance("SHA-256");try(InputStream input=new FileInputStream(file)){byte[] buffer=new byte[16384];int read;while((read=input.read(buffer))!=-1){if(cancelled)throw new InterruptedException("Setup cancelled");digest.update(buffer,0,read);}}
        if(!hex(digest.digest()).equals(payload.getString("sha256")))throw new IOException("Bundled APK integrity check failed");
        PackageInfo info=context.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(),signatureFlags());if(info==null||info.applicationInfo==null)throw new IOException("Bundled APK manifest is invalid");
        if(!DEMO_PACKAGE.equals(info.packageName)||version(info)!=payload.getLong("versionCode")||info.applicationInfo.minSdkVersion!=payload.getInt("minSdk")||Build.VERSION.SDK_INT<info.applicationInfo.minSdkVersion||!sameSigner(info))throw new IOException("Bundled APK package/version/SDK/certificate check failed");
        if((info.applicationInfo.flags&ApplicationInfo.FLAG_TEST_ONLY)!=0)throw new IOException("A test-only APK cannot be installed by phone Manager");
        PackageInfo installed=installedInfo();if(installed!=null&&!sameSigner(installed))throw new IOException("Signer conflict: the installed sample and its data are preserved");
    }
    public State prepare()throws Exception{return prepareInternal(true);}
    private State prepareInternal(boolean explicitStart)throws Exception{
        synchronized(this){if(preparing||(explicitStart&&queued))throw new IOException("Preparation or installation is already running");preparing=true;if(explicitStart)cancelled=false;}
        try{
        if(state().signerConflict)throw new IOException(state().message);
        transition("PREPARING","Checking the bundled original DSI sample app.");File target=staged(),part=new File(directory(),"native-demo.apk.part");
        try(InputStream input=context.getAssets().open(payload.getString("asset"));OutputStream output=new FileOutputStream(part)){
            byte[] buffer=new byte[16384];int read;long count=0;long expected=payload.getLong("bytes");while((read=input.read(buffer))!=-1){if(cancelled)throw new InterruptedException("Setup cancelled");count+=read;if(count>expected)throw new IOException("Bundled payload size exceeded metadata");output.write(buffer,0,read);}output.flush();
        }
        verify(part);if(cancelled)throw new InterruptedException("Setup cancelled");if(target.exists()&&!target.delete())throw new IOException("Old private staging cannot be cleared");if(!part.renameTo(target))throw new IOException("Verified private staging could not be committed");
        synchronized(this){if(cancelled)throw new InterruptedException("Setup cancelled");journal.edit().putBoolean("prepared",true).commit();transition(permission()?"READY":"NEEDS_PERMISSION",permission()?"Verified sample app is ready for installation.":"Enable installation permission, then return here.");}return state();
        }catch(Exception error){cleanup();transition(cancelled?"CANCELLED":"ERROR",cancelled?"Setup was cancelled. Existing apps are preserved.":error.getMessage());throw error;}finally{synchronized(this){preparing=false;}}
    }
    private synchronized void enqueue(Runnable action){if(queued)return;queued=true;worker.execute(()->{try{action.run();}finally{synchronized(ManagerInstaller.this){queued=false;}}});}
    public synchronized void start(){if(queued)return;if(state().installed){emit();return;}cancelled=false;enqueue(()->{try{prepareInternal(false);}catch(InterruptedException cancelledError){cleanup();transition("CANCELLED","Setup was cancelled. No existing apps were removed.");}catch(Exception error){cleanup();transition(cancelled?"CANCELLED":"ERROR",cancelled?"Setup was cancelled.":error.getMessage()==null?"Sample verification failed.":error.getMessage());}});}
    public void requestInstallPermission(Activity activity){activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+context.getPackageName())));}
    public void continueApproval(Activity activity){String stored=journal.getString("approval",null);if(stored==null)return;try{Intent approval=Intent.parseUri(stored,Intent.URI_INTENT_SCHEME);activity.startActivity(approval);journal.edit().putBoolean("approvalPresented",true).commit();transition("AWAITING_INSTALL","Review the Android installation prompt.");}catch(Exception error){transition("ERROR","Android's approval prompt could not be opened. Cancel and retry setup.");}}
    public void continueInstall(Activity activity){install(activity);}
    public synchronized void install(Activity activity){
        if(queued||preparing)return;
        State state=state();if(state.installed){openInstalled(activity);return;}if(state.signerConflict){emit();return;}if(state.awaitingApproval){continueApproval(activity);return;}if(state.sessionId>=0){emit();return;}if(!state.prepared){start();return;}if(!permission()){requestInstallPermission(activity);return;}
        cancelled=false;enqueue(()->{
            int id=-1;
            try{File file=staged();verify(file);if(cancelled)throw new InterruptedException("Setup cancelled");
                PackageInstaller installer=context.getPackageManager().getPackageInstaller();PackageInstaller.SessionParams params=new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);params.setAppPackageName(DEMO_PACKAGE);params.setSize(file.length());if(Build.VERSION.SDK_INT>=31)params.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_REQUIRED);
                id=installer.createSession(params);journal.edit().putInt("sessionId",id).remove("approval").commit();
                try(PackageInstaller.Session session=installer.openSession(id)){try(InputStream input=new FileInputStream(file);OutputStream output=session.openWrite("base.apk",0,file.length())){byte[] buffer=new byte[16384];int read;while((read=input.read(buffer))!=-1){if(cancelled)throw new InterruptedException("Setup cancelled");output.write(buffer,0,read);}session.fsync(output);}
                    Intent callback=new Intent(context,InstallReceiver.class).setAction(ACTION_RESULT).putExtra("ownedSession",id);int flags=PendingIntent.FLAG_UPDATE_CURRENT;if(Build.VERSION.SDK_INT>=31)flags|=PendingIntent.FLAG_MUTABLE;PendingIntent sender=PendingIntent.getBroadcast(context,id,callback,flags);transition("AWAITING_INSTALL","Waiting for Android's explicit installation approval.");if(cancelled)throw new InterruptedException("Setup cancelled");session.commit(sender.getIntentSender());
                }
            }catch(InterruptedException error){abandon(id);cleanup();transition("CANCELLED","Setup was cancelled. No existing apps were removed.");}catch(Exception error){abandon(id);cleanup();transition(cancelled?"CANCELLED":"ERROR",cancelled?"Setup was cancelled.":error.getMessage()==null?"Android installation could not start.":error.getMessage());}
        });
    }
    private void abandon(int id){if(id<0)return;try{context.getPackageManager().getPackageInstaller().abandonSession(id);}catch(RuntimeException alreadyEnded){android.util.Log.i("DSI_MANAGER","Owned session already ended");}journal.edit().putInt("sessionId",-1).remove("approval").commit();}
    public synchronized void cancel(){cancelled=true;abandon(journal.getInt("sessionId",-1));cleanup();transition("CANCELLED","Setup was cancelled. Installed apps and their data were preserved.");}
    public void openInstalled(Activity activity){State state=state();if(!state.installed||state.signerConflict)return;Intent launch=context.getPackageManager().getLaunchIntentForPackage(DEMO_PACKAGE);if(launch!=null)activity.startActivity(launch);else transition("ERROR","The installed sample app has no launchable activity.");}
    public void openDemo(Activity activity){openInstalled(activity);}
    public void close(){listener=null;worker.shutdown();}
    static void result(Context context,Intent intent){
        SharedPreferences journal=context.getSharedPreferences(STORE,Context.MODE_PRIVATE);int saved=journal.getInt("sessionId",-1),returned=intent.getIntExtra(PackageInstaller.EXTRA_SESSION_ID,intent.getIntExtra("ownedSession",-2));if(saved<0||returned!=saved)return;
        int status=intent.getIntExtra(PackageInstaller.EXTRA_STATUS,PackageInstaller.STATUS_FAILURE);
        if(status==PackageInstaller.STATUS_PENDING_USER_ACTION){Intent approval=intent.getParcelableExtra(Intent.EXTRA_INTENT);if(approval==null){journal.edit().putString("phase","ERROR").putString("message","Android did not supply its approval prompt.").commit();return;}journal.edit().putBoolean("approvalPresented",false).putString("approval",approval.toUri(Intent.URI_INTENT_SCHEME)).putString("phase","AWAITING_INSTALL").putString("message","Continue to Android's installation approval.").commit();android.util.Log.i("DSI_MANAGER","approval-ready");return;}
        String phase=status==PackageInstaller.STATUS_SUCCESS?"INSTALLED":status==PackageInstaller.STATUS_FAILURE_ABORTED?"CANCELLED":"ERROR";String message=status==PackageInstaller.STATUS_SUCCESS?"The original DSI sample app is installed.":status==PackageInstaller.STATUS_FAILURE_ABORTED?"Android installation was cancelled. Retry when ready.":"Android refused the installation: "+intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
        journal.edit().putString("phase",phase).putString("message",message).putInt("sessionId",-1).remove("approval").commit();
        try{ManagerInstaller owner=new ManagerInstaller(context);owner.cleanup();owner.close();}catch(RuntimeException invalid){android.util.Log.e("DSI_MANAGER","Result cleanup failed",invalid);}android.util.Log.i("DSI_MANAGER","phase="+phase);
    }
}
