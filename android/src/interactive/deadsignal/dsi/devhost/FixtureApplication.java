package interactive.deadsignal.dsi.devhost;
import android.app.Application;
public final class FixtureApplication extends Application {
    @Override public void onCreate(){super.onCreate();android.util.Log.i("DSI_FIXTURE","Original Application preserved");}
}
