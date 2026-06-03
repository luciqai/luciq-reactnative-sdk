cmake_minimum_required(VERSION 3.22.1)

# Project name must match the default OnLoad convention (appmodules) used by
# react-native's DefaultNewArchitectureEntryPoint.load() — this produces
# libappmodules.so, which registers core & autolinked TurboModules
# (PlatformConstants, etc.) on app start in bridgeless / new-architecture mode.
project(appmodules)

# Creates target "appmodules" and links it against all prefab RN libs,
# autolinked third-party libraries, and app-level codegen. Globs *.cpp from
# this directory (so OnLoad.cpp alongside this file gets picked up).
include("${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake")

# Also build the existing custom libnative-lib.so (crash-testing JNI) from
# ../cpp. Its CMakeLists only defines the target — keeping it in its own
# directory prevents the RN glob above from pulling crasher_4.cpp in and
# failing under -Werror.
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../cpp native-lib-build)
