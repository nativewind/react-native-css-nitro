cmake_minimum_required(VERSION 3.20)
project(nitro_computed_tests CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

include(FetchContent)
set(CMAKE_POLICY_VERSION_MINIMUM 3.5)

# Fetch doctest (header-only)
FetchContent_Declare(
  doctest
  GIT_REPOSITORY https://github.com/doctest/doctest.git
  GIT_TAG v2.4.11
)
FetchContent_MakeAvailable(doctest)

add_executable(computed_tests computed_tests.cpp)

# Include path to our headers (../ includes effect/observable/computed)
target_include_directories(computed_tests PRIVATE ${CMAKE_CURRENT_LIST_DIR}/..)

# Link interface target from doctest to propagate include dirs/definitions
target_link_libraries(computed_tests PRIVATE doctest::doctest)

# Recommended: enable warnings for the test build
target_compile_options(computed_tests PRIVATE -Wall -Wextra -Wpedantic)
