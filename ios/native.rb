$luciq= { :version => '19.3.1' }

def use_luciq! (spec = nil)
  version = $luciq[:version]
  if (!spec)
    pod 'Luciq', version
  else
    spec.dependency 'Luciq', version
  end

  $luciq
end
