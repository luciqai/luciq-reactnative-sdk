add_library(native-lib SHARED
        native-lib.cpp
        crasher.c
        crasher_2.c
        crasher_3.c
        crasher_4.cpp
        )

find_library(log-lib log)

target_link_libraries(native-lib
        android
        log
        ${log-lib}
        )
