package com.nolanabbott.nocturne;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class MainActivity extends Activity {
    private static final String PREFS = "nocturne_native";
    private final ExecutorService network = Executors.newFixedThreadPool(6);
    private final ImageLoader images = new ImageLoader();
    private final List<StremioClient.Addon> addons = Collections.synchronizedList(new ArrayList<>());
    private final Map<String, StremioClient.Item> knownItems = Collections.synchronizedMap(new LinkedHashMap<>());
    private SharedPreferences prefs;
    private FrameLayout root;
    private ImageView backdrop, heroLogo;
    private TextView heroTitle, heroMeta, heroDescription, status;
    private LinearLayout page;
    private ScrollView scroller;
    private StremioClient.Item featured;
    private String typeFilter;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        getWindow().setStatusBarColor(Color.TRANSPARENT); getWindow().setNavigationBarColor(Color.BLACK);
        buildShell(); loadAddons(); immersive();
    }

    private void buildShell() {
        root = new FrameLayout(this); root.setBackgroundColor(Color.rgb(3, 4, 8));
        backdrop = new ImageView(this); backdrop.setScaleType(ImageView.ScaleType.CENTER_CROP); backdrop.setAlpha(.58f);
        root.addView(backdrop, new FrameLayout.LayoutParams(-1, -1));
        View shade = new View(this); GradientDrawable shadeBg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{0x18000000, 0x55000000, 0xF505060A}); shade.setBackground(shadeBg);
        root.addView(shade, new FrameLayout.LayoutParams(-1, -1));

        scroller = new ScrollView(this); scroller.setFillViewport(true); scroller.setClipToPadding(false);
        page = new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setPadding(dp(34), dp(104), dp(20), dp(70));
        scroller.addView(page, new ScrollView.LayoutParams(-1, -2)); root.addView(scroller);
        root.addView(buildNavigation()); setContentView(root);
        showLoading("Connecting to catalogs…");
    }

    private View buildNavigation() {
        HorizontalScrollView navScroll = new HorizontalScrollView(this); navScroll.setHorizontalScrollBarEnabled(false);
        FrameLayout.LayoutParams nlp = new FrameLayout.LayoutParams(-1, dp(78)); nlp.setMargins(dp(26), dp(22), dp(26), 0);
        navScroll.setLayoutParams(nlp); navScroll.setBackground(glass(0xA02D2F39, 32, 0x66FFFFFF));
        LinearLayout nav = new LinearLayout(this); nav.setGravity(Gravity.CENTER_VERTICAL); nav.setPadding(dp(10), 0, dp(10), 0);
        navScroll.addView(nav, new HorizontalScrollView.LayoutParams(-2, -1));
        TextView brand = label("NOCTURNE", 18, Color.WHITE); brand.setLetterSpacing(.16f); brand.setTypeface(null, 1);
        brand.setPadding(dp(20), 0, dp(26), 0); nav.addView(brand);
        addNav(nav, "Home", () -> { typeFilter = null; buildHome(); });
        addNav(nav, "Movies", () -> { typeFilter = "movie"; buildHome(); });
        addNav(nav, "TV", () -> { typeFilter = "series"; buildHome(); });
        addNav(nav, "Search", this::showSearch);
        addNav(nav, "Library", this::showLibrary);
        addNav(nav, "Settings", this::showSettings);
        return navScroll;
    }

    private void addNav(LinearLayout nav, String text, Runnable action) {
        TextView b = glassButton(text, false); b.setOnClickListener(v -> action.run()); nav.addView(b, margins(-2, dp(54), 3, 0, 3, 0));
    }

    private void loadAddons() {
        addons.clear();
        List<String> urls = manifestUrls(); AtomicInteger pending = new AtomicInteger(urls.size()); List<String> failures = Collections.synchronizedList(new ArrayList<>());
        if (urls.isEmpty()) { urls.add(StremioClient.CINEMETA); saveManifestUrls(urls); pending.set(1); }
        for (String url : urls) network.execute(() -> {
            try { addons.add(StremioClient.loadAddon(url)); } catch (Exception e) { failures.add(shortHost(url) + ": " + e.getMessage()); }
            if (pending.decrementAndGet() == 0) runOnUiThread(() -> {
                if (addons.isEmpty()) showError("No catalogs connected", failures.isEmpty() ? "Add a Stremio manifest in Settings." : failures.get(0));
                else { buildHome(); if (!failures.isEmpty()) Toast.makeText(this, failures.size() + " addon failed to update", Toast.LENGTH_LONG).show(); }
            });
        });
    }

    private void buildHome() {
        page.removeAllViews(); knownItems.clear();
        page.addView(buildHero(), new LinearLayout.LayoutParams(-1, dp(isTv() ? 470 : 430)));
        List<StremioClient.Catalog> catalogs = allCatalogs(); int shown = 0;
        for (StremioClient.Catalog cat : catalogs) {
            if (typeFilter != null && !typeFilter.equals(cat.type)) continue;
            LinearLayout section = section(cat.name, cat.addonName); page.addView(section);
            LinearLayout rail = (LinearLayout) ((HorizontalScrollView) section.getChildAt(1)).getChildAt(0);
            ProgressBar progress = new ProgressBar(this); rail.addView(progress, margins(dp(48), dp(110), 16, 10, 16, 10));
            network.execute(() -> {
                try {
                    List<StremioClient.Item> items = StremioClient.loadCatalog(cat, 0, null);
                    runOnUiThread(() -> populateRail(rail, items));
                } catch (Exception e) { runOnUiThread(() -> { rail.removeAllViews(); TextView t = muted("Catalog unavailable"); rail.addView(t); }); }
            });
            if (++shown >= 18) break;
        }
        if (shown == 0) {
            TextView empty = muted("No matching catalogs. Add or update catalog addons in Settings."); empty.setPadding(0, dp(20), 0, dp(20)); page.addView(empty);
        }
        addSavedRails(); scroller.scrollTo(0, 0);
    }

    private View buildHero() {
        FrameLayout hero = new FrameLayout(this);
        LinearLayout copy = new LinearLayout(this); copy.setOrientation(LinearLayout.VERTICAL); copy.setGravity(Gravity.BOTTOM);
        FrameLayout.LayoutParams clp = new FrameLayout.LayoutParams(isTv() ? dp(650) : -1, -1); clp.setMargins(dp(4), 0, dp(16), dp(25)); hero.addView(copy, clp);
        heroLogo = new ImageView(this); heroLogo.setScaleType(ImageView.ScaleType.FIT_START); heroLogo.setAdjustViewBounds(true);
        copy.addView(heroLogo, new LinearLayout.LayoutParams(isTv() ? dp(390) : dp(250), dp(100)));
        heroTitle = label("NOCTURNE", isTv() ? 44 : 36, Color.WHITE); heroTitle.setTypeface(null, 1); copy.addView(heroTitle);
        heroMeta = label("Native Stremio catalog player", 15, 0xFFD8D9E0); heroMeta.setPadding(0, dp(7), 0, dp(7)); copy.addView(heroMeta);
        heroDescription = label("Your installed catalogs update this screen automatically.", 16, 0xFFE6E7EC); heroDescription.setMaxLines(3); copy.addView(heroDescription);
        LinearLayout actions = new LinearLayout(this); actions.setPadding(0, dp(18), 0, 0); copy.addView(actions);
        TextView play = glassButton("▶  Play", true); play.setOnClickListener(v -> { if (featured != null) openDetails(featured); }); actions.addView(play, margins(-2, dp(58), 0, 0, 10, 0));
        TextView add = glassButton("＋  Watchlist", false); add.setOnClickListener(v -> { if (featured != null) toggleWatchlist(featured, add); }); actions.addView(add, margins(-2, dp(58), 0, 0, 10, 0));
        return hero;
    }

    private LinearLayout section(String title, String source) {
        LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(0, dp(10), 0, dp(22));
        LinearLayout heading = new LinearLayout(this); heading.setGravity(Gravity.CENTER_VERTICAL);
        TextView h = label(title, 24, Color.WHITE); h.setTypeface(null, 1); heading.addView(h);
        TextView chip = label(source, 11, 0xFFCACCD4); chip.setPadding(dp(10), dp(4), dp(10), dp(4)); chip.setBackground(glass(0x55363846, 20, 0x33FFFFFF));
        heading.addView(chip, margins(-2, -2, 10, 0, 0, 0)); box.addView(heading);
        HorizontalScrollView scroll = new HorizontalScrollView(this); scroll.setHorizontalScrollBarEnabled(false); scroll.setClipToPadding(false);
        LinearLayout rail = new LinearLayout(this); rail.setPadding(0, dp(14), dp(30), dp(12)); scroll.addView(rail); box.addView(scroll);
        return box;
    }

    private void populateRail(LinearLayout rail, List<StremioClient.Item> items) {
        rail.removeAllViews(); int max = Math.min(items.size(), 25);
        if (max == 0) { rail.addView(muted("Nothing in this catalog right now.")); return; }
        for (int i = 0; i < max; i++) {
            StremioClient.Item item = items.get(i); knownItems.put(key(item), item); rail.addView(card(item));
            if (featured == null && item.background != null) setFeatured(item);
        }
    }

    private View card(StremioClient.Item item) {
        LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setFocusable(true); box.setClickable(true);
        int width = isTv() ? dp(190) : dp(145), height = isTv() ? dp(285) : dp(218);
        ImageView poster = new ImageView(this); poster.setScaleType(ImageView.ScaleType.CENTER_CROP); poster.setBackground(glass(0xFF171923, 18, 0x30FFFFFF)); poster.setClipToOutline(true);
        box.addView(poster, new LinearLayout.LayoutParams(width, height)); images.load(item.poster, poster);
        TextView name = label(item.name, isTv() ? 15 : 14, Color.WHITE); name.setMaxLines(1); name.setPadding(dp(4), dp(9), dp(4), 0); box.addView(name);
        String sub = item.releaseInfo == null ? titleCase(item.type) : item.releaseInfo + " · " + titleCase(item.type);
        TextView meta = label(sub, 12, 0xFFA8AAB5); meta.setMaxLines(1); meta.setPadding(dp(4), dp(3), dp(4), 0); box.addView(meta);
        box.setOnFocusChangeListener((v, has) -> {
            v.animate().scaleX(has ? 1.08f : 1f).scaleY(has ? 1.08f : 1f).translationZ(has ? dp(10) : 0).setDuration(180).start();
            poster.setBackground(glass(has ? 0xFF323847 : 0xFF171923, 18, has ? 0xCCFFFFFF : 0x30FFFFFF));
            if (has) setFeatured(item);
        });
        box.setOnClickListener(v -> openDetails(knownItems.containsKey(key(item)) ? knownItems.get(key(item)) : item));
        return withMargins(box, 0, 0, 14, 0);
    }

    private void setFeatured(StremioClient.Item item) {
        featured = item; heroTitle.setText(item.name); heroMeta.setText(metaLine(item));
        heroDescription.setText(item.description == null ? "Select to see details and available sources." : item.description);
        heroLogo.setImageDrawable(null); heroLogo.setVisibility(item.logo == null ? View.GONE : View.VISIBLE);
        if (item.logo != null) images.load(item.logo, heroLogo); if (item.background != null) images.load(item.background, backdrop);
        if (item.description == null || item.logo == null) enrich(item, this::updateHeroIfCurrent);
    }

    private void updateHeroIfCurrent(StremioClient.Item item) { if (featured != null && key(featured).equals(key(item))) setFeaturedWithoutFetch(item); }
    private void setFeaturedWithoutFetch(StremioClient.Item item) {
        featured = item; knownItems.put(key(item), item); heroTitle.setText(item.name); heroMeta.setText(metaLine(item));
        heroDescription.setText(item.description == null ? "Select to see details and available sources." : item.description);
        heroLogo.setVisibility(item.logo == null ? View.GONE : View.VISIBLE); if (item.logo != null) images.load(item.logo, heroLogo);
        if (item.background != null) images.load(item.background, backdrop);
    }

    private void enrich(StremioClient.Item item, ItemCallback callback) {
        StremioClient.Addon metaAddon = firstResource("meta"); if (metaAddon == null) return;
        network.execute(() -> { try { StremioClient.Item full = StremioClient.loadMeta(metaAddon, item.type, item.id); runOnUiThread(() -> callback.done(full)); } catch (Exception ignored) { } });
    }

    private void openDetails(StremioClient.Item seed) {
        showDetailDialog(seed);
        if (seed.description == null || seed.logo == null) enrich(seed, full -> knownItems.put(key(full), full));
    }

    private void showDetailDialog(StremioClient.Item item) {
        Dialog dialog = new Dialog(this, android.R.style.Theme_Material_NoActionBar); dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        FrameLayout shell = new FrameLayout(this); shell.setBackgroundColor(0xFF05060A);
        ImageView art = new ImageView(this); art.setScaleType(ImageView.ScaleType.CENTER_CROP); art.setAlpha(.42f); shell.addView(art, new FrameLayout.LayoutParams(-1, -1));
        if (item.background != null) images.load(item.background, art);
        View gradient = new View(this); gradient.setBackground(new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT, new int[]{0xF905060A, 0xBB05060A, 0x5505060A})); shell.addView(gradient, new FrameLayout.LayoutParams(-1, -1));
        ScrollView sv = new ScrollView(this); LinearLayout body = new LinearLayout(this); body.setOrientation(LinearLayout.VERTICAL); body.setPadding(dp(42), dp(70), dp(34), dp(50)); sv.addView(body); shell.addView(sv);
        ImageView logo = new ImageView(this); logo.setScaleType(ImageView.ScaleType.FIT_START); body.addView(logo, new LinearLayout.LayoutParams(dp(330), dp(100)));
        if (item.logo != null) images.load(item.logo, logo); else logo.setVisibility(View.GONE);
        TextView title = label(item.name, isTv() ? 42 : 34, Color.WHITE); title.setTypeface(null, 1); body.addView(title);
        TextView meta = label(metaLine(item), 16, 0xFFD5D6DC); meta.setPadding(0, dp(8), 0, dp(16)); body.addView(meta);
        TextView desc = label(item.description == null ? "No description supplied by this catalog." : item.description, 18, 0xFFE8E9ED); desc.setMaxWidth(dp(720)); desc.setLineSpacing(0, 1.15f); body.addView(desc);
        LinearLayout actions = new LinearLayout(this); actions.setPadding(0, dp(24), 0, dp(20)); body.addView(actions);
        TextView play = glassButton("▶  Choose Source", true); play.setOnClickListener(v -> chooseEpisodeOrStream(item, dialog)); actions.addView(play, margins(-2, dp(60), 0, 0, 12, 0));
        TextView watch = glassButton(inWatchlist(item) ? "✓  In Watchlist" : "＋  Watchlist", false);
        watch.setOnClickListener(v -> toggleWatchlist(item, watch)); actions.addView(watch, margins(-2, dp(60), 0, 0, 12, 0));
        TextView close = glassButton("Close", false); close.setOnClickListener(v -> dialog.dismiss()); actions.addView(close, margins(-2, dp(60), 0, 0, 0, 0));
        if (!item.videos.isEmpty()) { TextView episodes = label(item.videos.size() + " episodes available", 15, 0xFFBFC1CB); body.addView(episodes); }
        dialog.setContentView(shell); Window w = dialog.getWindow(); if (w != null) { w.setLayout(-1, -1); w.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN); }
        dialog.show(); if (w != null) w.setLayout(-1, -1);
    }

    private void chooseEpisodeOrStream(StremioClient.Item item, Dialog parent) {
        if ("series".equals(item.type) && !item.videos.isEmpty()) {
            String[] labels = new String[item.videos.size()];
            for (int i = 0; i < labels.length; i++) { StremioClient.Video v = item.videos.get(i); labels[i] = "S" + v.season + " E" + v.episode + "  " + v.title; }
            new AlertDialog.Builder(this).setTitle("Choose episode").setItems(labels, (d, which) -> findStreams(item, item.videos.get(which).id, labels[which], parent)).setNegativeButton("Cancel", null).show();
        } else findStreams(item, item.id, item.name, parent);
    }

    private void findStreams(StremioClient.Item item, String streamId, String title, Dialog parent) {
        List<StremioClient.Addon> streamAddons = resourceAddons("stream");
        if (streamAddons.isEmpty()) { message("No stream addons", "Install a Stremio stream addon manifest in Settings. Catalog addons provide artwork and metadata; stream addons provide playable sources."); return; }
        Toast.makeText(this, "Checking " + streamAddons.size() + " stream addon(s)…", Toast.LENGTH_SHORT).show();
        List<StremioClient.Stream> found = Collections.synchronizedList(new ArrayList<>()); AtomicInteger remaining = new AtomicInteger(streamAddons.size());
        for (StremioClient.Addon addon : streamAddons) network.execute(() -> {
            try { found.addAll(StremioClient.loadStreams(addon, item.type, streamId)); } catch (Exception ignored) { }
            if (remaining.decrementAndGet() == 0) runOnUiThread(() -> showStreams(item, streamId, title, found, parent));
        });
    }

    private void showStreams(StremioClient.Item item, String streamId, String title, List<StremioClient.Stream> streams, Dialog parent) {
        if (streams.isEmpty()) { message("No playable sources", "Your installed stream addons returned no sources for this title."); return; }
        String[] labels = new String[streams.size()]; for (int i = 0; i < labels.length; i++) labels[i] = streams.get(i).label();
        new AlertDialog.Builder(this).setTitle("Choose source").setItems(labels, (d, which) -> {
            StremioClient.Stream s = streams.get(which); saveContinue(item);
            if (s.url != null) {
                Intent intent = new Intent(this, PlayerActivity.class); intent.putExtra("url", s.url); intent.putExtra("title", title); intent.putExtra("historyKey", item.type + ":" + streamId); startActivity(intent);
            } else {
                String target = s.externalUrl != null ? s.externalUrl : "https://www.youtube.com/watch?v=" + s.ytId;
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target))); } catch (Exception e) { message("No compatible app", "Install an app that can open this source."); }
            }
            if (parent != null) parent.dismiss();
        }).setNegativeButton("Cancel", null).show();
    }

    private void showSearch() {
        EditText query = new EditText(this); query.setHint("Movie or series"); query.setSingleLine(true); query.setInputType(InputType.TYPE_CLASS_TEXT); query.setPadding(dp(18), dp(16), dp(18), dp(16));
        AlertDialog d = new AlertDialog.Builder(this).setTitle("Search your catalogs").setView(query).setPositiveButton("Search", null).setNegativeButton("Cancel", null).create();
        d.setOnShowListener(x -> d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> { String q = query.getText().toString().trim(); if (!q.isEmpty()) { d.dismiss(); runSearch(q); } })); d.show();
    }

    private void runSearch(String query) {
        page.removeAllViews(); TextView heading = label("Search: “" + query + "”", 30, Color.WHITE); heading.setTypeface(null, 1); heading.setPadding(0, dp(35), 0, dp(10)); page.addView(heading);
        List<StremioClient.Catalog> searchable = new ArrayList<>(); for (StremioClient.Catalog c : allCatalogs()) if (c.searchable) searchable.add(c);
        if (searchable.isEmpty()) { page.addView(muted("None of your installed catalogs declares search support.")); return; }
        for (StremioClient.Catalog cat : searchable) {
            LinearLayout section = section(cat.name, cat.addonName); page.addView(section); LinearLayout rail = (LinearLayout) ((HorizontalScrollView) section.getChildAt(1)).getChildAt(0); rail.addView(new ProgressBar(this));
            network.execute(() -> { try { List<StremioClient.Item> results = StremioClient.loadCatalog(cat, 0, query); runOnUiThread(() -> populateRail(rail, results)); } catch (Exception e) { runOnUiThread(() -> { rail.removeAllViews(); rail.addView(muted("Search unavailable")); }); } });
        }
        scroller.scrollTo(0, 0);
    }

    private void showLibrary() {
        page.removeAllViews(); TextView heading = label("Library", 34, Color.WHITE); heading.setTypeface(null, 1); heading.setPadding(0, dp(35), 0, dp(14)); page.addView(heading);
        addStoredSection("Watchlist", prefs.getStringSet("watchlist", new HashSet<>()));
        addStoredSection("Continue Watching", prefs.getStringSet("continue", new HashSet<>())); scroller.scrollTo(0, 0);
    }

    private void addSavedRails() {
        Set<String> cont = prefs.getStringSet("continue", new HashSet<>()); if (!cont.isEmpty()) addStoredSection("Continue Watching", cont);
        Set<String> watch = prefs.getStringSet("watchlist", new HashSet<>()); if (!watch.isEmpty()) addStoredSection("My Watchlist", watch);
    }

    private void addStoredSection(String title, Set<String> jsonItems) {
        if (jsonItems == null || jsonItems.isEmpty()) return;
        LinearLayout section = section(title, "On this device"); page.addView(section); LinearLayout rail = (LinearLayout) ((HorizontalScrollView) section.getChildAt(1)).getChildAt(0);
        for (String raw : jsonItems) try { rail.addView(card(StremioClient.Item.fromJson(new JSONObject(raw)))); } catch (Exception ignored) { }
    }

    private void showSettings() {
        List<String> names = new ArrayList<>(); synchronized (addons) { for (StremioClient.Addon a : addons) names.add(a.name + "\n" + shortHost(a.manifestUrl)); }
        names.add("＋ Add Stremio addon");
        new AlertDialog.Builder(this).setTitle("Catalog & stream addons").setItems(names.toArray(new String[0]), (d, which) -> {
            if (which == names.size() - 1) addAddonDialog(); else addonActions(which);
        }).setMessage("Rows, artwork, logos and sources come directly from these manifests. Catalogs refresh whenever Nocturne starts.").setNegativeButton("Done", null).show();
    }

    private void addAddonDialog() {
        EditText input = new EditText(this); input.setHint("https://…/manifest.json"); input.setSingleLine(true); input.setInputType(InputType.TYPE_TEXT_VARIATION_URI); input.setPadding(dp(18), dp(16), dp(18), dp(16));
        AlertDialog d = new AlertDialog.Builder(this).setTitle("Install addon manifest").setView(input).setPositiveButton("Verify & Add", null).setNegativeButton("Cancel", null).create();
        d.setOnShowListener(x -> d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String url = input.getText().toString().trim(); if (!url.startsWith("http://") && !url.startsWith("https://")) { input.setError("Enter a full manifest URL"); return; }
            d.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false);
            network.execute(() -> { try {
                StremioClient.Addon addon = StremioClient.loadAddon(url); runOnUiThread(() -> { List<String> urls = manifestUrls(); if (!urls.contains(url)) urls.add(url); saveManifestUrls(urls); d.dismiss(); Toast.makeText(this, addon.name + " installed", Toast.LENGTH_SHORT).show(); loadAddons(); });
            } catch (Exception e) { runOnUiThread(() -> { d.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(true); input.setError("Manifest failed: " + e.getMessage()); }); } });
        })); d.show();
    }

    private void addonActions(int index) {
        StremioClient.Addon addon; synchronized (addons) { if (index >= addons.size()) return; addon = addons.get(index); }
        boolean builtIn = StremioClient.CINEMETA.equals(addon.manifestUrl);
        new AlertDialog.Builder(this).setTitle(addon.name).setMessage(addon.catalogs.size() + " catalogs · " + addon.resources.size() + " resources\n\n" + addon.manifestUrl)
                .setPositiveButton("Verify now", (d, w) -> network.execute(() -> { try { StremioClient.loadAddon(addon.manifestUrl); runOnUiThread(() -> Toast.makeText(this, "Verified", Toast.LENGTH_SHORT).show()); } catch (Exception e) { runOnUiThread(() -> message("Verification failed", e.getMessage())); } }))
                .setNeutralButton(builtIn ? "Built in" : "Remove", (d, w) -> { if (!builtIn) { List<String> urls = manifestUrls(); urls.remove(addon.manifestUrl); saveManifestUrls(urls); loadAddons(); } }).setNegativeButton("Close", null).show();
    }

    private void toggleWatchlist(StremioClient.Item item, TextView button) {
        Set<String> set = new HashSet<>(prefs.getStringSet("watchlist", new HashSet<>())); String existing = findStored(set, item); boolean adding = existing == null;
        if (existing != null) set.remove(existing); else set.add(item.toJson().toString()); prefs.edit().putStringSet("watchlist", set).apply();
        button.setText(adding ? "✓  In Watchlist" : "＋  Watchlist"); Toast.makeText(this, adding ? "Added to Watchlist" : "Removed from Watchlist", Toast.LENGTH_SHORT).show();
    }

    private boolean inWatchlist(StremioClient.Item i) { return findStored(prefs.getStringSet("watchlist", new HashSet<>()), i) != null; }
    private void saveContinue(StremioClient.Item item) { Set<String> set = new HashSet<>(prefs.getStringSet("continue", new HashSet<>())); String old = findStored(set, item); if (old != null) set.remove(old); set.add(item.toJson().toString()); prefs.edit().putStringSet("continue", set).apply(); }
    private String findStored(Set<String> set, StremioClient.Item item) { if (set == null) return null; for (String raw : set) try { JSONObject o = new JSONObject(raw); if (item.id.equals(o.optString("id")) && item.type.equals(o.optString("type"))) return raw; } catch (Exception ignored) { } return null; }

    private List<String> manifestUrls() {
        String raw = prefs.getString("manifests", null); List<String> out = new ArrayList<>();
        if (raw == null) { out.add(StremioClient.CINEMETA); return out; }
        try { JSONArray a = new JSONArray(raw); for (int i = 0; i < a.length(); i++) out.add(a.getString(i)); } catch (Exception ignored) { }
        if (!out.contains(StremioClient.CINEMETA)) out.add(0, StremioClient.CINEMETA); return out;
    }
    private void saveManifestUrls(List<String> urls) { prefs.edit().putString("manifests", new JSONArray(urls).toString()).apply(); }
    private List<StremioClient.Catalog> allCatalogs() { List<StremioClient.Catalog> c = new ArrayList<>(); synchronized (addons) { for (StremioClient.Addon a : addons) c.addAll(a.catalogs); } return c; }
    private List<StremioClient.Addon> resourceAddons(String r) { List<StremioClient.Addon> out = new ArrayList<>(); synchronized (addons) { for (StremioClient.Addon a : addons) if (a.resources.contains(r)) out.add(a); } return out; }
    private StremioClient.Addon firstResource(String r) { List<StremioClient.Addon> a = resourceAddons(r); return a.isEmpty() ? null : a.get(0); }

    private void showLoading(String text) { page.removeAllViews(); status = label(text, 20, Color.WHITE); status.setGravity(Gravity.CENTER); page.addView(status, new LinearLayout.LayoutParams(-1, dp(420))); }
    private void showError(String title, String detail) { page.removeAllViews(); TextView t = label(title + "\n\n" + detail + "\n\nOpen Settings to manage addons.", 20, Color.WHITE); t.setGravity(Gravity.CENTER); page.addView(t, new LinearLayout.LayoutParams(-1, dp(430))); }
    private void message(String title, String text) { new AlertDialog.Builder(this).setTitle(title).setMessage(text).setPositiveButton("OK", null).show(); }

    private TextView label(String text, float size, int color) { TextView v = new TextView(this); v.setText(text); v.setTextSize(size); v.setTextColor(color); v.setFontFeatureSettings("kern"); return v; }
    private TextView muted(String text) { TextView t = label(text, 15, 0xFFAEB0BA); t.setPadding(dp(8), dp(24), dp(28), dp(24)); return t; }
    private TextView glassButton(String text, boolean light) {
        TextView b = label(text, 15, light ? Color.BLACK : Color.WHITE); b.setGravity(Gravity.CENTER); b.setPadding(dp(20), 0, dp(20), 0); b.setFocusable(true); b.setClickable(true);
        b.setBackground(glass(light ? 0xF5FFFFFF : 0x803F414C, 28, light ? 0xFFFFFFFF : 0x66FFFFFF));
        b.setOnFocusChangeListener((v, has) -> { v.animate().scaleX(has ? 1.08f : 1f).scaleY(has ? 1.08f : 1f).translationZ(has ? dp(8) : 0).setDuration(150).start(); if (!light) v.setBackground(glass(has ? 0xCCFFFFFF : 0x803F414C, 28, has ? 0xFFFFFFFF : 0x66FFFFFF)); b.setTextColor(light || has ? Color.BLACK : Color.WHITE); });
        return b;
    }
    private GradientDrawable glass(int color, int radius, int stroke) { GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{color, shiftAlpha(color, .72f)}); g.setCornerRadius(dp(radius)); g.setStroke(dp(1), stroke); return g; }
    private int shiftAlpha(int c, float f) { return Color.argb((int) (Color.alpha(c) * f), Color.red(c), Color.green(c), Color.blue(c)); }
    private LinearLayout.LayoutParams margins(int w, int h, int l, int t, int r, int b) { LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(w, h); p.setMargins(dp(l), dp(t), dp(r), dp(b)); return p; }
    private View withMargins(View v, int l, int t, int r, int b) { v.setLayoutParams(margins(-2, -2, l, t, r, b)); return v; }
    private int dp(int n) { return Math.round(n * getResources().getDisplayMetrics().density); }
    private boolean isTv() { return getResources().getConfiguration().smallestScreenWidthDp >= 600; }
    private String key(StremioClient.Item i) { return i.type + ":" + i.id; }
    private String metaLine(StremioClient.Item i) { StringBuilder s = new StringBuilder(); if (i.releaseInfo != null) s.append(i.releaseInfo); if (i.imdbRating != null) { if (s.length() > 0) s.append("  ·  "); s.append("★ ").append(i.imdbRating); } if (i.genres != null) { if (s.length() > 0) s.append("  ·  "); s.append(i.genres); } if (s.length() == 0) s.append(titleCase(i.type)); return s.toString(); }
    private String titleCase(String s) { if (s == null || s.isEmpty()) return "Title"; return Character.toUpperCase(s.charAt(0)) + s.substring(1); }
    private String shortHost(String url) { try { return Uri.parse(url).getHost(); } catch (Exception e) { return url; } }
    private void immersive() { getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE); }
    @Override protected void onResume() { super.onResume(); immersive(); }
    @Override public boolean onKeyDown(int keyCode, KeyEvent event) { if (keyCode == KeyEvent.KEYCODE_MENU) { showSettings(); return true; } return super.onKeyDown(keyCode, event); }
    @Override protected void onDestroy() { network.shutdownNow(); super.onDestroy(); }
    private interface ItemCallback { void done(StremioClient.Item item); }
}
