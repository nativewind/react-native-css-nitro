#pragma once

#include <string>
#include <sstream>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>

// Platform-specific includes for detecting debug build
#ifdef __ANDROID__

#include <fbjni/fbjni.h>

#endif

namespace margelo::nitro::cssnitro {

/**
 * JSLogger - Bridges C++ logs to JavaScript console (React Native Dev Tools)
 *
 * This logger sends logs to the JavaScript console.log/warn/error functions,
 * making them visible in React Native Dev Tools, Metro bundler, and Flipper.
 *
 * Note: Requires initialization with a JSI runtime reference.
 */
    class JSLogger {
    public:
        enum class Level {
            Log,
            Debug,
            Info,
            Warn,
            Error
        };

        /**
         * Initialize the JSLogger with a JSI runtime.
         * Call this once during module initialization.
         */
        static void initialize(facebook::jsi::Runtime &runtime) {
            std::lock_guard<std::mutex> lock(mutex_);
            runtime_ = &runtime;

            // Cache the console object and its methods
            auto console = runtime.global().getPropertyAsObject(runtime, "console");
            console_log_ = std::make_shared<facebook::jsi::Function>(
                    console.getPropertyAsFunction(runtime, "log"));
            console_debug_ = std::make_shared<facebook::jsi::Function>(
                    console.getPropertyAsFunction(runtime, "debug"));
            console_info_ = std::make_shared<facebook::jsi::Function>(
                    console.getPropertyAsFunction(runtime, "info"));
            console_warn_ = std::make_shared<facebook::jsi::Function>(
                    console.getPropertyAsFunction(runtime, "warn"));
            console_error_ = std::make_shared<facebook::jsi::Function>(
                    console.getPropertyAsFunction(runtime, "error"));
        }

        /**
         * Check if running in a debuggable build (Android Studio Debug button)
         */
        static bool isDebuggableBuild() {
#ifdef __ANDROID__
            static bool checked = false;
            static bool isDebuggable = false;

            if (!checked) {
                try {
                    // Use android.os.Debug.isDebuggerConnected() to check if debugger is attached
                    auto debugClass = facebook::jni::findClassLocal("android/os/Debug");
                    auto isDebuggerConnectedMethod = debugClass->getStaticMethod<jboolean()>(
                            "isDebuggerConnected");
                    isDebuggable = isDebuggerConnectedMethod(debugClass);
                } catch (const std::exception &e) {
                    // If we can't check, default to true (always show logs in dev)
                    isDebuggable = true;
                } catch (...) {
                    isDebuggable = true;
                }
                checked = true;
            }

            return isDebuggable;
#elif defined(__APPLE__)
            // On iOS, check if debugger is attached
#ifdef DEBUG
                return true;
#else
                return false;
#endif
#else
            // Other platforms - fall back to compile-time check
#ifdef NDEBUG
                return false;
#else
                return true;
#endif
#endif
        }

        /**
         * Enable or disable debug logging at runtime
         */
        static void setDebugMode(bool enabled) {
            std::lock_guard<std::mutex> lock(mutex_);
            debugModeOverride_ = enabled;
            hasOverride_ = true;
        }

        /**
         * Check if debug mode is enabled
         */
        static bool isDebugMode() {
            std::lock_guard<std::mutex> lock(mutex_);
            // If there's a manual override, use that
            if (hasOverride_) {
                return debugModeOverride_;
            }
            // Otherwise, check if it's a debuggable build
            return isDebuggableBuild();
        }

