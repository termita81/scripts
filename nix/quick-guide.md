# [NixOS](https://nixos.org/) on [UTM](https://docs.getutm.app/) (Apple Silicon)

## Download and Install

Get the aarch64 (ARM64) NixOS ISO from [https://nixos.org/download](https://nixos.org/download). The minimal ISO is fine. The graphical one adds a Calamares installer if you’d rather click through. Check the ISO: `sha256sum <iso file name>` and compare with website, or `sha256sum <iso file name> <checksum file name>` if checksum file also downloaded.

Create the VM in UTM: choose `Virtualize` → `Linux`, select the ISO under Boot ISO Image, and give it 8 GB RAM, 6+ cores and a 64 GB+ disk. Skip the shared directory.

Boot the ISO, open a terminal, and run `sudo -i`. Check your disk name with `lsblk`; it’s usually `/dev/vda`.

Partition and format (UEFI):
- `parted /dev/vda -- mklabel gpt`
- `parted /dev/vda -- mkpart ESP fat32 1MB 512MB`
- `parted /dev/vda -- set 1 esp on`
- `parted /dev/vda -- mkpart root ext4 512MB 100%`
- `mkfs.fat -F 32 -n boot /dev/vda1`
- `mkfs.ext4 -L nixos /dev/vda2`

Mount:
- `mount /dev/disk/by-label/nixos /mnt`
- `mkdir -p /mnt/boot`
- `mount -o umask=077 /dev/disk/by-label/boot /mnt/boot`

Generate the config: `nixos-generate-config --root /mnt`

Edit `/mnt/etc/nixos/configuration.nix` (use `nano`). Add at least:

```nix
   networking.networkmanager.enable = true;
   services.qemuGuest.enable = true;
   services.spice-vdagentd.enable = true;
   services.openssh.enable = true;
   users.users.boss = {
     isNormalUser = true;
     extraGroups = [ "wheel" "networkmanager" ];
   };
   environment.systemPackages = with pkgs; [ git vim ];
```

`systemd-boot` is already set up by the generated config for UEFI.

Install: `nixos-install`, then set the root password when prompted.

Finish: run `reboot`.

Before it restarts, eject the ISO in UTM (`CD/DVD` → `Clear`), or it will boot the installer again.

At this time (2026/10/22) rebooting leads to black screens, so halt/poweroff and then power back on instead of restarting. Add a serial device in UTM (`Devices` → `New` → `Serial`, mode `Built-in terminal`). Boot messages and a login prompt will show up in a separate serial window even if the display stays inactive. That will tell whether the system is booting fine and only the display is the problem, or whether it fails earlier.

After first boot: log in as root, run `passwd boss` to set your user password, then manage everything through `/etc/nixos/configuration.nix` and `sudo nixos-rebuild switch`.

For a desktop, add `services.xserver.enable = true;` plus a desktop module such as `services.desktopManager.gnome.enable = true;` and `services.displayManager.gdm.enable = true;`.

Option names occasionally change between releases, so check the manual for your NixOS version.

Go and [learn NixOS](https://nixos.org/learn/).
