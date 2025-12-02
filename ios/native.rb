$luciq= { :version => '19.1.49' }

def use_luciq! (spec = nil)
  version = $luciq[:version]
  if (!spec)
    pod 'Luciq', version
  else
    spec.dependency 'Luciq', version
  end

  $luciq
end
