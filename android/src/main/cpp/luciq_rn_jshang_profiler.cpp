#include <dlfcn.h>
#include <jni.h>

// React Native's own JNI registration for HermesSamplingProfiler wires the
// Java disable() binding to native enable() (HermesSamplingProfiler.cpp
// registerNatives) on every release from 0.70.0 through 0.85.3, so a profiler
// stopped through that class silently keeps sampling until process death.
// This shim resolves facebook::hermes::HermesRuntime::disableSamplingProfiler
// from the already-loaded libhermes.so and calls it directly, making stop
// work on all RN versions. The symbol is arg-less and static, so its mangled
// name is stable across Hermes releases (verified 0.70-0.86).

namespace {

using LcqHermesDisableFn = void (*)();

// RTLD_NOLOAD never loads Hermes into JSC apps; it only reuses the copy
// React Native already loaded, returning null otherwise. Resolution is not
// cached so a call before Hermes loads cannot pin "unavailable" for the
// process lifetime.
LcqHermesDisableFn lcqResolveHermesDisable(void **outHandle) {
    void *hermes = dlopen("libhermes.so", RTLD_NOLOAD | RTLD_LAZY);
    *outHandle = hermes;
    if (hermes == nullptr) {
        return nullptr;
    }
    return reinterpret_cast<LcqHermesDisableFn>(dlsym(
            hermes, "_ZN8facebook6hermes13HermesRuntime23disableSamplingProfilerEv"));
}

}  // namespace

extern "C" JNIEXPORT jboolean JNICALL
Java_ai_luciq_reactlibrary_hang_RNHermesSamplingShim_nativeIsDisableAvailable(
        JNIEnv * /*env*/, jclass /*clazz*/) {
    void *handle = nullptr;
    LcqHermesDisableFn disable = lcqResolveHermesDisable(&handle);
    if (handle != nullptr) {
        dlclose(handle);
    }
    return disable != nullptr ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_ai_luciq_reactlibrary_hang_RNHermesSamplingShim_nativeDisable(
        JNIEnv * /*env*/, jclass /*clazz*/) {
    void *handle = nullptr;
    LcqHermesDisableFn disable = lcqResolveHermesDisable(&handle);
    jboolean result = JNI_FALSE;
    if (disable != nullptr) {
        try {
            disable();
            result = JNI_TRUE;
        } catch (...) {
            result = JNI_FALSE;
        }
    }
    if (handle != nullptr) {
        // Balances the RTLD_NOLOAD reference after the call; React Native's
        // own references keep libhermes resident, so this never unloads it.
        dlclose(handle);
    }
    return result;
}
