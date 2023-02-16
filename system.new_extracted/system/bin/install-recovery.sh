#!/system/bin/sh
if ! applypatch -c EMMC:/dev/block/recovery:20971520:209d7410d4141d9379947928b4ff7e9b2d45e834; then
  applypatch  EMMC:/dev/block/boot:16777216:064ce6bb41238a8749b26f3f2998b22918f18c60 EMMC:/dev/block/recovery 209d7410d4141d9379947928b4ff7e9b2d45e834 20971520 064ce6bb41238a8749b26f3f2998b22918f18c60:/system/recovery-from-boot.p && log -t recovery "Installing new recovery image: succeeded" || log -t recovery "Installing new recovery image: failed"
else
  log -t recovery "Recovery image already installed"
fi
