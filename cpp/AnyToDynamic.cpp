#include "AnyToDynamic.hpp"

#include <variant>

namespace nitro = ::margelo::nitro;

namespace margelo::nitro::cssnitro {

    static folly::dynamic valueToDynamic(const nitro::VariantType &var);

    folly::dynamic toDynamic(const nitro::AnyValue &v) {
        const nitro::VariantType &var = static_cast<const nitro::VariantType &>(v);
        return valueToDynamic(var);
    }

    folly::dynamic toDynamic(const nitro::AnyMap &m) {
        folly::dynamic obj = folly::dynamic::object();
        const auto &map = m.getMap();
        for (const auto &kv: map) {
            obj[kv.first] = toDynamic(kv.second);
        }
        return obj;
    }

    folly::dynamic toDynamic(const std::vector<std::shared_ptr<nitro::AnyMap>> &arr) {
        folly::dynamic out = folly::dynamic::array();
        out.reserve(arr.size());
        for (const auto &p: arr) {
            if (p) {
                out.push_back(toDynamic(*p));
            } else {
                out.push_back(folly::dynamic::object());
            }
        }
        return out;
    }

    static folly::dynamic valueToDynamic(const nitro::VariantType &var) {
        return std::visit(
                [](auto &&arg) -> folly::dynamic {
                    using T = std::decay_t<decltype(arg)>;
                    if constexpr (std::is_same_v<T, std::monostate>) {
                        return folly::dynamic(nullptr);
                    } else if constexpr (std::is_same_v<T, bool>) {
                        return folly::dynamic(arg);
                    } else if constexpr (std::is_same_v<T, double>) {
                        return folly::dynamic(arg);
                    } else if constexpr (std::is_same_v<T, int64_t>) {
                        return folly::dynamic(static_cast<int64_t>(arg));
                    } else if constexpr (std::is_same_v<T, std::string>) {
                        return folly::dynamic(arg);
                    } else if constexpr (std::is_same_v<T, nitro::AnyArray>) {
                        folly::dynamic arr = folly::dynamic::array();
                        for (const auto &elem: arg) {
                            arr.push_back(toDynamic(elem));
                        }
                        return arr;
                    } else if constexpr (std::is_same_v<T, nitro::AnyObject>) {
                        folly::dynamic obj = folly::dynamic::object();
                        for (const auto &kv: arg) {
                            obj[kv.first] = toDynamic(kv.second);
                        }
                        return obj;
                    } else {
                        return folly::dynamic(nullptr);
                    }
                },
                var);
    }

} // namespace margelo::nitro::cssnitro
