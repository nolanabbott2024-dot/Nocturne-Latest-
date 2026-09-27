package com.nolanabbott.nocturne;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;

final class TvUi {
    final Context c; final float density;
    TvUi(Context c){this.c=c;density=c.getResources().getDisplayMetrics().density;}
    int dp(float n){return Math.round(n*density);}
    TextView text(String value,int size,int color){TextView t=new TextView(c);t.setText(value);t.setTextSize(size);t.setTextColor(color);t.setFontFeatureSettings("kern");return t;}
    TextView title(String value,int size){TextView t=text(value,size,Color.WHITE);t.setTypeface(null,1);return t;}
    LinearLayout column(){LinearLayout l=new LinearLayout(c);l.setOrientation(1);l.setClipChildren(false);l.setClipToPadding(false);return l;}
    LinearLayout row(){LinearLayout l=new LinearLayout(c);l.setGravity(Gravity.CENTER_VERTICAL);l.setClipChildren(false);l.setClipToPadding(false);return l;}
    GradientDrawable glass(int color,int radius,boolean focus){GradientDrawable g=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{color,Color.argb(Math.round(Color.alpha(color)*.82f),Color.red(color),Color.green(color),Color.blue(color))});g.setCornerRadius(dp(radius));g.setStroke(dp(focus?2:1),focus?0xFFFFFFFF:0x28FFFFFF);return g;}
    TextView button(String label,boolean primary,Runnable action){TextView t=text(label,14,primary?0xFF111114:Color.WHITE);t.setGravity(Gravity.CENTER);t.setPadding(dp(20),0,dp(20),0);t.setFocusable(true);t.setClickable(true);t.setMinHeight(dp(46));t.setBackground(glass(primary?0xFFF2F2F4:0xCE292B31,23,false));t.setContentDescription(label);t.setTag("button-"+label);t.setOnClickListener(v->action.run());t.setOnFocusChangeListener((v,has)->{t.setTextColor(has||primary?0xFF111114:Color.WHITE);t.setBackground(glass(has?0xFFFFFFFF:primary?0xFFF2F2F4:0xCE292B31,23,has));v.animate().scaleX(has?1.035f:1).scaleY(has?1.035f:1).setDuration(120).start();});return t;}
    LinearLayout.LayoutParams lp(int w,int h,int left,int top,int right,int bottom){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(w<0?w:dp(w),h<0?h:dp(h));p.setMargins(dp(left),dp(top),dp(right),dp(bottom));return p;}
    void pad(View v,int l,int t,int r,int b){v.setPadding(dp(l),dp(t),dp(r),dp(b));}
    TextView note(String s){TextView t=text(s,14,0xFFB6B8C1);t.setLineSpacing(0,1.2f);pad(t,0,12,0,16);return t;}
}
