package com.nolanabbott.nocturne;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.MediaController;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.VideoView;

public class PlayerActivity extends Activity {
    private VideoView video;
    private String historyKey;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state); getWindow().setStatusBarColor(Color.BLACK); getWindow().setNavigationBarColor(Color.BLACK);
        FrameLayout root = new FrameLayout(this); root.setBackgroundColor(Color.BLACK);
        video = new VideoView(this); root.addView(video, new FrameLayout.LayoutParams(-1, -1));
        ProgressBar loading = new ProgressBar(this); FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(64, 64, Gravity.CENTER);
        root.addView(loading, lp);
        TextView title = new TextView(this); title.setText(getIntent().getStringExtra("title")); title.setTextColor(Color.WHITE);
        title.setTextSize(18); title.setPadding(28, 20, 28, 20); root.addView(title);
        setContentView(root); immersive();
        String url = getIntent().getStringExtra("url"); historyKey = getIntent().getStringExtra("historyKey");
        MediaController controls = new MediaController(this); controls.setAnchorView(video); video.setMediaController(controls);
        video.setVideoURI(Uri.parse(url));
        video.setOnPreparedListener(mp -> {
            loading.setVisibility(View.GONE); int p = getPreferences(0).getInt(historyKey, 0);
            if (p > 0 && p < mp.getDuration() - 15000) video.seekTo(p); video.start();
        });
        video.setOnErrorListener((mp, what, extra) -> { loading.setVisibility(View.GONE); title.setText("This source could not be played on this device"); return true; });
    }

    @Override protected void onPause() { if (video != null && historyKey != null) getPreferences(0).edit().putInt(historyKey, video.getCurrentPosition()).apply(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); immersive(); }
    private void immersive() { getWindow().getDecorView().setSystemUiVisibility(5894 | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY); }
}
