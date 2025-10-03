package com.margelo.nitro.cssnitro
  
import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
class CssNitro : HybridCssNitroSpec() {
  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }
}
