# frozen_string_literal: true

require_relative "lib/turbo_fx/version"

Gem::Specification.new do |spec|
  spec.name        = "turbo_fx"
  spec.version     = TurboFx::VERSION
  spec.authors     = ["akira888"]
  spec.email       = ["a.cup.of.happiness@gmail.com"]
  spec.summary     = "Visual glitch effects for Hotwire/Turbo content updates"
  spec.description = "Inject digital glitch effects (RGB shift + slice tearing) when Turbo Frame/Stream content is replaced or appears."
  spec.homepage    = "https://github.com/akira888/turbo_fx"
  spec.license     = "MIT"
  spec.required_ruby_version = ">= 3.2"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage

  spec.files = Dir[
    "lib/**/*",
    "app/**/*",
    "config/**/*",
    "README.md"
  ]
  spec.require_paths = ["lib"]

  spec.add_dependency "rails", ">= 7.0"
end
