#include <jni.h>
#include "cssnitroOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::cssnitro::initialize(vm);
}
