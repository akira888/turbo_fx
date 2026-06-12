# frozen_string_literal: true

module TurboFx
  module Helper
    extend self

    EFFECTS = %w[glitch blur rgb_shift flash].freeze

    def turbo_fx(effect, **options)
      effect = effect.to_s
      return { data: { turbo_fx: "off" } } if effect == "off"

      unless EFFECTS.include?(effect)
        raise ArgumentError,
          "unknown turbo_fx effect: #{effect.inspect} (available: #{EFFECTS.join(', ')}, off)"
      end

      data = {
        controller: "turbo-fx",
        # DOM / CSS 層はダッシュ区切りで統一する（:rgb_shift → "rgb-shift"）
        turbo_fx: effect.tr("_", "-")
      }

      options.each do |key, value|
        data[:"turbo_fx_#{key}_value"] = value.to_s
      end

      { data: data }
    end
  end
end
