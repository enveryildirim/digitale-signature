package com.tvbroadcast.kiosk;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** TV açılınca yayını başlatır; uygulama ana ekran yapılamamış TV'ler için yedek. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        context.startActivity(new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }
}
