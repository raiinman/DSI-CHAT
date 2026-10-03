package interactive.deadsignal.dsi.manager;
import android.content.*;
/** Explicit private result receiver. User approval launches only from the foreground Manager. */
public final class InstallReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent){if(ManagerInstaller.ACTION_RESULT.equals(intent.getAction()))ManagerInstaller.result(context,intent);}
}
