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

add_executable(computed_tests computed_tests.cpp shadow_tree_manager_tests.cpp)

# Include path to our headers (../ includes effect/observable/computed)
target_include_directories(computed_tests PRIVATE ${CMAKE_CURRENT_LIST_DIR}/..)

# Helper to include all immediate subdirectories of a root as include dirs
function(nitro_include_all_subdirs target root)
  if(NOT IS_DIRECTORY "${root}")
    message(WARNING "Include root not found: ${root}")
    return()
  endif()
  file(GLOB _children LIST_DIRECTORIES TRUE "${root}/*")
  set(_dirs "${root}") # also include the root itself
  foreach(_child IN LISTS _children)
    if(IS_DIRECTORY "${_child}")
      list(APPEND _dirs "${_child}")
    endif()
  endforeach()
  if(_dirs)
    # Deduplicate
    list(REMOVE_DUPLICATES _dirs)
    target_include_directories(${target} PRIVATE ${_dirs})
  endif()
endfunction()

# Add all Pod Public header folders and all react-native folders
set(PODS_PUBLIC_ROOT "${CMAKE_CURRENT_LIST_DIR}/../../example/ios/Pods/Headers/Public")
set(RN_ROOT "${CMAKE_CURRENT_LIST_DIR}/../../node_modules/react-native")

nitro_include_all_subdirs(computed_tests "${PODS_PUBLIC_ROOT}")
nitro_include_all_subdirs(computed_tests "${RN_ROOT}")

# Link interface target from doctest to propagate include dirs/definitions
target_link_libraries(computed_tests PRIVATE doctest::doctest)

# Recommended: enable warnings for the test build
target_compile_options(computed_tests PRIVATE -Wall -Wextra -Wpedantic)

# No special compile definitions needed; tests use the RN/Folly-free base manager
