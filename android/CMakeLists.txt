project(cssnitro)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME cssnitro)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Automatically find all .cpp files in the shared cpp directory
file(GLOB CSS_NITRO_SHARED_SOURCES "../cpp/*.cpp")

# Define C++ library and add all sources
add_library(${PACKAGE_NAME} SHARED
    src/main/cpp/cpp-adapter.cpp
    ${CSS_NITRO_SHARED_SOURCES}
)

# Add Nitrogen specs :)
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/cssnitro+autolinking.cmake)

# Set up local includes
include_directories("src/main/cpp" "../cpp")

find_library(LOG_LIB log)

# Link all libraries together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}
        android # <-- Android core
)
