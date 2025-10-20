#include "Environment.hpp"

namespace reactnativecss {
    namespace env {

        static std::shared_ptr<reactnativecss::Observable<double>> &widthRef() {
            static auto inst = reactnativecss::Observable<double>::create(0.0);
            return inst;
        }

        static std::shared_ptr<reactnativecss::Observable<double>> &heightRef() {
            static auto inst = reactnativecss::Observable<double>::create(0.0);
            return inst;
        }

        static std::shared_ptr<reactnativecss::Observable<double>> &scaleRef() {
            static auto inst = reactnativecss::Observable<double>::create(0.0);
            return inst;
        }

        static std::shared_ptr<reactnativecss::Observable<double>> &fontScaleRef() {
            static auto inst = reactnativecss::Observable<double>::create(0.0);
            return inst;
        }

        reactnativecss::Observable<double> &windowWidth() { return *widthRef(); }

        reactnativecss::Observable<double> &windowHeight() { return *heightRef(); }

        reactnativecss::Observable<double> &windowScale() { return *scaleRef(); }

        reactnativecss::Observable<double> &windowFontScale() { return *fontScaleRef(); }

        void setWindowDimensions(double width, double height, double scale, double fontScale) {
            widthRef()->set(width);
            heightRef()->set(height);
            scaleRef()->set(scale);
            fontScaleRef()->set(fontScale);
        }

    } // namespace env
} // namespace reactnativecss

