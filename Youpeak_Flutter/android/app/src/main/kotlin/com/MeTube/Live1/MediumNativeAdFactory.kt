package com.YouPeak.Live1


import android.content.Context
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.RatingBar
import android.widget.TextView
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdView
import io.flutter.plugins.googlemobileads.GoogleMobileAdsPlugin

class MediumNativeAdFactory(val context: Context) : GoogleMobileAdsPlugin.NativeAdFactory {
    override fun createNativeAd(
        nativeAd: NativeAd,
        customOptions: MutableMap<String, Any>?
    ): NativeAdView {

        val nativeAdView: NativeAdView = LayoutInflater.from(context)
            .inflate(R.layout.medium_native_ad, null) as NativeAdView

        val iconView: ImageView = nativeAdView.findViewById(R.id.ad_app_icon)
        val headlineView: TextView = nativeAdView.findViewById(R.id.ad_headline)
        val advertiserView: TextView = nativeAdView.findViewById(R.id.ad_advertiser)
        val starsView: RatingBar = nativeAdView.findViewById(R.id.ad_stars)
        val bodyView: TextView = nativeAdView.findViewById(R.id.ad_body)
        val priceView: TextView = nativeAdView.findViewById(R.id.ad_price)
        val storeView: TextView = nativeAdView.findViewById(R.id.ad_store)
        val buttonView: Button = nativeAdView.findViewById(R.id.ad_call_to_action)

        iconView.visibility = if (nativeAd.getIcon() != null) View.VISIBLE else View.INVISIBLE
        headlineView.visibility =
            if (nativeAd.getHeadline() != null) View.VISIBLE else View.INVISIBLE
        advertiserView.visibility =
            if (nativeAd.getAdvertiser() != null) View.VISIBLE else View.INVISIBLE
        starsView.visibility =
            if (nativeAd.getStarRating() != null) View.VISIBLE else View.INVISIBLE
        bodyView.visibility = if (nativeAd.getBody() != null) View.VISIBLE else View.INVISIBLE
        priceView.visibility = if (nativeAd.getPrice() != null) View.VISIBLE else View.INVISIBLE
        storeView.visibility = if (nativeAd.getStore() != null) View.VISIBLE else View.INVISIBLE
        buttonView.visibility =
            if (nativeAd.getCallToAction() != null) View.VISIBLE else View.INVISIBLE

        headlineView.text = nativeAd.getHeadline()
        advertiserView.text = nativeAd.getAdvertiser()
        starsView.rating = nativeAd.getStarRating()?.toFloat() ?: 0.0f
        bodyView.text = nativeAd.getBody()
        priceView.text = nativeAd.getPrice()
        storeView.text = nativeAd.getStore()
        buttonView.text = nativeAd.getCallToAction()

        val icon = nativeAd.getIcon()
        if (icon != null)
            iconView.setImageDrawable(icon.getDrawable())

        nativeAdView.setHeadlineView(headlineView)
        nativeAdView.setBodyView(bodyView)
        nativeAdView.setCallToActionView(buttonView)
        nativeAdView.setIconView(iconView)
        nativeAdView.setPriceView(priceView)
        nativeAdView.setStarRatingView(starsView)
        nativeAdView.setStoreView(storeView)
        nativeAdView.setAdvertiserView(advertiserView)

        nativeAdView.setNativeAd(nativeAd)

        return nativeAdView
    }
}