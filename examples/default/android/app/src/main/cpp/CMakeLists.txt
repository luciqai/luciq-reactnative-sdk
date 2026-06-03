
# For more information about using CMake with Android Studio, read the
# documentation: https://d.android.com/studio/projects/add-native-code.html.
# For more examples on how to use CMake, see https://github.com/android/ndk-samples.

# Sets the minimum CMake version required for this project.
cmake_minimum_required(VERSION 3.22.1)

# Custom JNI library loaded by ai.luciq.react.example.nativeLibs.CppNativeLib
# via System.loadLibrary("native-lib"). Consumed as a subdirectory from
# ../jni/CMakeLists.txt (the top-level CMake that also builds libappmodules.so).
add_library(native-lib SHARED
        native-lib.cpp
        crasher.c
        crasher_2.c
        crasher_3.c
        crasher_4.cpp)

find_library(log-lib log)

target_link_libraries(native-lib
        android
        log
        ${log-lib})
