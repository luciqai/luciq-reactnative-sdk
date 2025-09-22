#!/bin/bash

# Replaces the internal Config.plist file inside the Luciq iOS SDK with the
# Luciq.plist file in the example app.
#
# This is a workaround until the iOS SDK is updated to prioritize the custom
# Luciq.plist over the internal Config.plist.

luciq_plist=examples/default/ios/LuciqExample/LuciqConfig.plist

if [ ! -f $luciq_plist ]; then
  echo "Luciq.plist not found"
  exit 1
fi

for dir in examples/default/ios/Pods/Luciq/LuciqSDK.xcframework/ios-*/
do
  echo "Replacing Config.plist in $dir"

  config_path=$dir/LuciqSDK.framework/LuciqResources.bundle/Config.plist

  if [ ! -f $config_path ]; then
    echo "Config.plist not found in $dir"
    exit 0
  fi

  cp -f $luciq_plist $config_path
done
