#pragma once

#include "Observable.hpp"

namespace reactnativecss {
    namespace env {

// Accessors to global environment observables. These are lightweight and
// can be used with Effect::GetProxy for reactive reads from anywhere.

        reactnativecss::Observable<double> &windowWidth();

        reactnativecss::Observable<double> &windowHeight();

        reactnativecss::Observable<double> &windowScale();

        reactnativecss::Observable<double> &windowFontScale();

// Convenience API to update all four metrics in one shot.
        void setWindowDimensions(double width, double height, double scale, double fontScale);

    } // namespace env
} // namespace reactnativecss

