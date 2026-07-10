#!/usr/bin/env bash
# wappa-skills — bu depodaki skill'leri bu makinenin ~/.claude/skills/ dizinine
# SYMLINK olarak kurar. Böylece Claude Code hangi projede çalışırsan çalış bu
# skill'leri global olarak görür; depodaki düzenlemeler anında yansır.
#
# Kullanım (yeni bir PC'de):
#   git clone <bu-depo> && cd wappa-skills && ./install.sh
# veya bu klasör zaten senkronluysa (git/iCloud/Drive):
#   ./install.sh
#
# Tekrar çalıştırmak güvenlidir (idempotent). Mevcut GERÇEK bir skill dizini varsa
# üzerine yazmaz; <ad>.bak olarak yedekler ve symlink'i kurar.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$HOME/.claude/skills"
mkdir -p "$TARGET"

installed=0
for dir in "$REPO_DIR"/*/; do
  name="$(basename "$dir")"
  # Sadece içinde SKILL.md olan klasörleri skill say
  [ -f "$dir/SKILL.md" ] || continue
  link="$TARGET/$name"

  if [ -L "$link" ]; then
    rm -f "$link"                       # eski symlink'i tazele
  elif [ -e "$link" ]; then
    mv "$link" "$link.bak"              # gerçek dizini yedekle, ezme
    echo "↷ $name: mevcut dizin $name.bak olarak yedeklendi"
  fi

  ln -sfn "${dir%/}" "$link"
  echo "✓ $name -> ${dir%/}"
  installed=$((installed + 1))
done

echo
echo "$installed skill kuruldu: $TARGET"
echo "Claude Code'u yeniden başlat (ya da yeni oturum aç) ki skill'leri görsün."