        /**
         * Log a message to JavaScript console
         */
        static void log(Level level, const std::string &message) {
            std::lock_guard<std::mutex> lock(mutex_);

            if (!runtime_ || !console_log_) {
                return; // Not initialized yet
            }

            try {
                auto &rt = *runtime_;
                auto jsiMsg = facebook::jsi::String::createFromUtf8(rt, message);

                switch (level) {
                    case Level::Log:
                        console_log_->call(rt, jsiMsg);
                        break;
                    case Level::Debug:
                        if (console_debug_) {
                            console_debug_->call(rt, jsiMsg);
                        } else {
                            console_log_->call(rt, jsiMsg);
                        }
                        break;
                    case Level::Info:
                        if (console_info_) {
                            console_info_->call(rt, jsiMsg);
                        } else {
                            console_log_->call(rt, jsiMsg);
                        }
                        break;
                    case Level::Warn:
                        if (console_warn_) {
                            console_warn_->call(rt, jsiMsg);
                        } else {
                            console_log_->call(rt, jsiMsg);
                        }
                        break;
                    case Level::Error:
                        if (console_error_) {
                            console_error_->call(rt, jsiMsg);
                        } else {
                            console_log_->call(rt, jsiMsg);
                        }
                        break;
                }
            } catch (...) {
                // Silently fail if JS call fails (e.g., runtime destroyed)
            }
        }

        // Convenience methods
        static void log(const std::string &message) {
            log(Level::Log, message);
        }

        static void debug(const std::string &message) {
            log(Level::Debug, message);
        }

        static void info(const std::string &message) {
            log(Level::Info, message);
        }

        static void warn(const std::string &message) {
            log(Level::Warn, message);
        }

        static void error(const std::string &message) {
            log(Level::Error, message);
        }

        // Helper to format multiple arguments into a single string
        template<typename T>
        static std::string format(T &&value) {
            std::ostringstream oss;
            oss << std::forward<T>(value);
            return oss.str();
        }

        template<typename T, typename... Args>
        static std::string format(T &&first, Args &&... rest) {
            std::ostringstream oss;
            oss << std::forward<T>(first);
            ((oss << " " << std::forward<Args>(rest)), ...);
            return oss.str();
        }

    private:
        static inline std::mutex mutex_;
        static inline facebook::jsi::Runtime *runtime_ = nullptr;
        static inline std::shared_ptr<facebook::jsi::Function> console_log_;
        static inline std::shared_ptr<facebook::jsi::Function> console_debug_;
        static inline std::shared_ptr<facebook::jsi::Function> console_info_;
        static inline std::shared_ptr<facebook::jsi::Function> console_warn_;
        static inline std::shared_ptr<facebook::jsi::Function> console_error_;

        // Manual override for debug mode
        static inline bool debugModeOverride_ = false;
        static inline bool hasOverride_ = false;
    };

} // namespace margelo::nitro::cssnitro

// Production macros - always log (Warnings and Errors should always be visible)
#define JSLOGW(...) margelo::nitro::cssnitro::JSLogger::warn(margelo::nitro::cssnitro::JSLogger::format(__VA_ARGS__))
#define JSLOGE(...) margelo::nitro::cssnitro::JSLogger::error(margelo::nitro::cssnitro::JSLogger::format(__VA_ARGS__))

// Debug-only macros - only log when built with Android Studio's Debug button
#define JSLOGD(...) do { \
    if (margelo::nitro::cssnitro::JSLogger::isDebugMode()) { \
        margelo::nitro::cssnitro::JSLogger::debug(margelo::nitro::cssnitro::JSLogger::format(__VA_ARGS__)); \
    } \
} while(0)

#define JSLOGI(...) do { \
    if (margelo::nitro::cssnitro::JSLogger::isDebugMode()) { \
        margelo::nitro::cssnitro::JSLogger::info(margelo::nitro::cssnitro::JSLogger::format(__VA_ARGS__)); \
    } \
} while(0)

// Force debug log (always logs even in non-debuggable builds - use sparingly!)
#define JSLOGD_FORCE(...) margelo::nitro::cssnitro::JSLogger::debug(margelo::nitro::cssnitro::JSLogger::format(__VA_ARGS__))
#define JSLOGI_FORCE(...) margelo::nitro::cssnitro::JSLogger::info(margelo::nitro::cssnitro::JSLogger::format(__VA_ARGS__))
