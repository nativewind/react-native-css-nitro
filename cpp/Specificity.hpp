#pragma once

#include <tuple>

namespace margelo::nitro::cssnitro {

    using SpecificityArray = std::tuple<double, double, double, double, double>;

    class Specificity {
    public:
        /**
         * Sort function for comparing two specificity arrays.
         * Returns true if 'a' should come before 'b' in the sorted order.
         * Sorts in reverse order (larger values first).
         *
         * @param a First specificity array
         * @param b Second specificity array
         * @return true if a should come before b (a has higher specificity)
         */
        static bool sort(const SpecificityArray &a, const SpecificityArray &b) {
            // Compare each index in order, higher values come first
            if (std::get<0>(a) != std::get<0>(b)) {
                return std::get<0>(a) > std::get<0>(b);
            }
            if (std::get<1>(a) != std::get<1>(b)) {
                return std::get<1>(a) > std::get<1>(b);
            }
            if (std::get<2>(a) != std::get<2>(b)) {
                return std::get<2>(a) > std::get<2>(b);
            }
            if (std::get<3>(a) != std::get<3>(b)) {
                return std::get<3>(a) > std::get<3>(b);
            }
            return std::get<4>(a) > std::get<4>(b);
        }
    };

} // namespace margelo::nitro::cssnitro

