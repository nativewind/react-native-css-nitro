///
/// ContainerContext.hpp
/// Container context management for layout tracking
///

#pragma once

#include <unordered_map>
#include <unordered_set>
#include <string>
#include <memory>
#include <optional>
#include "Effect.hpp"
#include "Observable.hpp"

namespace margelo::nitro::cssnitro {

    // Layout bounds structure
    struct LayoutBounds {
        std::shared_ptr<reactnativecss::Observable<double>> x;
        std::shared_ptr<reactnativecss::Observable<double>> y;
        std::shared_ptr<reactnativecss::Observable<double>> width;
        std::shared_ptr<reactnativecss::Observable<double>> height;

        LayoutBounds()
                : x(reactnativecss::Observable<double>::create(0.0)),
                  y(reactnativecss::Observable<double>::create(0.0)),
                  width(reactnativecss::Observable<double>::create(0.0)),
                  height(reactnativecss::Observable<double>::create(0.0)) {}
    };

    // Scope hierarchy structure
    struct ScopeHierarchy {
        std::string parent;
        std::unordered_set<std::string> names;

        ScopeHierarchy() : parent(""), names() {}

        ScopeHierarchy(std::string p, std::unordered_set<std::string> n)
                : parent(std::move(p)), names(std::move(n)) {}
    };

    /**
     * ContainerContext manages layout bounds and scope hierarchies for containers
     */
    class ContainerContext {
    private:
        static std::unordered_map<std::string, LayoutBounds> _layoutMap;
        static std::unordered_map<std::string, ScopeHierarchy> _scopeMap;

    public:
        // Helper to find a name in scope hierarchy
        static std::optional<std::string>
        findInScope(const std::string &containerScope, const std::optional<std::string> &name);

        /**
         * Set the scope hierarchy for a container
         */
        static void setScope(const std::string &containerScope,
                             const std::string &parent,
                             const std::unordered_set<std::string> &names);

        /**
         * Get X coordinate for a container/element
         * Returns nullptr if not found and parent is "root"
         */
        static std::optional<double> getX(const std::string &containerScope,
                                          const std::optional<std::string> &name,
                                          reactnativecss::Effect::GetProxy &get);

        /**
         * Get Y coordinate for a container/element
         * Returns nullptr if not found and parent is "root"
         */
        static std::optional<double> getY(const std::string &containerScope,
                                          const std::optional<std::string> &name,
                                          reactnativecss::Effect::GetProxy &get);

        /**
         * Get width for a container/element
         * Returns nullptr if not found and parent is "root"
         */
        static std::optional<double> getWidth(const std::string &containerScope,
                                              const std::optional<std::string> &name,
                                              reactnativecss::Effect::GetProxy &get);

        /**
         * Get height for a container/element
         * Returns nullptr if not found and parent is "root"
         */
        static std::optional<double> getHeight(const std::string &containerScope,
                                               const std::optional<std::string> &name,
                                               reactnativecss::Effect::GetProxy &get);

        static void
        setLayout(const std::string &key, double x, double y, double width, double height);
    };

} // namespace margelo::nitro::cssnitro
