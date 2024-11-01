{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = "minimal-activitypub";
          version = "0.1.0";
          src = ./.;
          npmDepsHash = "sha256-0000000000000000000000000000000000000000000="; # You'll need to update this
          
          buildInputs = with pkgs; [
            nodejs
            typescript
          ];

          installPhase = ''
            mkdir -p $out/bin
            mkdir -p $out/lib/node_modules/minimal-activitypub
            cp -r dist package.json $out/lib/node_modules/minimal-activitypub/
            makeWrapper ${pkgs.nodejs}/bin/node $out/bin/minimal-activitypub \
              --add-flags "$out/lib/node_modules/minimal-activitypub/dist/server.js"
          '';
        };
      }
    ) // {
      nixosModule = { config, lib, pkgs, ... }:
        let
          cfg = config.services.minimal-activitypub;
        in {
          options.services.minimal-activitypub = with lib; {
            enable = mkEnableOption "minimal-activitypub";
            port = mkOption {
              type = types.port;
              default = 3000;
              description = "Port to listen on";
            };
            user = mkOption {
              type = types.str;
              default = "activitypub";
              description = "User to run the service as";
            };
            group = mkOption {
              type = types.str;
              default = "activitypub";
              description = "Group to run the service as";
            };
            domain = mkOption {
              type = types.str;
              description = "Domain name for the ActivityPub server";
            };
            username = mkOption {
              type = types.str;
              default = "alice";
              description = "Username for the ActivityPub actor";
            };
          };

          config = lib.mkIf cfg.enable {
            users.users.${cfg.user} = {
              isSystemUser = true;
              group = cfg.group;
              description = "Minimal ActivityPub server user";
            };

            users.groups.${cfg.group} = {};

            services.nginx = {
              enable = true;
              recommendedProxySettings = true;
              recommendedTlsSettings = true;
              virtualHosts.${cfg.domain} = {
                enableACME = true;
                forceSSL = true;
                locations = {
                  "/users/" = {
                    proxyPass = "http://127.0.0.1:${toString cfg.port}";
                    proxyWebsockets = true;
                  };
                };
              };
            };

            systemd.services.minimal-activitypub = {
              wantedBy = [ "multi-user.target" ];
              after = [ "network.target" ];

              serviceConfig = {
                Type = "simple";
                User = cfg.user;
                Group = cfg.group;
                ExecStart = "${self.packages.${pkgs.system}.default}/bin/minimal-activitypub";
                Restart = "always";
                RestartSec = "10";
                WorkingDirectory = "/var/lib/minimal-activitypub";
              };

              environment = {
                PORT = toString cfg.port;
                DOMAIN = cfg.domain;
                USERNAME = cfg.username;
              };
            };

            systemd.tmpfiles.rules = [
              "d /var/lib/minimal-activitypub 0750 ${cfg.user} ${cfg.group} -"
            ];
          };
        };
    };
}

