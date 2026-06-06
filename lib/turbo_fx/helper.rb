# frozen_string_literal: true

module TurboFx
  module Helper
    extend self

    def turbo_fx(effect, **options)
      if effect.to_s == "off"
        return { data: { turbo_fx: "off" } }
      end

      data = {
        controller: "turbo-fx",
        turbo_fx: effect.to_s
      }

      options.each do |key, value|
        data[:"turbo_fx_#{key}_value"] = value.to_s
      end

      { data: data }
    end
  end
end
