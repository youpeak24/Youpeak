package com.YouPeak.Live1


//import io.flutter.embedding.android.FlutterActivity
import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import io.flutter.plugin.common.MethodChannel
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin


class MainActivity: FlutterFragmentActivity() {

    //class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        // Explicitly register all plugins
        io.flutter.plugins.GeneratedPluginRegistrant.registerWith(flutterEngine)

        // Manual registration if missing (Fix for IllegalStateException in release mode)
        if (flutterEngine.plugins.get(GoogleMobileAdsPlugin::class.java) == null) {
            flutterEngine.plugins.add(GoogleMobileAdsPlugin())
        }

        if (flutterEngine.plugins.get(io.flutter.plugins.pathprovider.PathProviderPlugin::class.java) == null) {
            flutterEngine.plugins.add(io.flutter.plugins.pathprovider.PathProviderPlugin())
        }

        val context: Context = applicationContext

        GoogleMobileAdsPlugin.registerNativeAdFactory(flutterEngine, "medium", MediumNativeAdFactory(context))
        GoogleMobileAdsPlugin.registerNativeAdFactory(flutterEngine, "large", LargeNativeAdFactory(context))
        GoogleMobileAdsPlugin.registerNativeAdFactory(flutterEngine, "full", FullNativeAdFactory(context))

        // Tasker anti-fraud (lib/core/security/data/device_signal_collector.dart):
        // is a VPN up on any network, and is a system HTTP proxy set?
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "youpeak/network_security").setMethodCallHandler { call, result ->
            if (call.method != "inspect") {
                result.notImplemented()
                return@setMethodCallHandler
            }
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            var vpnActive = false
            try {
                @Suppress("DEPRECATION")
                cm?.allNetworks?.forEach { network ->
                    if (cm.getNetworkCapabilities(network)?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true) vpnActive = true
                }
            } catch (_: Exception) {
            }
            val proxy = try { cm?.defaultProxy } catch (_: Exception) { null }
            val proxyHost = proxy?.host ?: System.getProperty("http.proxyHost") ?: ""
            result.success(mapOf("vpnActive" to vpnActive, "proxyHost" to proxyHost))
        }
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        super.cleanUpFlutterEngine(flutterEngine)

        val context: Context = applicationContext

        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "medium")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "large")
        GoogleMobileAdsPlugin.unregisterNativeAdFactory(flutterEngine, "full")
    }
}

