# frozen_string_literal: true

require "rails/engine"

module TurboFx
  class Engine < ::Rails::Engine
    # importmap-rails があれば、gem の importmap 定義を読み込ませる。
    # （Propshaft が app/assets/* を自動でアセットパスに載せるため、
    #   アセットパスの明示登録は不要。）
    initializer "turbo_fx.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << root.join("config/importmap.rb")
      end
    end

    # ヘルパーをビューに自動 include
    initializer "turbo_fx.helper" do
      ActiveSupport.on_load(:action_view) do
        include TurboFx::Helper
      end
    end
  end
end
