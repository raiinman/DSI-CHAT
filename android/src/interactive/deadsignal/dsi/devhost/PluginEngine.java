package interactive.deadsignal.dsi.devhost;

import java.util.*;

/** Original DSI API 1 native lifecycle. No external client/runtime discovery. */
public final class PluginEngine implements AutoCloseable {
    public interface Starter { void start(ResourceScope scope) throws Exception; }
    public static final class ResourceScope implements AutoCloseable {
        private final List<AutoCloseable> resources=new ArrayList<>();
        public void own(AutoCloseable resource) { if(resource==null) throw new IllegalArgumentException("Cleanup required"); resources.add(resource); }
        public void close() throws Exception { Exception failure=null; for(int i=resources.size()-1;i>=0;i--) try { resources.get(i).close(); } catch(Exception error) { failure=error; } resources.clear(); if(failure!=null) throw failure; }
    }
    public static final class Plugin {
        public final String id;
        public final int apiVersion;
        public final List<String> capabilities, dependencies, conflicts;
        public final Starter starter;
        public Plugin(String id, int apiVersion, List<String> capabilities, List<String> dependencies, List<String> conflicts, Starter starter) {
            if (id == null || !id.matches("[a-z][a-z0-9-]{0,63}") || starter == null) throw new IllegalArgumentException("Invalid native plugin");
            this.id=id; this.apiVersion=apiVersion; this.capabilities=new ArrayList<>(capabilities);
            this.dependencies=new ArrayList<>(dependencies); this.conflicts=new ArrayList<>(conflicts); this.starter=starter;
        }
    }
    private final LinkedHashMap<String,Plugin> registry = new LinkedHashMap<>();
    private final LinkedHashMap<String,AutoCloseable> active = new LinkedHashMap<>();
    private final Set<String> capabilities;
    private final LinkedHashMap<String,String> states = new LinkedHashMap<>();
    private final ArrayList<String> errors = new ArrayList<>();
    public PluginEngine(Set<String> capabilities) { this.capabilities=new HashSet<>(capabilities); }
    public void register(Plugin plugin) {
        if (registry.containsKey(plugin.id)) throw new IllegalArgumentException("Duplicate plugin: "+plugin.id);
        registry.put(plugin.id, plugin);
    }
    public Map<String,String> states() { return Collections.unmodifiableMap(new LinkedHashMap<>(states)); }
    public List<String> errors() { return Collections.unmodifiableList(new ArrayList<>(errors)); }
    private void stop(String id) {
        AutoCloseable cleanup=active.remove(id);
        if (cleanup != null) try { cleanup.close(); } catch (Exception error) { record(id,"cleanup",error); }
    }
    private void record(String id,String phase,Exception error) {
        if(errors.size()==100) errors.remove(0);
        errors.add(id+" "+phase+": "+error.getClass().getSimpleName()+": "+String.valueOf(error.getMessage()));
    }
    private boolean visit(String id, Set<String> wanted, Set<String> visiting, Set<String> complete, List<String> order) {
        if(complete.contains(id)) return !states.getOrDefault(id,"").startsWith("blocked");
        Plugin plugin=registry.get(id);
        if(plugin==null) return false;
        if(!visiting.add(id)) { states.put(id,"blocked: dependency cycle"); return false; }
        String reason=null;
        if(plugin.apiVersion!=1) reason="unsupported API";
        for(String capability:plugin.capabilities) if(!capabilities.contains(capability)) reason="missing capability "+capability;
        for(String conflict:plugin.conflicts) if(wanted.contains(conflict)) reason="conflict "+conflict;
        for(Plugin other:registry.values()) if(wanted.contains(other.id)&&other.conflicts.contains(id)) reason="conflict "+other.id;
        if(reason==null) for(String dependency:plugin.dependencies) {
            if(!wanted.contains(dependency)||!visit(dependency,wanted,visiting,complete,order)) { reason="unavailable dependency "+dependency; break; }
        }
        visiting.remove(id); complete.add(id);
        if(reason!=null) { states.put(id,"blocked: "+reason); return false; }
        order.add(id); return true;
    }
    public void reconcile(Set<String> enabled, boolean safeMode) {
        Set<String> wanted=new HashSet<>(enabled);
        states.clear();
        List<String> order=new ArrayList<>(); Set<String> complete=new HashSet<>();
        for(String id:registry.keySet()) if(wanted.contains(id)&&!safeMode) visit(id,wanted,new HashSet<>(),complete,order);
        List<String> running=new ArrayList<>(active.keySet()); Collections.reverse(running);
        for(String id:running) if(!order.contains(id)) stop(id);
        for(String id:order) {
            Plugin plugin=registry.get(id);
            boolean dependenciesRunning=true;
            for(String dependency:plugin.dependencies) if(!active.containsKey(dependency)) dependenciesRunning=false;
            if(!dependenciesRunning) { stop(id); states.put(id,"blocked: dependency failed"); continue; }
            if(!active.containsKey(id)) {
                ResourceScope scope=new ResourceScope();
                try { plugin.starter.start(scope); active.put(id,scope); }
                catch(Exception error) { record(id,"start",error); try { scope.close(); } catch(Exception cleanupError) { record(id,"rollback",cleanupError); } states.put(id,"failed: start"); continue; }
            }
            states.put(id,"active");
        }
        for(String id:registry.keySet()) if(!states.containsKey(id)) states.put(id,safeMode?"safe mode":"disabled");
    }
    public void close() { List<String> running=new ArrayList<>(active.keySet()); Collections.reverse(running); for(String id:running)stop(id); for(String id:registry.keySet())states.put(id,"stopped"); }
}
