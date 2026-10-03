package interactive.deadsignal.dsi.manager;
import android.content.*;
public final class UpdateReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context context,Intent intent){ManagerUpdater.result(context,intent);}
}
