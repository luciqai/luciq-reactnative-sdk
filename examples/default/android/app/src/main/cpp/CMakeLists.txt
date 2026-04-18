cmake_minimum_required(VERSION 3.22.1)

# Top-level project name must be `appmodules` because RN's
# ReactNative-application.cmake uses ${CMAKE_PROJECT_NAME} for the TurboModule
# shared library the new-arch/bridgeless runtime loads. OnLoad.cpp in this dir
# is compiled into that library; the crasher native-lib lives in a subdir so
# RN's file(GLOB *.cpp) doesn't pull its sources into appmodules.
project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

add_subdirectory(crasher)
