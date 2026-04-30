require 'json'
require_relative './ios/native'

package = JSON.parse(File.read('package.json'))

Pod::Spec.new do |s|
  s.name         = 'RNLuciq'
  s.version      = package["version"]
  s.summary      = package["description"]
  s.author       = package["author"]
  s.license      = package["license"]
  s.homepage     = package["homepage"]
  s.source       = { :git => "https://github.com/Instabug/Instabug-React-Native.git", :tag => 'v' + package["version"] }

  s.platform     = :ios, "15.0"
  s.source_files = "ios/**/*.{h,m,mm}"

  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency 'React-Core'
  end

  use_luciq!(s)

end
