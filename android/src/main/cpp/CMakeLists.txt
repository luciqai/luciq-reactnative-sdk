cmake_minimum_required(VERSION 3.13)
project(luciq-rn-jshang CXX)

add_library(luciq-rn-jshang SHARED luciq_rn_jshang_profiler.cpp)

# -fexceptions: the shim guards the resolved Hermes call with catch(...) so a
# throwing engine can never take down the host app.
target_compile_options(luciq-rn-jshang PRIVATE -fexceptions -fvisibility=hidden)

target_link_libraries(luciq-rn-jshang dl)
