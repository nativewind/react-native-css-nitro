# AGENTS.md

Project summary
- React Native Nitro CSS native module (`:react-native-css-nitro`) plus an example app.
- Native C++ lives in `cpp/` and is built into the Android library via CMake.

Key paths
- Repo root: `.`
- Android native library module: `android`
- Example Android app (build entry): `example/android`
- Shared native C++ sources: `cpp/`
- Generated Nitro code: `nitrogen/generated/`
- JNI adapter: `android/src/main/cpp/cpp-adapter.cpp`
- CMake config: `android/CMakeLists.txt`

Build (run from example/android)
- The example app build will compile the native library as part of the build.

```zsh
cd example/android
./gradlew assembleDebug -x lint --no-daemon --no-parallel
```

Common variants
```zsh
# Clean + build Debug
./gradlew clean assembleDebug -x lint --no-daemon --no-parallel

# Assemble Release
./gradlew assembleRelease --no-daemon --no-parallel

# Limit to specific ABIs (optional)
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a,x86_64 --no-daemon --no-parallel
```

Environment notes
- React Native: 0.81.1
- CMake: 3.22.1 (from Android SDK)
- NDK: 27.x (example uses 27.1.12297006; library uses 27.0.12077973 — both 27.x)

Native build specifics
- `android/CMakeLists.txt` auto-globs `../cpp/*.cpp` and links the generated Nitro sources.
- JSI types come from `<jsi/jsi.h>`; prefer `namespace jsi = facebook::jsi;` when interacting with RN JSI.

Troubleshooting
- Ensure Android SDK has matching CMake and NDK installed.
- If NDK is missing, install via SDK Manager or CLI, e.g.:

```zsh
sdkmanager "cmake;3.22.1" "ndk;27.1.12297006"
```

- If you need to adjust ABIs, pass `-PreactNativeArchitectures=...` as shown above.

Notes for agents
- Build from `example/android` to ensure `:react-native-css-nitro` is built.
- Source edits belong in `cpp/` (shared) and `android/src/main/cpp/` (adapter/glue).
- Generated files under `nitrogen/generated/` should not be edited.

