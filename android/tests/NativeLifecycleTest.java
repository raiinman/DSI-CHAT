import interactive.deadsignal.dsi.devhost.PluginEngine;
import java.util.*;

public final class NativeLifecycleTest {
    static int assertions;
    static void check(boolean success,String name){if(!success)throw new AssertionError(name); assertions++;}
    static PluginEngine.Plugin plugin(String id,List<String> caps,List<String> deps,List<String> conflicts,PluginEngine.Starter start){return new PluginEngine.Plugin(id,1,caps,deps,conflicts,start);}
    static List<String> list(String... values){return Arrays.asList(values);}
    static Set<String> set(String... values){return new HashSet<>(list(values));}
    public static void main(String[] args) {
        PluginEngine engine=new PluginEngine(set("native.views")); List<String> events=new ArrayList<>();
        engine.register(plugin("base",list("native.views"),list(),list(),scope->{events.add("base start");scope.own(()->events.add("base stop"));}));
        engine.register(plugin("child",list(),list("base"),list(),scope->{events.add("child start");scope.own(()->events.add("child stop"));}));
        engine.reconcile(set("child","base"),false);
        check(events.equals(list("base start","child start")),"Dependency order");
        engine.reconcile(set("child","base"),false); check(events.size()==2,"Repeated reconcile keeps running plugins");
        engine.reconcile(set("base","child"),true); check(events.equals(list("base start","child start","child stop","base stop")),"Safe mode reverse cleanup");
        check(engine.states().get("child").equals("safe mode"),"Safe mode states");
        engine.reconcile(set("base","child"),false); check(engine.states().get("child").equals("active"),"Saved choices reactivate");
        engine.reconcile(set("child"),false);check(engine.states().get("child").startsWith("blocked"),"Missing selected dependency blocked");
        engine.register(plugin("discord",list("discord.runtime"),list(),list(),scope->{throw new AssertionError("Must not start unsupported native Discord plugin");}));
        engine.reconcile(set("discord"),false); check(engine.states().get("discord").contains("missing capability"),"Unavailable host blocked");
        engine.register(plugin("broken",list(),list(),list(),scope->{scope.own(()->events.add("rollback"));throw new IllegalStateException("fixture failure");}));
        engine.register(plugin("dependent",list(),list("broken"),list(),scope->{throw new AssertionError("Broken dependency must not start");}));
        engine.reconcile(set("broken","dependent","base"),false);
        check(events.contains("rollback"),"Partial start resources rolled back");check(engine.states().get("dependent").contains("dependency failed"),"Failure isolated from dependents");check(engine.states().get("base").equals("active"),"Unrelated plugin survives failure");
        engine.register(plugin("first",list(),list("second"),list(),scope->{}));engine.register(plugin("second",list(),list("first"),list(),scope->{}));engine.reconcile(set("first","second"),false);
        check(engine.states().get("first").startsWith("blocked")&&engine.states().get("second").startsWith("blocked"),"Cycle blocked");
        engine.register(plugin("exclusive",list(),list(),list("base"),scope->{}));engine.reconcile(set("base","exclusive"),false);check(engine.states().get("base").startsWith("blocked")&&engine.states().get("exclusive").startsWith("blocked"),"Symmetric conflict prevention");
        boolean rejected=false;try{engine.register(plugin("base",list(),list(),list(),scope->{}));}catch(IllegalArgumentException error){rejected=true;}check(rejected,"Duplicate rejected");
        engine.register(new PluginEngine.Plugin("future",2,list(),list(),list(),scope->{}));engine.reconcile(set("future"),false);check(engine.states().get("future").contains("unsupported API"),"Unsupported API blocked");
        engine.register(plugin("cleanup-failure",list(),list(),list(),scope->{scope.own(()->{events.add("earlier cleanup");});scope.own(()->{throw new IllegalStateException("cleanup failure");});}));
        engine.reconcile(set("cleanup-failure"),false);engine.close();check(events.contains("earlier cleanup"),"Cleanup continues after resource failure");check(engine.errors().size()>=2,"Errors reported");
        engine.close();check(engine.states().get("cleanup-failure").equals("stopped"),"Idempotent disposal");
        System.out.println("Native lifecycle acceptance: "+assertions+" assertions passed.");
    }
}
