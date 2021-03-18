# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :phoenix_webrtc,
  ecto_repos: [PhoenixWebrtc.Repo]

# Configures the endpoint
config :phoenix_webrtc, PhoenixWebrtcWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "1Q/rtBfG1oIJ/FEKcMzaqwlpJ+wF7Dzd/3dQid/37enMgqE8DcfHJBn6vegE2QzC",
  render_errors: [view: PhoenixWebrtcWeb.ErrorView, accepts: ~w(html json), layout: false],
  pubsub_server: PhoenixWebrtc.PubSub,
  live_view: [signing_salt: "tZKVIzgd"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
