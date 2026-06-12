# frozen_string_literal: true

require "spec_helper"

RSpec.describe TurboFx::Helper do
  # ヘルパーは module method として直接呼べる形にする
  subject(:result) { described_class.turbo_fx(*args, **opts) }

  let(:args) { [:glitch] }
  let(:opts) { {} }

  describe "turbo_fx(:glitch)" do
    it "returns controller and effect data attributes" do
      expect(result).to eq(
        data: { controller: "turbo-fx", turbo_fx: "glitch" }
      )
    end
  end

  describe "turbo_fx(:blur)" do
    let(:args) { [:blur] }

    it "returns blur as the effect data attribute" do
      expect(result).to eq(
        data: { controller: "turbo-fx", turbo_fx: "blur" }
      )
    end
  end

  describe "turbo_fx(:rgb_shift)" do
    let(:args) { [:rgb_shift] }

    it "dasherizes the effect name for the DOM layer" do
      expect(result).to eq(
        data: { controller: "turbo-fx", turbo_fx: "rgb-shift" }
      )
    end
  end

  describe "turbo_fx(:flash)" do
    let(:args) { [:flash] }

    it "returns flash as the effect data attribute" do
      expect(result).to eq(
        data: { controller: "turbo-fx", turbo_fx: "flash" }
      )
    end
  end

  describe "turbo_fx(:sparkle) — unknown effect" do
    let(:args) { [:sparkle] }

    it "raises ArgumentError naming the bad effect and the available ones" do
      expect { result }.to raise_error(ArgumentError, /sparkle.*glitch, blur, rgb_shift, flash/m)
    end
  end

  describe "turbo_fx(:off)" do
    let(:args) { [:off] }

    it "returns only the turbo_fx flag without a controller" do
      expect(result).to eq(
        data: { turbo_fx: "off" }
      )
    end
  end

  describe "turbo_fx(:glitch, duration: 400)" do
    let(:opts) { { duration: 400 } }

    it "appends a stimulus value data attribute as a string" do
      expect(result).to eq(
        data: {
          controller: "turbo-fx",
          turbo_fx: "glitch",
          turbo_fx_duration_value: "400"
        }
      )
    end
  end

  describe "turbo_fx(:glitch, intensity: 0.8)" do
    let(:opts) { { intensity: 0.8 } }

    it "converts any option key to turbo_fx_<key>_value generically" do
      expect(result).to eq(
        data: {
          controller: "turbo-fx",
          turbo_fx: "glitch",
          turbo_fx_intensity_value: "0.8"
        }
      )
    end
  end

  describe "turbo_fx(:glitch, duration: 400, intensity: 0.8)" do
    let(:opts) { { duration: 400, intensity: 0.8 } }

    it "appends every option as a stimulus value attribute" do
      expect(result).to eq(
        data: {
          controller: "turbo-fx",
          turbo_fx: "glitch",
          turbo_fx_duration_value: "400",
          turbo_fx_intensity_value: "0.8"
        }
      )
    end
  end

  describe "return value contract" do
    it "always returns a Hash with exactly a :data key" do
      expect(result.keys).to eq([:data])
    end

    it "data values are all strings or symbols (HTML-safe attribute values)" do
      result[:data].each_value do |v|
        expect(v).to be_a(String)
      end
    end
  end
end
