# :podspec pins an unreleased native SDK build: the custom report APIs of iOS PR 8225.
# Remove it once those APIs are in a release.
$luciq= {
  :version => '19.14.0',
  :podspec => 'https://ios-releases.luciq.ai/custom/pr-8225/19.14.0/Luciq.podspec',
}

# SwiftPM source for the native Luciq SDK (product `Luciq`).
$luciq_spm = {
  :url     => 'https://github.com/luciqai/luciq-ios-sdk',
  :product => 'Luciq',
}

# Opt in to SwiftPM with `LUCIQ_USE_SPM=1` (also needs `USE_FRAMEWORKS=dynamic`).
def luciq_spm_enabled?
  ENV['LUCIQ_USE_SPM'] == '1'
end

# The custom podspec to link instead of the pinned CocoaPods version: `$luciq[:podspec]`,
# or another unreleased build, e.g. a snapshot of a feature branch:
#   LUCIQ_IOS_PODSPEC=https://ios-releases.luciq.ai/custom/<branch>/<version>/Luciq.podspec pod install
# A local path to a .podspec file works too. It wins over SwiftPM, which only has releases.
def luciq_custom_podspec
  value = ENV['LUCIQ_IOS_PODSPEC'].to_s.strip
  value.empty? ? $luciq[:podspec] : value
end

# Registers the SwiftPM dependency via React Native's `spm_dependency` global
# helper (defined in react_native_pods.rb, which the Podfile requires; available
# on React Native >= 0.75). It is a top-level method, so it lands on `main` and
# takes the spec as its first positional arg. Returns false when unavailable (no
# spec, or older React Native) so the caller falls back to CocoaPods.
def add_luciq_spm_dependency!(spec)
  return false unless spec
  return false unless respond_to?(:spm_dependency, true)

  spm_dependency(
    spec,
    :url => $luciq_spm[:url],
    :requirement => { :kind => 'exactVersion', :version => $luciq[:version] },
    :products => [$luciq_spm[:product]]
  )
  true
end

def use_luciq! (spec = nil)
  version = $luciq[:version]
  custom_podspec = luciq_custom_podspec

  # SwiftPM bridging requires dynamic frameworks for the whole target. If SPM is
  # requested without them, warn and fall back to CocoaPods rather than aborting
  # the install (a lingering LUCIQ_USE_SPM env var must never break pod install).
  spm_requested = luciq_spm_enabled?
  if spm_requested && custom_podspec
    Pod::UI.warn '[Luciq] LUCIQ_USE_SPM=1 is ignored: the custom podspec build is not ' \
                 'available via SwiftPM; linking it with CocoaPods.'
    spm_requested = false
  elsif spm_requested && ENV['USE_FRAMEWORKS'] != 'dynamic'
    Pod::UI.warn '[Luciq] LUCIQ_USE_SPM=1 requires USE_FRAMEWORKS=dynamic; ' \
                 'falling back to CocoaPods.'
    spm_requested = false
  end

  # CocoaPods by default; SwiftPM only when opted in and supported.
  if spm_requested && add_luciq_spm_dependency!(spec)
    Pod::UI.puts "[Luciq] Linking native SDK #{version} via SwiftPM".green
  elsif custom_podspec
    # The app's Podfile resolves the pod from the custom podspec; the library's
    # podspec keeps a version-less dependency so CocoaPods accepts that build.
    Pod::UI.puts "[Luciq] Linking native SDK from custom podspec #{custom_podspec}".yellow
    if (!spec)
      pod 'Luciq', :podspec => custom_podspec
    else
      spec.dependency 'Luciq'
    end
  else
    Pod::UI.puts "[Luciq] Linking native SDK #{version} via CocoaPods".green
    if (!spec)
      pod 'Luciq', version
    else
      spec.dependency 'Luciq', version
    end
  end

  $luciq
end
